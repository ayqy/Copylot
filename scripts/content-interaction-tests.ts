import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import TurndownServiceCtor from 'turndown';
// @ts-ignore: package does not ship a declaration file in this repo setup.
import { gfm as gfmPlugin } from 'turndown-plugin-gfm';

import { createChromeMock, type ChromeMockController } from './test-helpers/chrome-mock.ts';
import { createDomHarness, type DomHarness } from './test-helpers/dom-harness.ts';

const SETTINGS_KEY = 'copilot_settings';

interface Prompt {
  id: string;
  title: string;
  template: string;
  category?: string;
  usageCount?: number;
  createdAt?: number;
  lastUsedAt?: number;
  targetChatId?: string;
  autoOpenChat?: boolean;
  builtIn?: boolean;
  deleted?: boolean;
  templateVersion?: number;
}

interface Settings {
  isMagicCopyEnabled: boolean;
  isHoverMagicCopyEnabled: boolean;
  isAnonymousUsageDataEnabled: boolean;
  proIntentCampaign?: string;
  outputFormat: 'markdown' | 'plaintext';
  tableOutputFormat: 'markdown' | 'csv';
  attachTitle: boolean;
  attachURL: boolean;
  language: 'system' | 'en' | 'zh';
  interactionMode: 'click' | 'dblclick';
  userPrompts: Prompt[];
  isClipboardAccumulatorEnabled: boolean;
  chatServices: Array<{
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    builtIn: boolean;
  }>;
  defaultChatServiceId?: string;
  defaultAutoOpenChat: boolean;
  editorExclusionClassNames: string[];
  editorExclusionAttributeSelectors: string[];
  popupOnboardingVersion: number;
  popupOnboardingCompletedVersion: number;
  popupOnboardingCompletedAt?: number;
}

function createDefaultSettings(): Settings {
  return {
    isMagicCopyEnabled: true,
    isHoverMagicCopyEnabled: false,
    isAnonymousUsageDataEnabled: false,
    proIntentCampaign: undefined,
    outputFormat: 'markdown',
    tableOutputFormat: 'markdown',
    attachTitle: false,
    attachURL: false,
    language: 'en',
    interactionMode: 'click',
    userPrompts: [
      {
        id: 'builtin-summary-article',
        title: 'Summary',
        template: 'Summarize:\n\n{content}',
        usageCount: 0,
        createdAt: 1
      }
    ],
    isClipboardAccumulatorEnabled: false,
    chatServices: [
      {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        enabled: true,
        builtIn: true
      }
    ],
    defaultChatServiceId: undefined,
    defaultAutoOpenChat: false,
    editorExclusionClassNames: ['ProseMirror'],
    editorExclusionAttributeSelectors: ['[data-cangjie-content]', '[data-cangjie-editable]'],
    popupOnboardingVersion: 1,
    popupOnboardingCompletedVersion: 1,
    popupOnboardingCompletedAt: 1
  };
}

function buildStoredSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    ...createDefaultSettings(),
    popupOnboardingCompletedVersion: 1,
    popupOnboardingCompletedAt: 1,
    isMagicCopyEnabled: true,
    ...overrides
  };
}

function createPrompt(id: string, title: string, template: string): Prompt {
  return {
    id,
    title,
    template,
    usageCount: 0,
    createdAt: 1
  };
}

async function loadContentScript(options: {
  html: string;
  url: string;
  settings: Settings;
}): Promise<{ harness: DomHarness; chromeMock: ChromeMockController }> {
  const harness = createDomHarness(options.html, options.url);
  const chromeMock = createChromeMock({
    extensionId: 'abcdefghijklmnopabcdefghijklmnop',
    syncData: {
      [SETTINGS_KEY]: options.settings
    },
    localData: {}
  });

  (globalThis as Record<string, unknown>).chrome = chromeMock.chrome;
  (globalThis as Record<string, unknown>).TurndownService = TurndownServiceCtor;
  (globalThis as Record<string, unknown>).turndownPluginGfm = { gfm: gfmPlugin };
  (globalThis as Record<string, unknown>).__COPYLOT_TEST_DISABLE_OFFSCREEN = true;

  const scriptUrl = `${pathToFileURL(path.resolve(process.cwd(), 'dist/src/content/content.js')).toString()}?ts=${Date.now()}-${Math.random()}`;
  await import(scriptUrl);
  if (harness.dom.window.document.readyState === 'loading') {
    harness.dom.window.document.dispatchEvent(
      new harness.dom.window.Event('DOMContentLoaded', { bubbles: true, cancelable: true })
    );
  }
  await harness.tick();
  await harness.tick();
  return { harness, chromeMock };
}

function clickElement(element: Element): void {
  element.dispatchEvent(
    new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 80
    })
  );
}

function mouseOverElement(element: Element): void {
  element.dispatchEvent(
    new window.MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      clientX: 160,
      clientY: 90
    })
  );
}

function keyEvent(type: 'keydown' | 'keyup', key: string): void {
  document.dispatchEvent(
    new window.KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      key
    })
  );
}

function selectNodeContents(target: Element): void {
  const selection = window.getSelection();
  assert.ok(selection);
  selection.removeAllRanges();
  const range = document.createRange();
  range.selectNodeContents(target);
  selection.addRange(range);
}

async function readFixture(relPath: string): Promise<string> {
  return fs.readFile(path.resolve(process.cwd(), relPath), 'utf-8');
}

async function runClickModeAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/editor-exclusion.html');
  const { harness } = await loadContentScript({
    html,
    url: 'https://example.com/click-mode',
    settings: buildStoredSettings()
  });

  try {
    const normalText = harness.dom.window.document.getElementById('normal-text');
    assert.ok(normalText);
    selectNodeContents(normalText);
    clickElement(normalText);
    await harness.tick();
    const button = harness.dom.window.document.getElementById('ai-copilot-copy-btn') as HTMLElement | null;
    assert.ok(button);
    assert.equal(button.style.display, 'flex');
  } finally {
    harness.restore();
  }
}

async function runDoubleClickAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/editor-exclusion.html');
  const { harness } = await loadContentScript({
    html,
    url: 'https://example.com/dblclick-mode',
    settings: buildStoredSettings({ interactionMode: 'dblclick' })
  });

  try {
    const normalText = harness.dom.window.document.getElementById('normal-text');
    assert.ok(normalText);
    selectNodeContents(normalText);
    clickElement(normalText);
    await harness.tick();
    const button = harness.dom.window.document.getElementById('ai-copilot-copy-btn') as HTMLElement | null;
    assert.ok(button);
    assert.equal(button.style.display, 'none');
    clickElement(normalText);
    await harness.tick();
    assert.equal(button.style.display, 'flex');
  } finally {
    harness.restore();
  }
}

async function runShiftAppendAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/editor-exclusion.html');
  const { harness, chromeMock } = await loadContentScript({
    html,
    url: 'https://example.com/append-mode',
    settings: buildStoredSettings({ isClipboardAccumulatorEnabled: true })
  });

  try {
    const normalText = harness.dom.window.document.getElementById('normal-text');
    assert.ok(normalText);
    selectNodeContents(normalText);
    clickElement(normalText);
    await harness.tick();
    keyEvent('keydown', 'Shift');
    await harness.tick();
    const button = harness.dom.window.document.getElementById('ai-copilot-copy-btn') as HTMLElement | null;
    assert.ok(button);
    clickElement(button);
    await harness.tick();
    const lastMessage = chromeMock.logs.runtimeMessages.at(-1) as { type?: string; isShiftPressed?: boolean } | undefined;
    assert.equal(lastMessage?.type, 'copy-to-clipboard');
    assert.equal(lastMessage?.isShiftPressed, true);
  } finally {
    harness.restore();
  }
}

async function runPromptScopeAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/prompt-scope.html');
  const { harness } = await loadContentScript({
    html,
    url: 'https://example.com/prompt-scope',
    settings: buildStoredSettings({
      userPrompts: [createPrompt('prompt-summary', 'Summary', 'PROMPT::{content}')]
    })
  });

  try {
    const selectedNode = harness.dom.window.document.querySelector('#scope-paragraph strong');
    assert.ok(selectedNode);
    selectNodeContents(selectedNode);
    const paragraph = harness.dom.window.document.getElementById('scope-paragraph');
    assert.ok(paragraph);
    clickElement(paragraph);
    await harness.tick();
    const button = harness.dom.window.document.getElementById('ai-copilot-copy-btn') as HTMLElement | null;
    assert.ok(button);
    button.dispatchEvent(new window.MouseEvent('mouseenter', { bubbles: true, cancelable: true }));
    await harness.tick();
    const promptItem = button.querySelector('.ai-copilot-prompt-item') as HTMLElement | null;
    assert.ok(promptItem);
    clickElement(promptItem);
    await harness.tick();
    const copied = await harness.clipboard.readText();
    assert.ok(copied.includes('selected'));
    assert.ok(!copied.includes('Neighbor text'));
  } finally {
    harness.restore();
  }
}

async function runEditorExclusionAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/editor-exclusion.html');
  const { harness } = await loadContentScript({
    html,
    url: 'https://example.com/editor-exclusion',
    settings: buildStoredSettings()
  });

  try {
    const editorText = harness.dom.window.document.getElementById('editor-text');
    assert.ok(editorText);
    selectNodeContents(editorText);
    clickElement(editorText);
    await harness.tick();
    const button = harness.dom.window.document.getElementById('ai-copilot-copy-btn') as HTMLElement | null;
    assert.ok(button);
    assert.equal(button.style.display, 'none');

    const normalText = harness.dom.window.document.getElementById('normal-text');
    assert.ok(normalText);
    selectNodeContents(normalText);
    clickElement(normalText);
    await harness.tick();
    assert.equal(button.style.display, 'flex');
  } finally {
    harness.restore();
  }
}

async function runHoverCodeBlockAssertion(): Promise<void> {
  const html = await readFixture('e2e/fixtures/code.html');
  const { harness } = await loadContentScript({
    html,
    url: 'https://example.com/hover-code',
    settings: buildStoredSettings({
      isHoverMagicCopyEnabled: true,
      outputFormat: 'plaintext'
    })
  });

  try {
    const codeBlock = harness.dom.window.document.getElementById('code-block');
    assert.ok(codeBlock);
    Object.defineProperty(codeBlock, 'clientWidth', {
      configurable: true,
      value: 400
    });
    Object.defineProperty(codeBlock, 'clientHeight', {
      configurable: true,
      value: 120
    });
    mouseOverElement(codeBlock);
    await harness.tick();
    const button = harness.dom.window.document.getElementById('ai-copilot-copy-btn') as HTMLElement | null;
    assert.ok(button);
    assert.equal(button.style.display, 'flex');
    clickElement(button);
    await harness.tick();
    const copied = await harness.clipboard.readText();
    assert.equal(
      copied,
      'function buildPrompt() {\n  const tag = "\\#summary";\n  const docs = ["\\[intro\\]", "outline"];\n\n  return docs.join("\\\\n");\n}'
    );
    assert.ok(!copied.includes('复制代码'));
    assert.ok(!copied.includes('Copy code'));
    assert.ok(!copied.includes('1Copy'));

    const tableCodeBlock = harness.dom.window.document.getElementById('table-code-block');
    assert.ok(tableCodeBlock);
    Object.defineProperty(tableCodeBlock, 'clientWidth', {
      configurable: true,
      value: 520
    });
    Object.defineProperty(tableCodeBlock, 'clientHeight', {
      configurable: true,
      value: 120
    });
    mouseOverElement(tableCodeBlock);
    await harness.tick();
    clickElement(button);
    await harness.tick();
    const tableCopied = await harness.clipboard.readText();
    assert.equal(tableCopied, 'const steps = [\n  "install",\n  "verify",\n];');
    assert.ok(!tableCopied.includes('Copy code'));
    assert.ok(!tableCopied.includes('1const'));
  } finally {
    harness.restore();
  }
}


async function runTableSelectionAssertion(): Promise<void> {
  const html = `<!doctype html><html><body><table><tr><th>Name</th><th>Age</th></tr><tr><td id="alice">Alice</td><td>30</td></tr><tr><td>Bob</td><td>28</td></tr></table></body></html>`;
  const { harness, chromeMock } = await loadContentScript({
    html,
    url: 'https://example.com/table-selection',
    settings: buildStoredSettings()
  });

  try {
    const aliceCell = harness.dom.window.document.getElementById('alice');
    assert.ok(aliceCell);
    selectNodeContents(aliceCell);
    await chromeMock.dispatchRuntimeMessage({ type: 'CONVERT_PAGE_WITH_SELECTION' });
    await harness.tick();
    const copied = await harness.clipboard.readText();
    assert.ok(copied.includes('Alice'));
    assert.ok(copied.includes('Bob'));
  } finally {
    harness.restore();
  }
}

async function runPreciseSelectionAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/prompt-scope.html');
  const { harness, chromeMock } = await loadContentScript({
    html,
    url: 'https://example.com/precise-selection',
    settings: buildStoredSettings()
  });

  try {
    const selectedNode = harness.dom.window.document.querySelector('#scope-paragraph strong');
    assert.ok(selectedNode);
    selectNodeContents(selectedNode);
    await chromeMock.dispatchRuntimeMessage({ type: 'CONVERT_PAGE_WITH_SELECTION' });
    await harness.tick();
    const copied = await harness.clipboard.readText();
    assert.ok(copied.includes('selected'));
    assert.ok(!copied.includes('Neighbor text'));
  } finally {
    harness.restore();
  }
}

async function runReaderModeSemanticAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/reader-mode-noise.html');
  const { harness, chromeMock } = await loadContentScript({
    html,
    url: 'https://example.com/reader-mode-semantic',
    settings: buildStoredSettings()
  });

  try {
    await chromeMock.dispatchRuntimeMessage({ type: 'CONVERT_PAGE' });
    await harness.tick();
    const copied = await harness.clipboard.readText();
    assert.ok(copied.includes('Clean target article'));
    assert.ok(copied.includes('Main story paragraph one.'));
    assert.ok(!copied.includes('Top navigation'));
    assert.ok(!copied.includes('Promoted links'));
    assert.ok(!copied.includes('Footer links'));
  } finally {
    harness.restore();
  }
}

async function runReaderModeDensityAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/reader-mode-density.html');
  const { harness, chromeMock } = await loadContentScript({
    html,
    url: 'https://example.com/reader-mode-density',
    settings: buildStoredSettings()
  });

  try {
    await chromeMock.dispatchRuntimeMessage({ type: 'CONVERT_PAGE' });
    await harness.tick();
    const copied = await harness.clipboard.readText();
    assert.ok(copied.includes('Density fallback article'));
    assert.ok(copied.includes('story content or post body'));
    assert.ok(!copied.includes('Dense mode top navigation'));
    assert.ok(!copied.includes('Navigation one'));
    assert.ok(!copied.includes('Related alpha'));
    assert.ok(!copied.includes('Density mode footer links'));
  } finally {
    harness.restore();
  }
}

async function runReaderModePruningAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/reader-mode-pruning.html');
  const { harness, chromeMock } = await loadContentScript({
    html,
    url: 'https://example.com/reader-mode-pruning',
    settings: buildStoredSettings()
  });

  try {
    await chromeMock.dispatchRuntimeMessage({ type: 'CONVERT_PAGE' });
    await harness.tick();
    const copied = await harness.clipboard.readText();
    assert.ok(copied.includes('Pruned article target'));
    assert.ok(copied.includes('The main article text should remain'));
    assert.ok(!copied.includes('Related read one'));
    assert.ok(!copied.includes('Share to X'));
    assert.ok(!copied.includes('newsletter signup'));
  } finally {
    harness.restore();
  }
}

async function runLocalBlockPruningAssertion(): Promise<void> {
  const html = await readFixture('test/fixtures/content/local-block-pruning.html');
  const { harness, chromeMock } = await loadContentScript({
    html,
    url: 'https://example.com/local-block-pruning',
    settings: buildStoredSettings()
  });

  try {
    const article = harness.dom.window.document.getElementById('local-article-card');
    assert.ok(article);
    selectNodeContents(article);
    await chromeMock.dispatchRuntimeMessage({ type: 'CONVERT_PAGE_WITH_SELECTION' });
    await harness.tick();
    const copied = await harness.clipboard.readText();
    assert.ok(copied.includes('Local block pruning target'), copied);
    assert.ok(copied.includes('core article paragraph should remain'), copied);
    assert.ok(!copied.includes('Share to X'), copied);
    assert.ok(!copied.includes('Related story alpha'), copied);
    assert.ok(!copied.includes('newsletter signup footer'), copied);
  } finally {
    harness.restore();
  }
}

async function run(): Promise<void> {
  await runClickModeAssertion();
  await runDoubleClickAssertion();
  await runShiftAppendAssertion();
  await runPromptScopeAssertion();
  await runEditorExclusionAssertion();
  await runHoverCodeBlockAssertion();
  await runTableSelectionAssertion();
  await runPreciseSelectionAssertion();
  await runReaderModeSemanticAssertion();
  await runReaderModeDensityAssertion();
  await runReaderModePruningAssertion();
  await runLocalBlockPruningAssertion();
  console.log('PASS content-interaction-tests');
}

void run();
