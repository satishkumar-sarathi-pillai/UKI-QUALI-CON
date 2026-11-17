// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // 'never' stops the report server blocking the terminal; open it with `npm run report`.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://www.saucedemo.com',
    headless: false, // headed so the audience can follow along
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Record every test as test evidence (attached to the HTML report).
    video: { mode: 'on', size: { width: 1280, height: 720 } },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // slowMo slows each browser action so the audience can follow the test.
        launchOptions: { slowMo: 500 },
      },
    },
  ],
});
