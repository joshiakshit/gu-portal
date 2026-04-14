import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = './cache';
const TIMEOUT   = 30_000;

export async function scrapeDaywiseAttendance(page, clickToPage) {
  await clickToPage(page, 'attendance');
  await page.waitForSelector('a[href*="myattendanceND.php"]', { timeout: TIMEOUT });
  const dayTab = await page.$('a[href*="myattendanceND.php"]');
  if (!dayTab) throw new Error('[scrapeDaywise] Day Wise tab link not found');

  console.error('[scrapeDaywise] Clicking Day Wise tab...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }).catch(() => {}),
    dayTab.click(),
  ]);

  await page.waitForSelector('table tbody tr', { timeout: TIMEOUT }).catch(() => {
    console.error('[scrapeDaywise] Warning: table rows not found within timeout');
  });
  await page.waitForTimeout(2000);

  const html = await page.content();
  const $    = cheerio.load(html);

  const rows    = [];
  let   matched = false;

  $('table').each((_, table) => {
    if (matched) return;
    const $t = $(table);

    const headers = [];
    $t.find('thead th, thead td').each((_, th) => {
      headers.push($(th).text().trim());
    });

    if (headers.length === 0) return;
    const joined = headers.join(' ').toLowerCase();
    if (!joined.includes('date') && !joined.includes('day') && !joined.includes('subject')) return;

    matched = true;
    console.error(`[scrapeDaywise] Table found — headers: [${headers.join(', ')}]`);

    $t.find('tbody tr').each((_, tr) => {
      const cells = [];
      $(tr).find('td').each((_, td) => {
        cells.push($(td).text().replace(/\{\{.*?\}\}/g, '').replace(/\s+/g, ' ').trim());
      });
      if (cells.length === 0 || cells.every(c => c === '')) return;
      if (cells.length < 2) return;

      const row = {};
      headers.forEach((h, i) => { if (h) row[h] = cells[i] ?? ''; });
      rows.push(row);
    });
  });

  console.error(`[scrapeDaywise] Rows extracted: ${rows.length}`);
  return rows;
}

export async function cacheDaywiseAttendance(page, clickToPage) {
  const data = await scrapeDaywiseAttendance(page, clickToPage);
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const outPath = path.join(CACHE_DIR, 'daywise_attendance.json');
  fs.writeFileSync(outPath, JSON.stringify({
    cachedAt: new Date().toISOString(),
    data,
  }, null, 2));
  console.error(`[scrapeDaywise] Cached ${data.length} rows → ${outPath}`);
  return data;
}