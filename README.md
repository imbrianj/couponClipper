# Coupon Clipper

Coupon Clipper is a Node.js script that uses [Playwright](https://playwright.dev/) to automate coupon clipping on the Albertsons coupons page. It simulates human behavior by entering your credentials letter-by-letter with randomized delays and clicking coupon buttons with similar delays to help evade automated detection.

## Features

- **Human-like input:** Types the phone number and password one character at a time with random delays.
- **Randomized click timings:** Random delays before and after clicking buttons.
- **Anti-detection measures:** Sets a custom browser context with a realistic user agent, viewport, locale, and overrides common automation fingerprints (e.g., `navigator.webdriver`).
- **Automatic login flow:** Detects the login page and automates the login process.
- **Recursive coupon clipping:** Clicks coupon buttons and loads more coupons as available.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 12 or later is recommended)
- [Playwright](https://playwright.dev/)  
  Install Playwright by running:
  ```bash
  npm install playwright
  ```

## Usage
Clone the repository, then run the script with your credentials passed via command-line parameters. For example:

```bash
git clone https://github.com/imbrianj/couponClipper.git && cd couponClipper && npm i
```

Once the code is available and dependency installed, execute the script with your login credentials.

```bash
node couponClipper.js --phoneNumber 2054456314 --password thisIsAPassword
```

The script will navigate to the Albertsons coupons page, automatically perform the login process (if needed), and start clicking coupon buttons using human-like interactions.

## License
This project is licensed under the BSD 3‑Clause License. See below for details.

