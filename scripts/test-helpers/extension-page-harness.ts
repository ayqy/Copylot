import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createDomHarness, type DomHarness } from './dom-harness.ts';
import type { ChromeMockController } from './chrome-mock.ts';

export interface ExtensionPageHarness extends DomHarness {
  waitForIdle(): Promise<void>;
}

export async function loadExtensionPage(options: {
  htmlPath: string;
  builtScriptPath: string;
  pageUrl: string;
  chrome: ChromeMockController;
}): Promise<ExtensionPageHarness> {
  const html = await fs.readFile(path.resolve(process.cwd(), options.htmlPath), 'utf-8');
  const harness = createDomHarness(html, options.pageUrl);
  (globalThis as Record<string, unknown>).chrome = options.chrome.chrome;

  const builtScriptAbs = path.resolve(process.cwd(), options.builtScriptPath);
  const scriptUrl = `${pathToFileURL(builtScriptAbs).toString()}?ts=${Date.now()}-${Math.random()}`;
  await import(scriptUrl);

  if (harness.dom.window.document.readyState === 'loading') {
    harness.dom.window.document.dispatchEvent(
      new harness.dom.window.Event('DOMContentLoaded', { bubbles: true, cancelable: true })
    );
  }

  const waitForIdle = async () => {
    await harness.tick();
    await harness.tick();
    await harness.tick();
  };

  await waitForIdle();

  return Object.assign(harness, { waitForIdle });
}

export function getRequiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector);
  assert.ok(element, `Required element not found: ${selector}`);
  return element as T;
}
