import { chromium } from 'playwright';
import { TOTP } from 'otpauth';
import * as dotenv from 'dotenv';
import { scrapeAttendance, scrapeTimetable } from './scraper.js';

dotenv.config();

const BASE        = 'https://gustudent.icloudems.com/corecampus';
const KC_AUTH_URL =
  'https://usermanagement.icloudems.com/realms/production/protocol/openid-connect/auth' +
  '?client_id=GUSTUDENT' +
  '&redirect_uri=https%3A%2F%2Fgustudent.icloudems.com%2Fcorecampus%2Ffirebasejs_files%2Fkeycloak_callback_dynamic.php' +
  '&response_type=code' +
  '&KEYCLOAK_URL=https%3A%2F%2Fusermanagement.icloudems.com' +
  '&REALM=production' +
  '&scope=openid%20email%20profile';

const URLS = {
  attendance : `${BASE}/student/attendance/myattendance.php`,
  timetable  : `${BASE}/student/schedulerand/tt_report_view.php`,
};

const TIMEOUT = 30_000;

function generateTOTP(secret) {
  return new TOTP({ secret, algorithm: 'SHA1', digits: 6, period: 30 }).generate();
}

async function waitForNextTOTP(secret) {
  const ms = 30_000 - (Date.now() % 30_000) + 1_000;
  console.error(`[auth] Waiting ${(ms / 1000).toFixed(1)}s for next TOTP window...`);
  await new Promise(r => setTimeout(r, ms));
  return generateTOTP(secret);
}

export async function login(browser, username, totpSecret) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  console.error('[auth] Loading login page...');
  await page.goto(KC_AUTH_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
  await page.waitForSelector('input[name="username"]', { timeout: TIMEOUT });

  console.error('[auth] Submitting username...');
  await page.fill('input[name="username"]', username);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }),
    page.click('input[type="submit"], button[type="submit"]'),
  ]);

  await page.waitForSelector('input[name="otp"]', { timeout: TIMEOUT });
  let otp = generateTOTP(totpSecret);
  console.error(`[auth] Submitting OTP: ${otp}`);
  await page.fill('input[name="otp"]', otp);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }),
    page.click('input[type="submit"], button[type="submit"]'),
  ]);

  await page.waitForTimeout(1000);
  if (page.url().includes('login-actions')) {
    console.error('[auth] OTP rejected — retrying with next window...');
    otp = await waitForNextTOTP(totpSecret);
    await page.fill('input[name="otp"]', '');
    await page.fill('input[name="otp"]', otp);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }),
      page.click('input[type="submit"], button[type="submit"]'),
    ]);
  }

  if (!page.url().includes('gustudent.icloudems.com')) {
    throw new Error(`Auth failed — unexpected URL: ${page.url()}`);
  }

  console.error('[auth] ✓ Authenticated');
  return { context, page };
}

export async function clickToPage(page, label) {
  const targets = {
    attendance: {
      dashIcon: 'a[href*="myattendance.php"] img',
      sideLink: 'a[href="/corecampus/student/attendance/myattendance.php"]',
    },
    timetable: {
      dashIcon: 'a[href*="tt_report_view.php"] img',
      sideLink: 'a[href="/corecampus/student/schedulerand/tt_report_view.php"]',
    },
  };

  const { dashIcon, sideLink } = targets[label];

  await page.goto('https://gustudent.icloudems.com/corecampus/student/student_index.php', {
    waitUntil: 'domcontentloaded', timeout: TIMEOUT,
  });
  await page.waitForTimeout(1500);

  const icon = await page.$(dashIcon);
  if (icon) {
    console.error(`[nav] Clicking dashboard icon for ${label}...`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }),
      icon.click(),
    ]);
  } else {
    console.error(`[nav] Icon not found — trying sidebar link for ${label}...`);
    const link = await page.$(sideLink);
    if (!link) throw new Error(`Could not find nav link for: ${label}`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }),
      link.click(),
    ]);
  }

  await page.waitForFunction(() => {
    const el = document.querySelector('[ng-app]');
    if (!el) return true;
    try {
      return !window.angular.element(el).injector().get('$http').pendingRequests.length;
    } catch(e) { return true; }
  }, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(3000);
  console.error(`[nav] Landed on: ${page.url()}`);
}
async function scrapeWeeks(page) {
  const { writeFileSync, mkdirSync } = await import('fs');
  mkdirSync('cache', { recursive: true });

  for (let i = 0; i < 4; i++) {
    const headerText = await page.$eval(
      'table tr:first-child th, table tr:first-child td',
      el => el.textContent.trim().replace(/\s+/g, ' ')
    ).catch(() => `week${i}`);

    console.error(`[timetable] Scraping week ${i} — ${headerText}`);
    const slots = await scrapeTimetable(page);
    writeFileSync(
      `cache/timetable_week${i}.json`,
      JSON.stringify({ cachedAt: new Date().toISOString(), header: headerText, slots }, null, 2)
    );
    console.error(`[cache] Written: cache/timetable_week${i}.json`);

    if (i < 3) {
      const nextBtn = await page.$('a[ng-click*="next"]');
      if (!nextBtn) throw new Error('Next button not found');
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
}

const isMain = process.argv[1] &&
  (await import('url')).fileURLToPath(import.meta.url) === (await import('path')).resolve(process.argv[1]);

if (isMain) {
  const mode       = process.argv[2] || 'all';
  const username   = process.env.GU_USERNAME;
  const totpSecret = process.env.GU_TOTP_SECRET;

  if (!username || !totpSecret) {
    console.error('ERROR: Set GU_USERNAME and GU_TOTP_SECRET in .env');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const { context, page } = await login(browser, username, totpSecret);
    const result = { success: true, timestamp: new Date().toISOString() };

    if (mode === 'attendance' || mode === 'all') {
      console.error('[main] Loading attendance page...');
      await clickToPage(page, 'attendance');
      await page.waitForSelector('a[href*="subwise_attendace_new.php"]', { timeout: TIMEOUT });
      const courseTab = await page.$('a[href*="subwise_attendace_new.php"]');
      if (!courseTab) throw new Error('Course Wise tab not found');
      console.error('[nav] Clicking Course Wise Attendance tab...');
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }),
        courseTab.click(),
      ]);
      await page.waitForTimeout(2000);

      if (process.env.DUMP_HTML) {
        const { writeFileSync } = await import('fs');
        writeFileSync('attendance_dump.html', await page.content());
        console.error('[debug] Dumped: attendance_dump.html');
      }

      result.attendance = await scrapeAttendance(page);
      const { writeFileSync: wfs, mkdirSync: mks } = await import('fs');
      mks('cache', { recursive: true });
      wfs('cache/attendance.json', JSON.stringify({ cachedAt: new Date().toISOString(), data: result.attendance }, null, 2));
      console.error('[cache] Written: cache/attendance.json');
    }

    if (mode === 'timetable' || mode === 'all') {
      console.error('[main] Loading timetable page...');
      await clickToPage(page, 'timetable');

      if (process.env.DUMP_HTML) {
        const { writeFileSync } = await import('fs');
        writeFileSync('timetable_dump.html', await page.content());
        console.error('[debug] Dumped: timetable_dump.html');
      }

      await scrapeWeeks(page);
      result.timetable = JSON.parse(
        (await import('fs')).readFileSync('cache/timetable_week0.json', 'utf8')
      ).slots;
    }

    console.log(JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('[FATAL]', err.message);
    console.log(JSON.stringify({ success: false, error: err.message }));
    process.exit(1);
  } finally {
    await browser.close();
  }
}