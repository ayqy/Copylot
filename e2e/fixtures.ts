import path from 'node:path';
import { test as base } from '@playwright/test';
import { launchExtension, openDriverPage, resetExtensionState } from './helpers/extension-state';
import { startFixtureServer } from '../scripts/e2e-fixture-server';

export const test = base.extend<{
  extensionId: string;
  extensionContext: Awaited<ReturnType<typeof launchExtension>>['context'];
  extensionUserDataDir: string;
  driverPage: Awaited<ReturnType<typeof openDriverPage>>;
  fixtureOrigin: string;
}>({
  extensionContext: async ({}, use, testInfo) => {
    const isNativeUiProject = testInfo.project.name === 'native-ui';
    const loaded = await launchExtension({
      headed: isNativeUiProject || process.env.COPYLOT_E2E_HEADED === '1',
      userDataDir: isNativeUiProject
        ? path.resolve(process.cwd(), '.tmp_e2e/native-ui-user-data')
        : path.resolve(process.cwd(), '.tmp_e2e/chromium-user-data')
    });
    try {
      await use(loaded.context);
    } finally {
      await loaded.context.close();
    }
  },
  extensionUserDataDir: async ({}, use, testInfo) => {
    const isNativeUiProject = testInfo.project.name === 'native-ui';
    await use(
      isNativeUiProject
        ? path.resolve(process.cwd(), '.tmp_e2e/native-ui-user-data')
        : path.resolve(process.cwd(), '.tmp_e2e/chromium-user-data')
    );
  },
  extensionId: async ({ extensionContext }, use) => {
    let extensionId = '';
    const serviceWorker = extensionContext.serviceWorkers()[0] || (await extensionContext.waitForEvent('serviceworker'));
    extensionId = new URL(serviceWorker.url()).host;
    await use(extensionId);
  },
  driverPage: async ({ extensionContext, extensionId }, use) => {
    const page = await openDriverPage(extensionContext, extensionId);
    await resetExtensionState(page);
    try {
      await use(page);
    } finally {
      await page.close();
    }
  },
  fixtureOrigin: async ({}, use) => {
    const server = await startFixtureServer();
    try {
      await use(server.origin);
    } finally {
      await server.close();
    }
  }
});

export { expect } from '@playwright/test';
