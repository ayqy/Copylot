import type { Download, Page } from '@playwright/test';

async function waitForDownload(page: Page, trigger: () => Promise<void> | void): Promise<Download> {
  const downloadPromise = page.waitForEvent('download');
  await trigger();
  return downloadPromise;
}

export async function waitForDownloadAndReadText(
  page: Page,
  trigger: () => Promise<void> | void
): Promise<{ download: Download; filename: string; text: string }> {
  const download = await waitForDownload(page, trigger);
  const filename = download.suggestedFilename();
  const path = await download.path();
  if (!path) {
    throw new Error('download path is unavailable');
  }
  const fs = await import('node:fs/promises');
  const text = await fs.readFile(path, 'utf8');
  return { download, filename, text };
}

export async function waitForDownloadAndReadJson<T>(
  page: Page,
  trigger: () => Promise<void> | void
): Promise<{ download: Download; filename: string; json: T; text: string }> {
  const { download, filename, text } = await waitForDownloadAndReadText(page, trigger);
  return {
    download,
    filename,
    text,
    json: JSON.parse(text) as T
  };
}
