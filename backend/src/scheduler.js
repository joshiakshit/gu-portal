import cron       from 'node-cron';
import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
import * as fs     from 'fs';

import { login, clickToPage }              from './scrape.js';
import { scrapeAttendance, scrapeTimetable } from './scraper.js';
import { cacheDaywiseAttendance }           from './scrapeDaywise.js';
import { computeTodayFireTimes }            from './cronHelpers.js';
import { reconcileToday, writeTodayAttendance } from './reconcile.js';

dotenv.config();

const TIMEOUT  = 30_000;
const USERNAME  = process.env.GU_USERNAME;
const TOTP_SECRET = process.env.GU_TOTP_SECRET;

if (!USERNAME || !TOTP_SECRET) {
  console.error('[scheduler] ERROR: GU_USERNAME and GU_TOTP_SECRET must be set in .env');
  process.exit(1);
}

async function withFreshSession(taskLabel, task) {
  console.error(`[scheduler] Starting fresh session for: ${taskLabel}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const { context, page } = await login(browser, USERNAME, TOTP_SECRET);
    await task(page);
    console.error(`[scheduler] ✓ ${taskLabel} completed.`);
  } catch (err) {
    console.error(`[scheduler] ✗ ${taskLabel} failed:`, err.message);
  } finally {
    await browser.close();
  }
}

async function runTimetableRefresh() {
  await withFreshSession('timetable refresh', async (page) => {
    await clickToPage(page, 'timetable');

    fs.mkdirSync('cache', { recursive: true });

    for (let i = 0; i < 4; i++) {
      const headerText = await page.$eval(
        'table tr:first-child th, table tr:first-child td',
        el => el.textContent.trim().replace(/\s+/g, ' ')
      ).catch(() => `week${i}`);

      console.error(`[timetable] Scraping week ${i} — ${headerText}`);
      const slots = await scrapeTimetable(page);
      fs.writeFileSync(
        `cache/timetable_week${i}.json`,
        JSON.stringify({ cachedAt: new Date().toISOString(), header: headerText, slots }, null, 2)
      );
      console.error(`[cache] Written: cache/timetable_week${i}.json`);

      if (i < 3) {
        const nextBtn = await page.$('a[ng-click*="next"]');
        if (!nextBtn) {
          console.error('[timetable] Next button not found — stopping at week', i);
          break;
        }
        await nextBtn.click();
        await page.waitForFunction(
          prev => {
            const el = document.querySelector('table tr:first-child th, table tr:first-child td');
            return el && el.textContent.trim().replace(/\s+/g, ' ') !== prev;
          },
          headerText,
          { timeout: TIMEOUT }
        ).catch(() => console.error('[timetable] Warning: header change timeout'));
        await page.waitForTimeout(2000);
      }
    }
  });
}


async function runAttendanceRefresh(label = '', upToTime = null) {
  const tag = label ? ` (${label})` : '';
  await withFreshSession(`attendance refresh${tag}`, async (page) => {
    await clickToPage(page, 'attendance');
    await page.waitForSelector('a[href*="subwise_attendace_new.php"]', { timeout: TIMEOUT });
    const courseTab = await page.$('a[href*="subwise_attendace_new.php"]');
    if (!courseTab) throw new Error('Course Wise tab not found');
    console.error('[scheduler] Clicking Course Wise tab...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }),
      courseTab.click(),
    ]);
    await page.waitForTimeout(2000);

    const attendance = await scrapeAttendance(page);
    fs.mkdirSync('cache', { recursive: true });
    fs.writeFileSync(
      'cache/attendance.json',
      JSON.stringify({ cachedAt: new Date().toISOString(), data: attendance }, null, 2)
    );
    console.error(`[cache] Written: cache/attendance.json (${attendance.length} rows)`);

    await cacheDaywiseAttendance(page, clickToPage);

    const slots = reconcileToday(upToTime);
    writeTodayAttendance(slots);
  });
}


let attendanceTasks = []; 

function registerAttendanceCrons() {
  attendanceTasks.forEach(t => t.stop());
  attendanceTasks = [];

  const fireTimes = computeTodayFireTimes();

  if (fireTimes.length === 0) {
    console.log('[scheduler] No attendance crons to register for today.');
    return;
  }

  const now = new Date();

  for (const { courseCode, type, fireAt, cronExpression } of fireTimes) {
    if (fireAt <= now) {
      console.log(
        `[scheduler] Skipping ${courseCode} (${type}) — ` +
        `${fireAt.toLocaleTimeString('en-IN')} already passed.`
      );
      continue;
    }

    console.log(
      `[scheduler] Registering: ${courseCode} (${type}) ` +
      `at ${fireAt.toLocaleTimeString('en-IN')} → cron "${cronExpression}"`
    );

    const task = cron.schedule(cronExpression, () => {
      runAttendanceRefresh(`${courseCode} ${type}`, fireAt);
    });

    attendanceTasks.push(task);
  }

  console.log(`[scheduler] ${attendanceTasks.length} attendance cron(s) active.`);
}

cron.schedule('0 1 * * *', () => {
  console.log('[scheduler] 01:00 — running timetable refresh...');
  runTimetableRefresh();
});
console.log('[scheduler] Registered: timetable refresh → daily 01:00');

cron.schedule('1 1 * * *', () => {
  console.log('[scheduler] 01:01 — re-registering attendance crons for new day...');
  registerAttendanceCrons();
});
console.log('[scheduler] Registered: attendance cron re-registration → daily 01:01');
cron.schedule('0 18 * * *', () => {
  console.log('[scheduler] 18:00 — running final attendance reconcile...');
  runAttendanceRefresh('6PM final', null);
});
console.log('[scheduler] Registered: final attendance check → daily 18:00');

console.log('[scheduler] Bootstrap — registering today\'s attendance crons...');
registerAttendanceCrons();
console.log('[scheduler] Scheduler is live. Press Ctrl+C to stop.');
