import path from 'node:path';
import { test, expect } from './fixtures';
import { clearClipboard } from './helpers/clipboard';
import {
  getStorageSnapshot,
  seedSyncStorage
} from './helpers/extension-state';
import {
  clickPopupConvertButton,
  clickPopupManagePromptsButton,
  invokeConvertPageFromNativeContextMenu,
  invokePromptFromNativeContextMenu,
  openPopupFromNativeToolbar
} from './helpers/native-ui';

test('@native-ui native browser toolbar icon opens real popup', async ({
  extensionContext,
  extensionUserDataDir,
  driverPage,
  fixtureOrigin
}) => {
  test.skip(process.platform !== 'darwin', 'native UI automation currently only runs on macOS');

  await clearClipboard();
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/native-ui.html`);
    await page.locator('#native-ui-paragraph').selectText();
    await page.bringToFront();

    await openPopupFromNativeToolbar({
      userDataDir: extensionUserDataDir
    });
    await clickPopupConvertButton({
      userDataDir: extensionUserDataDir,
      projectOutputDir: path.resolve(process.cwd(), '.tmp_e2e/native-ui')
    });
    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
        return growthStats?.successfulCopyCount ?? 0;
      })
      .toBe(1);

    await page.bringToFront();
    await openPopupFromNativeToolbar({
      userDataDir: extensionUserDataDir
    });
    const optionsPromise = extensionContext.waitForEvent('page', {
      predicate: (candidate) => candidate.url().includes('/src/options/options.html')
    });
    await clickPopupManagePromptsButton({
      userDataDir: extensionUserDataDir,
      projectOutputDir: path.resolve(process.cwd(), '.tmp_e2e/native-ui')
    });
    const optionsPage = await optionsPromise;
    await optionsPage.waitForLoadState('domcontentloaded');
    await expect(optionsPage.locator('#add-prompt-btn')).toBeVisible();
    await optionsPage.close();
  } finally {
    await page.close();
  }
});

test('@native-ui native context menu opens real submenu and executes prompt flow', async ({
  extensionContext,
  extensionUserDataDir,
  driverPage,
  fixtureOrigin
}) => {
  test.skip(process.platform !== 'darwin', 'native UI automation currently only runs on macOS');

  await clearClipboard();
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isMagicCopyEnabled: true,
      isHoverMagicCopyEnabled: false,
      isAnonymousUsageDataEnabled: false,
      outputFormat: 'markdown',
      tableOutputFormat: 'markdown',
      attachTitle: false,
      attachURL: false,
      language: 'en',
      interactionMode: 'click',
      userPrompts: [
        {
          id: 'qa-native-summary',
          title: 'QA Native Summary',
          template: 'Summarize:\n\n{content}',
          usageCount: 0,
          createdAt: 1,
          builtIn: false,
          deleted: false,
          templateVersion: 1,
          autoOpenChat: false,
          quickAccessSlot: 1
        }
      ],
      isClipboardAccumulatorEnabled: false,
      chatServices: [],
      defaultAutoOpenChat: false,
      editorExclusionClassNames: ['ProseMirror'],
      editorExclusionAttributeSelectors: ['[data-cangjie-content]', '[data-cangjie-editable]'],
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/native-ui.html`);
    const selection = page.locator('#native-ui-paragraph');
    await selection.selectText();

    await invokePromptFromNativeContextMenu({
      page,
      selectionLocator: selection,
      promptTitle: 'QA Native Summary',
      userDataDir: extensionUserDataDir,
      projectOutputDir: path.resolve(process.cwd(), '.tmp_e2e/native-ui')
    });

    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const settings = snapshot.sync.copilot_settings as {
          userPrompts?: Array<{ id?: string; usageCount?: number }>;
        };
        return settings.userPrompts?.find((item) => item.id === 'qa-native-summary')?.usageCount ?? 0;
      })
      .toBe(1);

    const snapshot = await getStorageSnapshot(driverPage);
    const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
    expect(growthStats?.successfulCopyCount).toBe(1);
  } finally {
    await page.close();
  }
});

test('@native-ui native context menu can execute real convert-page flow', async ({
  extensionContext,
  extensionUserDataDir,
  driverPage,
  fixtureOrigin
}) => {
  test.skip(process.platform !== 'darwin', 'native UI automation currently only runs on macOS');

  await clearClipboard(driverPage);
  await seedSyncStorage(driverPage, {
    copilot_settings: {
      isMagicCopyEnabled: true,
      isHoverMagicCopyEnabled: false,
      isAnonymousUsageDataEnabled: false,
      outputFormat: 'markdown',
      tableOutputFormat: 'markdown',
      attachTitle: false,
      attachURL: false,
      language: 'en',
      interactionMode: 'click',
      userPrompts: [],
      isClipboardAccumulatorEnabled: false,
      chatServices: [],
      defaultAutoOpenChat: false,
      popupOnboardingVersion: 1,
      popupOnboardingCompletedVersion: 1,
      popupOnboardingCompletedAt: 1
    }
  });

  const page = await extensionContext.newPage();
  try {
    await page.goto(`${fixtureOrigin}/article-noise.html`);

    await invokeConvertPageFromNativeContextMenu({
      page,
      contextLocator: page.locator('#noise-article-title'),
      userDataDir: extensionUserDataDir,
      projectOutputDir: path.resolve(process.cwd(), '.tmp_e2e/native-ui')
    });

    await expect
      .poll(async () => {
        const snapshot = await getStorageSnapshot(driverPage);
        const growthStats = snapshot.local.copilot_growth_stats as { successfulCopyCount?: number };
        return growthStats?.successfulCopyCount ?? 0;
      })
      .toBe(1);
  } finally {
    await page.close();
  }
});
