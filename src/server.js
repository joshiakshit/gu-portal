import express   from 'express';
import cors      from 'cors';
import fs        from 'fs';
import path      from 'path';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR  = path.join(__dirname, '..', 'cache');
const LOCK_FILE  = path.join(CACHE_DIR, '.scraping');
const SCRAPE_JS  = path.join(__dirname, 'scrape.js');
const PORT       = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

function readCache(filename) {
  const p = path.join(CACHE_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch (e) { return null; }
}

function cacheAge(cachedAt) {
  if (!cachedAt) return null;
  return Math.round((Date.now() - new Date(cachedAt).getTime()) / 60_000);
}

function isLocked() {
  return fs.existsSync(LOCK_FILE);
}

function acquireLock() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(LOCK_FILE, new Date().toISOString());
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
}

function sendCache(res, filename, dataKey = 'data') {
  const cache = readCache(filename);
  if (!cache) {
    return res.status(404).json({
      success: false,
      error:   `Cache not found: ${filename}. Run POST /refresh to populate.`,
    });
  }
  return res.json({
    success:      true,
    cachedAt:     cache.cachedAt,
    ageMinutes:   cacheAge(cache.cachedAt),
    [dataKey]:    cache[dataKey] ?? cache,
  });
}


app.get('/status', (req, res) => {
  const files = [
    { key: 'attendance',       file: 'attendance.json' },
    { key: 'today_attendance', file: 'today_attendance.json' },
    { key: 'daywise',          file: 'daywise_attendance.json' },
    { key: 'timetable_week0',  file: 'timetable_week0.json' },
    { key: 'timetable_week1',  file: 'timetable_week1.json' },
    { key: 'timetable_week2',  file: 'timetable_week2.json' },
    { key: 'timetable_week3',  file: 'timetable_week3.json' },
  ];

  const caches = {};
  for (const { key, file } of files) {
    const cache = readCache(file);
    caches[key] = cache
      ? { exists: true,  cachedAt: cache.cachedAt, ageMinutes: cacheAge(cache.cachedAt) }
      : { exists: false, cachedAt: null,            ageMinutes: null };
  }

  res.json({
    success:   true,
    scraping:  isLocked(),
    caches,
  });
});


app.get('/attendance', (req, res) => {
  sendCache(res, 'attendance.json', 'data');
});

app.get('/attendance/today', (req, res) => {
  const cache = readCache('today_attendance.json');
  if (!cache) {
    return res.status(404).json({
      success: false,
      error: 'today_attendance.json not found. Will be populated by scheduler after first class ends.',
    });
  }
  res.json({
    success:    true,
    cachedAt:   cache.cachedAt,
    ageMinutes: cacheAge(cache.cachedAt),
    date:       cache.date,
    slots:      cache.slots,
  });
});

app.get('/attendance/daywise', (req, res) => {
  sendCache(res, 'daywise_attendance.json', 'data');
});

app.get('/timetable', (req, res) => {
  const cache = readCache('timetable_week0.json');
  if (!cache) {
    return res.status(404).json({
      success: false,
      error: 'timetable_week0.json not found.',
    });
  }
  res.json({
    success:    true,
    cachedAt:   cache.cachedAt,
    ageMinutes: cacheAge(cache.cachedAt),
    header:     cache.header,
    slots:      cache.slots,
  });
});

app.get('/timetable/:week', (req, res) => {
  const week = parseInt(req.params.week);
  if (isNaN(week) || week < 0 || week > 3) {
    return res.status(400).json({
      success: false,
      error: 'Week must be 0-3.',
    });
  }
  const cache = readCache(`timetable_week${week}.json`);
  if (!cache) {
    return res.status(404).json({
      success: false,
      error: `timetable_week${week}.json not found.`,
    });
  }
  res.json({
    success:    true,
    cachedAt:   cache.cachedAt,
    ageMinutes: cacheAge(cache.cachedAt),
    header:     cache.header,
    slots:      cache.slots,
  });
});


function runScrape(mode) {
  return new Promise((resolve, reject) => {
    acquireLock();
    console.error(`[server] Starting scrape: ${mode}`);

    execFile('node', [SCRAPE_JS, mode], { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
      releaseLock();
      if (err) {
        console.error('[server] Scrape failed:', stderr);
        return reject(new Error(stderr || err.message));
      }
      console.error(`[server] Scrape complete: ${mode}`);
      resolve(stdout);
    });
  });
}

app.post('/refresh/attendance', async (req, res) => {
  if (isLocked()) {
    return res.status(409).json({ success: false, error: 'Scrape already in progress.' });
  }
  try {
    await runScrape('attendance');
    res.json({ success: true, message: 'Attendance cache refreshed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/refresh/timetable', async (req, res) => {
  if (isLocked()) {
    return res.status(409).json({ success: false, error: 'Scrape already in progress.' });
  }
  try {
    await runScrape('timetable');
    res.json({ success: true, message: 'Timetable cache refreshed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/refresh/all', async (req, res) => {
  if (isLocked()) {
    return res.status(409).json({ success: false, error: 'Scrape already in progress.' });
  }
  try {
    await runScrape('all');
    res.json({ success: true, message: 'All caches refreshed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Unknown endpoint: ${req.method} ${req.path}` });
});

releaseLock();

app.listen(PORT, () => {
  console.log(`[server] GU Portal API running on http://localhost:${PORT}`);
  console.log(`[server] Endpoints: GET /status, /attendance, /attendance/today, /attendance/daywise, /timetable, /timetable/:week`);
  console.log(`[server] Refresh:   POST /refresh/attendance, /refresh/timetable, /refresh/all`);
});