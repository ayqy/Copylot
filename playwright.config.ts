import { defineConfig } from '@playwright/test';

const isHeaded = process.env.COPYLOT_E2E_HEADED === '1';
const shouldRunHeaded = process.env.COPYLOT_E2E_ONLY_NATIVE_UI === '1' ? true : isHeaded;

export default defineConfig({
  testDir: './e2e',
  outputDir: '.tmp_e2e/results',
  timeout: 90_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: '.tmp_e2e/report.json' }]],
  projects: [
    {
      name: 'main',
      grepInvert: /@native-ui/,
      use: {
        acceptDownloads: true,
        headless: !shouldRunHeaded,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
      }
    },
    {
      name: 'native-ui',
      grep: /@native-ui/,
      retries: 1,
      use: {
        acceptDownloads: true,
        headless: false,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
      }
    }
  ]
});
