import { defineConfig } from '@playwright/test';

const isHeaded = process.env.COPYLOT_E2E_HEADED === '1';

export default defineConfig({
  testDir: './e2e',
  outputDir: '.tmp_e2e/results',
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: '.tmp_e2e/report.json' }]],
  use: {
    headless: !isHeaded,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
