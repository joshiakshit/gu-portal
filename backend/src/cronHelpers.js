import fs from 'fs';
import path from 'path';

const CACHE_DIR = './cache';

function parseTimeRange(timeStr) {
  const [startRaw, endRaw] = timeStr.split('-').map(s => s.trim());
  const [startH, startM]   = startRaw.split(':').map(Number);
  const [endH,   endM]     = endRaw.split(':').map(Number);
  return { startH, startM, endH, endM };
}

function toMins(h, m) { return h * 60 + m; }

function isBackToBack(parsedA, parsedB) {
  return toMins(parsedA.endH, parsedA.endM) === toMins(parsedB.startH, parsedB.startM);
}

function addOneMinute(endH, endM) {
  let fireM = endM + 1;
  let fireH = endH;
  if (fireM >= 60) { fireM -= 60; fireH += 1; }
  return { fireH, fireM };
}

function loadWeek0() {
  const file = path.join(CACHE_DIR, 'timetable_week0.json');
  if (!fs.existsSync(file)) {
    console.error('[cronHelpers] cache/timetable_week0.json not found');
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function findTodayKey(slots) {
  const today = DAY_NAMES[new Date().getDay()];
  if (!slots || slots.length === 0) return null;
  const sampleRow = slots[0];
  return Object.keys(sampleRow).find(k => k.startsWith(today)) || null;
}

export function computeTodayFireTimes() {
  const cache = loadWeek0();
  if (!cache || !Array.isArray(cache.slots) || cache.slots.length === 0) {
    console.error('[cronHelpers] No timetable slots available.');
    return [];
  }

  const todayKey = findTodayKey(cache.slots);
  if (!todayKey) {
    console.log('[cronHelpers] No timetable column found for today.');
    return [];
  }

  console.error(`[cronHelpers] Today's column key: "${todayKey}"`);

  const todayClasses = [];
  for (const row of cache.slots) {
    const cell = row[todayKey];
    if (!cell || !cell.courseCode || !cell.type) continue;
    if (!row.time) continue;
    todayClasses.push({
      time:       row.time,
      parsed:     parseTimeRange(row.time),
      courseCode: cell.courseCode,
      type:       cell.type,
      room:       cell.room,
    });
  }

  if (todayClasses.length === 0) {
    console.log('[cronHelpers] No classes today — no attendance crons needed.');
    return [];
  }

  todayClasses.sort((a, b) =>
    toMins(a.parsed.startH, a.parsed.startM) - toMins(b.parsed.startH, b.parsed.startM)
  );

  const byCourse = {};
  for (const cls of todayClasses) {
    (byCourse[cls.courseCode] ??= []).push(cls);
  }

  const results = [];

  for (const [courseCode, classes] of Object.entries(byCourse)) {
    const type = classes[0].type;

    if (type !== 'PP' && type !== 'PR') {
      console.log(`[cronHelpers] Skipping ${courseCode} (${type}) — no cron needed.`);
      continue;
    }

    let fireAfter = null;

    if (type === 'PP') {
      if (classes.length >= 2 && isBackToBack(classes[0].parsed, classes[1].parsed)) {
        fireAfter = { endH: classes[1].parsed.endH, endM: classes[1].parsed.endM };
        console.error(`[cronHelpers] ${courseCode} PP: back-to-back → fire after slot 2 (${classes[1].time})`);
      } else {
        fireAfter = { endH: classes[0].parsed.endH, endM: classes[0].parsed.endM };
        console.error(`[cronHelpers] ${courseCode} PP: single slot → fire after slot 1 (${classes[0].time})`);
      }
    } else if (type === 'PR') {
      if (classes.length >= 2) {
        fireAfter = { endH: classes[1].parsed.endH, endM: classes[1].parsed.endM };
        console.error(`[cronHelpers] ${courseCode} PR: fire after slot 2 (${classes[1].time})`);
      } else {
        fireAfter = { endH: classes[0].parsed.endH, endM: classes[0].parsed.endM };
        console.error(`[cronHelpers] ${courseCode} PR: only 1 slot found — fire after it (${classes[0].time})`);
      }
    }

    if (!fireAfter) continue;

    const { fireH, fireM } = addOneMinute(fireAfter.endH, fireAfter.endM);

    if (fireH >= 24) {
      console.error(`[cronHelpers] ${courseCode}: fire time overflows midnight — skipping.`);
      continue;
    }

    const fireAt = new Date();
    fireAt.setHours(fireH, fireM, 0, 0);

    const cronExpression = `${fireM} ${fireH} * * *`;

    results.push({ courseCode, type, fireAt, cronExpression });
  }

  return results;
}
