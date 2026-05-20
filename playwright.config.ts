import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "mindful-admin",
      ADMIN_SESSION_SECRET: "local-e2e-admin-session-secret",
      SESSION_HASH_SECRET: "local-e2e-session-hash-secret",
      DATA_DIR: ".data-e2e"
    }
  },
  projects: [
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 7"] }
    },
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
