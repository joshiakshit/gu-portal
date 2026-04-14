import * as cheerio from 'cheerio';

function parseClassString(raw) {
  if (!raw || raw.trim() === '') return null;
  const cleaned = raw.replace(/^btech_.+?sem\s+\w+[-–]\s*/i, '').trim();
  const match = cleaned.match(/^(.+?)\s*\((PP|PR|TH|LB)\)\s*-[^(]+\(([^)]+)\)/i);
  if (!match) return { raw: cleaned };

  return {
    courseCode: match[1].trim(),
    type: match[2].toUpperCase(),
    room: match[3].trim(),
  };
}

export async function scrapeAttendance(page) {
  console.error('[scraper] Parsing attendance...');

  await page.waitForSelector('table tbody tr', { timeout: 15_000 }).catch(() => {
    console.error('[scraper] Warning: no table rows found within timeout');
  });

  const html = await page.content();
  const $ = cheerio.load(html);

  const attendance = [];

  $('table').each((_, table) => {
    const $table = $(table);

    const headers = [];
    $table.find('thead th, thead td').each((_, th) => {
      headers.push($(th).text().trim());
    });

    if (headers.length === 0) return; 

    const joined = headers.join(' ').toLowerCase();
    const isAttendanceTable =
      joined.includes('subject') ||
      joined.includes('present') ||
      joined.includes('attend') ||
      joined.includes('class');

    if (!isAttendanceTable) return;

    console.error(`[scraper] Attendance table found — headers: [${headers.join(', ')}]`);

    $table.find('tbody tr').each((_, row) => {
      const cells = [];
      $(row).find('td').each((_, td) => {
        cells.push($(td).text().trim().replace(/\s+/g, ' '));
      });

      if (cells.length === 0 || cells.every(c => c === '')) return;
      if (cells.length < 3) return;

      const record = {};
      headers.forEach((h, i) => {
        if (h) record[h] = cells[i] ?? '';
      });

      attendance.push(record);
    });
  });

  console.error(`[scraper] Attendance rows extracted: ${attendance.length}`);
  return attendance;
}

export async function scrapeTimetable(page) {
  console.error('[scraper] Parsing timetable...');

  await page.waitForSelector('table tbody tr', { timeout: 15_000 }).catch(() => {
    console.error('[scraper] Warning: no rows found within timeout');
  });

  const html = await page.content();
  const $ = cheerio.load(html);

  let timetable = null;

  $('table').each((_, table) => {
    if (timetable) return;
    const $table = $(table);

    const allRows = $table.find('tr').toArray();
    if (allRows.length < 3) return;

    const headerCells = $(allRows[1]).find('th, td').toArray();
    const headers = headerCells.map(th =>
      $(th).text().trim().replace(/\s+/g, ' ').replace(/\{\{.*?\}\}.*?-->/gs, '').trim()
    );

    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    if (!days.some(d => headers.join(' ').toLowerCase().includes(d))) return;

    console.error(`[scraper] Timetable headers: [${headers.join(' | ')}]`);
    timetable = [];

    const dayHeaders = headers.slice(1);

    for (let i = 2; i < allRows.length; i++) {
      const cells = $(allRows[i]).find('td, th').toArray();
      if (cells.length === 0) continue;

      const timeRaw = $(cells[0]).text().trim().replace(/\s+/g, ' ')
        .replace(/\{\{[^}]*\}\}[^<]*/g, '').replace(/hd\s*-->/g, '').trim();
      if (!timeRaw || timeRaw === '-') continue;

      const record = { time: timeRaw };
      dayHeaders.forEach((h, idx) => {
        if (!h) return;
        const raw = $(cells[idx + 1]).text().trim().replace(/\s+/g, ' ');
        const text = raw.replace(/\{\{[^}]*\}\}[^<]*/g, '').replace(/hd\s*-->/g, '').trim();
        record[h] = parseClassString(text);
      });

      timetable.push(record);
    }
  });

  console.error(`[scraper] Timetable rows: ${timetable ? timetable.length : 0}`);
  return timetable;
}