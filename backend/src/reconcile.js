import fs   from 'fs';
import path from 'path';
const CACHE_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'cache');


function parseTimeRange(timeStr) {
  const [startRaw, endRaw] = timeStr.split('-').map(s => s.trim());
  const [startH, startM]   = startRaw.split(':').map(Number);
  const [endH,   endM]     = endRaw.split(':').map(Number);
  return { startH, startM, endH, endM };
}

function toMins(h, m) { return h * 60 + m; }

function todayDateString() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];


function loadJSON(filename) {
  const p = path.join(CACHE_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch (e) { console.error(`[reconcile] Failed to parse ${filename}:`, e.message); return null; }
}


function getTodaySlots(upToTime) {
  const week0 = loadJSON('timetable_week0.json');
  if (!week0 || !Array.isArray(week0.slots)) return [];

  const today    = DAY_NAMES[new Date().getDay()];
  const sampleRow = week0.slots[0];
  if (!sampleRow) return [];

  const todayKey = Object.keys(sampleRow).find(k => k.startsWith(today));
  if (!todayKey) return [];

  const nowMins = upToTime
    ? toMins(upToTime.getHours(), upToTime.getMinutes())
    : Infinity;

  const slots = [];
  for (const row of week0.slots) {
    const cell = row[todayKey];
    if (!cell || !cell.courseCode || !cell.type) continue;
    if (!row.time) continue;

    const parsed = parseTimeRange(row.time);
    const endMins = toMins(parsed.endH, parsed.endM);

    if (endMins > nowMins) continue;

    slots.push({
      time:       row.time,
      courseCode: cell.courseCode,
      type:       cell.type,
      room:       cell.room,
      parsed,
    });
  }

  return slots;
}

function getCourseWiseStatus(courseCode, type, courseWiseData) {
  if (!Array.isArray(courseWiseData)) return null;

  const row = courseWiseData.find(r => {
    const code = (r['Course Code'] || '').trim();
    const name = (r['Course Short Name'] || '').toUpperCase();
    return code === courseCode && name.includes(type);
  });

  if (!row) return null;

  const adStr = row['Attended/Delivered'] || '';
  const [attended, delivered] = adStr.split('/').map(Number);
  if (isNaN(attended) || isNaN(delivered) || delivered === 0) return null;

  const pct = (attended / delivered) * 100;

  return { type: 'ratio_only', attended, delivered, pct: pct.toFixed(2) };
}

function getDayWiseStatus(courseCode, timeStr, daywiseData) {
  if (!Array.isArray(daywiseData)) return null;

  const todayStr = todayDateString();

  const todayRows = daywiseData.filter(row => {
    const vals = Object.values(row).join(' ');
    return vals.includes(todayStr) || vals.includes(new Date().toLocaleDateString('en-IN'));
  });

  if (todayRows.length === 0) return null;

  const match = todayRows.find(row => {
    const vals = Object.values(row).join(' ').toLowerCase();
    return vals.includes(courseCode.toLowerCase()) &&
           vals.includes(timeStr.replace(' ', '').toLowerCase());
  });

  if (!match) return null;

  for (const val of Object.values(match)) {
    const v = val.trim().toLowerCase();
    if (v === 'present' || v === 'p') return 'present';
    if (v === 'absent'  || v === 'a') return 'absent';
  }

  return null;
}

export function reconcileToday(upToTime = null) {
  const courseWiseCache = loadJSON('attendance.json');
  const daywiseCache    = loadJSON('daywise_attendance.json');

  const courseWiseData = courseWiseCache?.data  ?? [];
  const daywiseData    = daywiseCache?.data     ?? [];

  const todaySlots = getTodaySlots(upToTime);

  if (todaySlots.length === 0) {
    console.error('[reconcile] No slots to reconcile for today up to', upToTime);
    return [];
  }

  const results = [];

  for (const slot of todaySlots) {
    const { time, courseCode, type, room } = slot;

    const cwResult  = getCourseWiseStatus(courseCode, type, courseWiseData);
    const dwStatus  = getDayWiseStatus(courseCode, time, daywiseData);

    let status = 'unknown';

    if (dwStatus === 'present') {
      status = 'present';
    } else if (dwStatus === 'absent') {
      status = 'absent';
    } else if (cwResult?.type === 'ratio_only') {
      status = 'unknown';
    }

    results.push({
      time,
      courseCode,
      type,
      room,
      status,
      sources: {
        dayWise:    dwStatus   ?? null,
        courseWise: cwResult   ?? null,
      },
    });
  }

  return results;
}

export function writeTodayAttendance(slots) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const out = {
    cachedAt: new Date().toISOString(),
    date:     todayDateString(),
    slots,
  };
  fs.writeFileSync(
    path.join(CACHE_DIR, 'today_attendance.json'),
    JSON.stringify(out, null, 2)
  );
  console.error(`[reconcile] Written: cache/today_attendance.json (${slots.length} slots)`);
}