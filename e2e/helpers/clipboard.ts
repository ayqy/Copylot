import clipboard from 'clipboardy';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { clearLastCopiedText, getLastCopiedText } from './extension-state';

export async function clearClipboard(driverPage?: Page): Promise<void> {
  await clipboard.write('');
  if (driverPage) {
    await clearLastCopiedText(driverPage);
  }
}

export async function readClipboardText(): Promise<string> {
  return clipboard.read();
}

export function normalizeClipboardText(text: string): string {
  return text.replace(/\r\n/g, '\n').trim();
}

export async function expectClipboardTextEventually(
  expected:
    | string
    | RegExp
    | ((normalizedText: string) => boolean | Promise<boolean>),
  driverPage: Page
): Promise<string> {
  let lastValue = '';
  await expect
    .poll(async () => {
      lastValue = normalizeClipboardText(await getLastCopiedText(driverPage));
      if (typeof expected === 'string') {
        return lastValue === normalizeClipboardText(expected);
      }
      if (expected instanceof RegExp) {
        return expected.test(lastValue);
      }
      return Boolean(await expected(lastValue));
    })
    .toBe(true);

  return lastValue;
}
