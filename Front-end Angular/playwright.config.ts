import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e.local' });

const bravePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  ?? 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const executablePath = existsSync(bravePath) ? bravePath : undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4200',
    headless: true,
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
