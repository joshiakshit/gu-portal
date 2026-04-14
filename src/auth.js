import { chromium } from 'playwright';
import { TOTP } from 'otpauth';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL      = 'https://gustudent.icloudems.com';
const KC_AUTH_URL   = 'https://usermanagement.icloudems.com/realms/production/protocol/openid-connect/auth'
                    + '?client_id=GUSTUDENT'
                    + '&redirect_uri=https%3A%2F%2Fgustudent.icloudems.com%2Fcorecampus%2Ffirebasejs_files%2Fkeycloak_callback_dynamic.php'
                    + '&response_type=code'
                    + '&KEYCLOAK_URL=https%3A%2F%2Fusermanagement.icloudems.com'
                    + '&REALM=production'
                    + '&scope=openid%20email%20profile';

const STUDENT_INDEX = `${BASE_URL}/corecampus/student/student_index.php`;
const LOGIN_TIMEOUT = 30_000; 

function generateTOTP(secret) {
  const totp = new TOTP({
    secret,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  return totp.generate();
}

async function login(username, totpSecret) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: false,
  });

  const page = await context.newPage();

  try {
    console.error('[auth] Step 1: Loading Keycloak login page...');
    await page.goto(KC_AUTH_URL, { waitUntil: 'domcontentloaded', timeout: LOGIN_TIMEOUT });

    await page.waitForSelector('input[name="username"]', { timeout: LOGIN_TIMEOUT });
    console.error('[auth] Username form detected.');

    console.error(`[auth] Step 2: Submitting username: ${username}`);
    await page.fill('input[name="username"]', username);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: LOGIN_TIMEOUT }),
      page.click('input[type="submit"], button[type="submit"]'),
    ]);

    await page.waitForSelector('input[name="otp"]', { timeout: LOGIN_TIMEOUT });
    console.error('[auth] OTP form detected.');

    const otp = generateTOTP(totpSecret);
    console.error(`[auth] Step 3: Submitting OTP: ${otp}`);

    await page.fill('input[name="otp"]', otp);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: LOGIN_TIMEOUT }),
      page.click('input[type="submit"], button[type="submit"]'),
    ]);

    const finalUrl = page.url();
    console.error(`[auth] Final URL: ${finalUrl}`);

    if (!finalUrl.startsWith(BASE_URL)) {
      const currentUrl = page.url();
      const hasOtpField = await page.$('input[name="otp"]') !== null;

      if (hasOtpField) {
        console.error('[auth] OTP rejected. Waiting for next TOTP window (up to 35s)...');
        const nextOtp = await waitForNextTOTP(totpSecret);
        console.error(`[auth] Retrying with new OTP: ${nextOtp}`);
        await page.fill('input[name="otp"]', '');
        await page.fill('input[name="otp"]', nextOtp);
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: LOGIN_TIMEOUT }),
          page.click('input[type="submit"], button[type="submit"]'),
        ]);
      }
    }

    const landedUrl = page.url();
    if (!landedUrl.includes('gustudent.icloudems.com')) {
      throw new Error(`Auth failed — unexpected URL: ${landedUrl}`);
    }

    console.error('[auth] ✓ Authenticated. Extracting session cookies...');

    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(c =>
      c.domain.includes('gustudent.icloudems.com') ||
      c.domain.includes('icloudems.com')
    );

    return { context, page, cookies: sessionCookies };

  } catch (err) {
    await browser.close();
    throw err;
  }
}


async function waitForNextTOTP(secret) {
  const now = Date.now();
  const msInPeriod = now % 30_000;
  const msUntilNext = 30_000 - msInPeriod + 1_000;
  console.error(`[auth] Waiting ${(msUntilNext / 1000).toFixed(1)}s for next TOTP window...`);
  await new Promise(res => setTimeout(res, msUntilNext));
  return generateTOTP(secret);
}


const username   = process.env.GU_USERNAME;
const totpSecret = process.env.GU_TOTP_SECRET;

if (!username || !totpSecret) {
  console.error('[auth] ERROR: GU_USERNAME and GU_TOTP_SECRET must be set in .env');
  process.exit(1);
}

try {
  const { context, page, cookies } = await login(username, totpSecret);

  const result = {
    success: true,
    url: page.url(),
    cookies: cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain, path: c.path })),
  };

  console.log(JSON.stringify(result, null, 2));

  await context.browser().close();
} catch (err) {
  console.error('[auth] FATAL:', err.message);
  const result = { success: false, error: err.message };
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}
