/**
 * @fileoverview Script to automate coupon clipping on the Albertsons website using Playwright.
 * It logs in with provided credentials and clicks available coupon buttons.
 *
 * Usage: node couponClipper.js --phoneNumber <phoneNumber> --password <password>
 */

const { chromium } = require('playwright');

// Parse command-line arguments.
let phoneNumber, password;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--phoneNumber' && i + 1 < args.length) {
    phoneNumber = args[i + 1];
    i++;
  } else if (args[i] === '--password' && i + 1 < args.length) {
    password = args[i + 1];
    i++;
  }
}

if (!phoneNumber || !password) {
  console.error("Usage: node couponClipper.js --phoneNumber <phoneNumber> --password <password>");
  process.exit(1);
}

(async () => {
  // Launch the browser (set headless: false for debugging).
  const browser = await chromium.launch({ headless: true });

  // Create a new browser context with a realistic user agent, viewport, and locale.
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    locale: "en-US"
  });

  // Override navigator.webdriver and other properties to reduce detection.
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  /**
   * Returns a random delay between the specified minimum and maximum values.
   *
   * @param {number} [min=200] - Minimum delay in milliseconds.
   * @param {number} [max=800] - Maximum delay in milliseconds.
   * @returns {number} A random delay in milliseconds.
   */
  function randomDelay(min = 200, max = 800) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Waits for a random period between the specified minimum and maximum milliseconds.
   *
   * @param {number} [min=200] - Minimum delay in milliseconds.
   * @param {number} [max=800] - Maximum delay in milliseconds.
   * @returns {Promise<void>} A promise that resolves after the delay.
   */
  async function waitRandom(min = 200, max = 800) {
    const delay = randomDelay(min, max);
    console.log(`Waiting for ${Math.round(delay)} ms`);
    await page.waitForTimeout(delay);
  }

  /**
   * Types text letter-by-letter into an input field specified by a selector.
   *
   * @param {string} selector - The CSS selector of the input field.
   * @param {string} text - The text to type.
   * @param {number} [minDelay=200] - Minimum delay between keystrokes in milliseconds.
   * @param {number} [maxDelay=1200] - Maximum delay between keystrokes in milliseconds.
   * @returns {Promise<void>} A promise that resolves when typing is complete.
   */
  async function typeText(selector, text, minDelay = 200, maxDelay = 1200) {
    console.log('Entering string of length: ' + text.length);
    // Focus the input field.
    await page.focus(selector);
    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(randomDelay(minDelay, maxDelay));
    }
  }

  // Navigate to the coupons page. This may redirect to the sign-in page.
  await page.goto('https://www.albertsons.com/foru/coupons-deals.html');

  // Attempt to detect the login page by waiting for the phone number field.
  let loginField;
  try {
    loginField = await page.waitForSelector('#enterUsername', { timeout: 5000 });
  } catch (error) {
    console.log('Login field not detected within timeout.');
  }

  // If the login field is present, perform the login flow.
  if (loginField) {
    console.log('Login page detected. Performing login...');

    // Type the phone number letter-by-letter.
    await typeText('#enterUsername', phoneNumber);
    await waitRandom();

    // Wait for and click the button to continue after entering the phone number.
    await page.waitForSelector('.auth-styles__content button.btn-secondary');
    await waitRandom();
    await page.click('.auth-styles__content button.btn-secondary');

    // Wait for the password field to appear.
    await page.waitForSelector('#password', { timeout: 10000 });

    // Type the password letter-by-letter.
    await typeText('#password', password);
    await waitRandom();

    // Wait for and click the login button.
    await page.waitForSelector('.btn-primary');
    await waitRandom();
    await page.click('.btn-primary');

    // Wait for navigation to complete (adjust timeout if necessary).
    await page.waitForNavigation({ timeout: 15000 });
    console.log('Login successful.');
  } else {
    console.log('No login page detected. Continuing...');
  }

  // --- Coupon Clicking Process ---

  /**
   * Returns a promise that resolves after a specified number of milliseconds.
   *
   * @param {number} ms - The number of milliseconds to wait.
   * @returns {Promise<void>} A promise that resolves after the delay.
   */
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Waits until at least one new coupon button is available on the page.
   *
   * @returns {Promise<void>} A promise that resolves when a new coupon button is detected.
   */
  async function waitForNewButtons() {
    await page.waitForFunction(() => {
      return document.querySelectorAll('.coupon-deal-button').length > 0;
    }, { timeout: 0 });
  }

  /**
   * Clicks all available coupon buttons one by one with random delays before each click.
   *
   * @returns {Promise<void>} A promise that resolves after all coupon buttons have been clicked.
   */
  async function clickAllCouponButtons() {
    const buttons = await page.$$('.coupon-deal-button');
    console.log(`Found ${buttons.length} coupon button(s) to click.`);
    for (const button of buttons) {
      await waitRandom(); // Wait a random delay before clicking.
      try {
        await button.click();
        console.log('Clicked a coupon button.');
      } catch (err) {
        console.log('Error clicking coupon button:', err);
      }
      await waitRandom(); // Wait after clicking.
    }
  }

  /**
   * Handles a potential modal dialog by attempting to close it if it appears.
   *
   * @returns {Promise<void>} A promise that resolves when the modal is handled.
   */
  async function handlePotentialModal() {
    const modal = await page.$('.login-modal');
    if (modal) {
      const closeButton = await modal.$('.close-modal');
      if (closeButton) {
        await waitRandom();
        await closeButton.click();
        console.log('Modal closed.');
      }
    }
  }

  /**
   * Recursively processes coupon buttons by clicking them and loading more if available.
   *
   * @returns {Promise<void>} A promise that resolves when no more coupon buttons can be processed.
   */
  async function processButtons() {
    await handlePotentialModal();
    await clickAllCouponButtons();

    const loadMoreButton = await page.$('.load-more');
    if (loadMoreButton) {
      console.log('Clicking the "load more" button...');
      await waitRandom();
      await loadMoreButton.click();
      // Wait until new coupon buttons appear.
      await waitForNewButtons();
      // Continue processing recursively.
      await processButtons();
    } else {
      console.log('No "load more" button found. Process complete.');
    }
  }

  // Start the coupon clicking process.
  await processButtons();

  // Optionally, close the browser when done.
  await browser.close();
})();
