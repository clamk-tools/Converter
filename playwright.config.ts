import { defineConfig, devices } from "@playwright/test";

// End-to-end tests of the built site, served under /Converter/ as on GitHub Pages (`npm run preview`), so a broken
// asset path shows here before the site is published. Build first: `npm run build && npm run e2e`.
// PLAYWRIGHT_CHROMIUM lets a machine with its own Chromium use it instead of a downloaded one.
const chromium = process.env.PLAYWRIGHT_CHROMIUM ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM } } : {};
const only = process.env.PLAYWRIGHT_ONLY_CHROMIUM === "1";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4174/Converter/", trace: "retain-on-failure" },
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4174/Converter/",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], ...chromium } },
    { name: "mobile", use: { ...devices["Pixel 7"], ...chromium } },
    ...(only
      ? []
      : [
          { name: "firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "webkit", use: { ...devices["Desktop Safari"] } },
        ]),
  ],
});
