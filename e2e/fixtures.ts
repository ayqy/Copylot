import { test as base } from '@playwright/test';
import { launchExtension } from './helpers/extension-state';
import { startFixtureServer } from '../scripts/e2e-fixture-server';

export const test = base.extend<{
  extensionId: string;
  extensionContext: Awaited<ReturnType<typeof launchExtension>>['context'];
  fixtureOrigin: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  extensionContext: async ({}, use) => {
    const loaded = await launchExtension();
    try {
      await use(loaded.context);
    } finally {
      await loaded.context.close();
    }
  },
  extensionId: async ({ extensionContext }, use) => {
    let extensionId = '';
    const serviceWorker = extensionContext.serviceWorkers()[0] || (await extensionContext.waitForEvent('serviceworker'));
    extensionId = new URL(serviceWorker.url()).host;
    await use(extensionId);
  },
  // eslint-disable-next-line no-empty-pattern
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
