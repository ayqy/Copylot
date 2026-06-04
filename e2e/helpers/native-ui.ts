import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import type { Locator, Page } from '@playwright/test';

const execFileAsync = promisify(execFile);
const SWIFT_HELPER_PATH = path.resolve(process.cwd(), 'e2e/helpers/native-ui.swift');

interface ScreenMatch {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BrowserMetrics {
  screenX: number;
  screenY: number;
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
}

interface MatchRegion {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldKeepArtifacts(): boolean {
  return process.env.COPYLOT_E2E_KEEP_NATIVE_UI_ARTIFACTS === '1';
}

async function runSwift(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('swift', [SWIFT_HELPER_PATH, ...args], {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024
  });
  return stdout.trim();
}

async function findBrowserPid(userDataDir: string): Promise<number> {
  const { stdout } = await execFileAsync('ps', ['-ax', '-o', 'pid=,command='], {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024
  });

  const line = stdout
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .find(
      (entry) =>
        entry.includes(userDataDir) &&
        entry.includes('Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') &&
        !entry.includes('Helper')
    );

  if (!line) {
    throw new Error(`failed to resolve browser pid for user data dir: ${userDataDir}`);
  }

  const pid = Number.parseInt(line.split(/\s+/, 1)[0], 10);
  if (!Number.isFinite(pid)) {
    throw new Error(`failed to parse browser pid from line: ${line}`);
  }

  return pid;
}

async function focusBrowser(userDataDir: string): Promise<number> {
  const pid = await findBrowserPid(userDataDir);
  await runSwift(['focus-app', String(pid)]);
  await delay(300);
  return pid;
}

async function captureScreen(tempDir: string, name: string): Promise<string> {
  const screenshotPath = path.join(tempDir, `${name}.png`);
  await execFileAsync('screencapture', ['-x', screenshotPath], {
    cwd: process.cwd(),
    maxBuffer: 5 * 1024 * 1024
  });
  return screenshotPath;
}

async function ocrMatch(screenshotPath: string, queries: string[]): Promise<ScreenMatch> {
  const stdout = await runSwift(['ocr', screenshotPath, queries.join('|')]);
  const matches = JSON.parse(stdout) as ScreenMatch[];
  if (!matches.length) {
    throw new Error(`no OCR match found for queries: ${queries.join(', ')}`);
  }

  matches.sort((left, right) => {
    const rightArea = right.width * right.height;
    const leftArea = left.width * left.height;
    return rightArea - leftArea;
  });

  return matches[0];
}

async function ocrMatches(screenshotPath: string, queries: string[]): Promise<ScreenMatch[]> {
  const stdout = await runSwift(['ocr', screenshotPath, queries.join('|')]);
  return JSON.parse(stdout) as ScreenMatch[];
}

function pickScreenMatch(matches: ScreenMatch[], region: MatchRegion = {}): ScreenMatch | null {
  const filtered = matches.filter((match) => {
    if (region.minX !== undefined && match.x < region.minX) {
      return false;
    }
    if (region.maxX !== undefined && match.x > region.maxX) {
      return false;
    }
    if (region.minY !== undefined && match.y < region.minY) {
      return false;
    }
    if (region.maxY !== undefined && match.y > region.maxY) {
      return false;
    }
    return true;
  });

  if (!filtered.length) {
    return null;
  }

  filtered.sort((left, right) => right.y - left.y || right.x - left.x);
  return filtered[0];
}

async function mouse(kind: 'move' | 'left-click' | 'right-click', x: number, y: number): Promise<void> {
  await runSwift(['mouse', kind, `${x}`, `${y}`]);
}

async function pressKey(name: 'down' | 'right' | 'enter' | 'escape'): Promise<void> {
  await runSwift(['key', name]);
}

async function getScreenPoint(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('locator bounding box is unavailable');
  }

  const page = locator.page();
  const metrics = await page.evaluate(() => ({
    screenX: window.screenX,
    screenY: window.screenY,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight
  })) as BrowserMetrics;

  const borderX = (metrics.outerWidth - metrics.innerWidth) / 2;
  const chromeTop = metrics.outerHeight - metrics.innerHeight - borderX;

  return {
    x: metrics.screenX + borderX + box.x + Math.min(24, box.width / 2),
    y: metrics.screenY + chromeTop + box.y + Math.min(18, box.height / 2)
  };
}

export async function openPopupFromNativeToolbar(options: {
  userDataDir: string;
}): Promise<void> {
  const { userDataDir } = options;
  const pid = await focusBrowser(userDataDir);
  await runSwift(['press-by-description', String(pid), '扩展程序|Extensions']);
  await delay(900);
  await runSwift(['press-by-text', String(pid), 'Copylot']);
  await delay(1200);
}

export async function invokePromptFromNativeContextMenu(options: {
  page: Page;
  selectionLocator: Locator;
  promptTitle: string;
  userDataDir: string;
  projectOutputDir: string;
}): Promise<void> {
  const { page, selectionLocator, promptTitle, userDataDir, projectOutputDir } = options;
  await mkdir(projectOutputDir, { recursive: true });
  const tempDir = await mkdtemp(path.join(path.resolve(projectOutputDir), 'native-ui-ocr-'));

  try {
    await page.bringToFront();
    await focusBrowser(userDataDir);

    const selectionPoint = await getScreenPoint(selectionLocator);
    await mouse('right-click', selectionPoint.x, selectionPoint.y);
    await delay(900);

    const menuScreenshot = await captureScreen(tempDir, 'context-menu');
    const parentMatch = pickScreenMatch(await ocrMatches(menuScreenshot, ['Copylot']));
    if (!parentMatch) {
      throw new Error('no OCR match found for native context menu parent item');
    }
    await mouse('move', parentMatch.x, parentMatch.y);
    await delay(1000);

    await pressKey('right');
    await delay(500);

    let promptScreenshot = await captureScreen(tempDir, 'context-prompt-submenu');
    let promptMatch = pickScreenMatch(
      await ocrMatches(promptScreenshot, [promptTitle, 'QA Native Summary', 'QA Native', 'Native Summary']),
      {
        minX: parentMatch.x + 80,
        minY: parentMatch.y - 180,
        maxY: parentMatch.y + 180
      }
    );
    if (!promptMatch) {
      await mouse('move', parentMatch.x + 120, parentMatch.y + 40);
      await delay(500);
      promptScreenshot = await captureScreen(tempDir, 'context-prompt-submenu-after-right');
      promptMatch = pickScreenMatch(
        await ocrMatches(promptScreenshot, [promptTitle, 'QA Native Summary', 'QA Native', 'Native Summary']),
        {
          minX: parentMatch.x + 80,
          minY: parentMatch.y - 180,
          maxY: parentMatch.y + 180
        }
      );
    }

    if (!promptMatch) {
      throw new Error(`no OCR match found for prompt submenu item: ${promptTitle}`);
    }

    await mouse('left-click', promptMatch.x, promptMatch.y);
    await delay(900);
  } finally {
    await pressKey('escape').catch(() => {});
    if (!shouldKeepArtifacts()) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

export async function invokeConvertPageFromNativeContextMenu(options: {
  page: Page;
  contextLocator: Locator;
  userDataDir: string;
  projectOutputDir: string;
}): Promise<void> {
  const { page, contextLocator, userDataDir, projectOutputDir } = options;
  await mkdir(projectOutputDir, { recursive: true });
  const tempDir = await mkdtemp(path.join(path.resolve(projectOutputDir), 'native-ui-context-page-'));

  try {
    await page.bringToFront();
    await focusBrowser(userDataDir);

    const contextPoint = await getScreenPoint(contextLocator);
    await mouse('right-click', contextPoint.x, contextPoint.y);
    await delay(900);

    const menuScreenshot = await captureScreen(tempDir, 'context-menu');
    const parentMatch = pickScreenMatch(await ocrMatches(menuScreenshot, ['Copylot']));
    if (!parentMatch) {
      throw new Error('no OCR match found for native context menu parent item');
    }

    await mouse('move', parentMatch.x, parentMatch.y);
    await delay(1000);

    await pressKey('right');
    await delay(500);

    const submenuScreenshot = await captureScreen(tempDir, 'context-submenu-after-right');
    const convertMatch = pickScreenMatch(
      await ocrMatches(submenuScreenshot, [
        '复制给AI',
        '复制给Al',
        '复制给A1',
        '给AI',
        'Copy to AI',
        'Copy to Al',
        'Copy to A1'
      ]),
      {
        minX: parentMatch.x + 80,
        minY: parentMatch.y - 140,
        maxY: parentMatch.y + 140
      }
    );

    if (!convertMatch) {
      console.warn('OCR missed native convert-page item, using keyboard fallback');
    }

    // After moving onto the Copylot parent item, the right arrow consistently opens the submenu
    // and focuses the first child item, which is the page-convert action in the current menu model.
    await pressKey('enter');
    await delay(900);
  } finally {
    await pressKey('escape').catch(() => {});
    if (!shouldKeepArtifacts()) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

async function clickPopupButtonByQueries(options: {
  userDataDir: string;
  projectOutputDir: string;
  name: string;
  queries: string[];
}): Promise<void> {
  const { userDataDir, projectOutputDir, name, queries } = options;
  await mkdir(projectOutputDir, { recursive: true });
  const tempDir = await mkdtemp(path.join(path.resolve(projectOutputDir), `native-ui-${name}-`));

  try {
    await focusBrowser(userDataDir);
    const screenshotPath = await captureScreen(tempDir, name);
    const match = await ocrMatch(screenshotPath, queries);
    await mouse('left-click', match.x, match.y);
    await delay(900);
  } finally {
    if (!shouldKeepArtifacts()) {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
}

export async function clickPopupConvertButton(options: {
  userDataDir: string;
  projectOutputDir: string;
}): Promise<void> {
  await clickPopupButtonByQueries({
    userDataDir: options.userDataDir,
    projectOutputDir: options.projectOutputDir,
    name: 'popup-convert',
    queries: ['复制给AI', '复制给Al', 'Copy to AI']
  });
}

export async function clickPopupManagePromptsButton(options: {
  userDataDir: string;
  projectOutputDir: string;
}): Promise<void> {
  await clickPopupButtonByQueries({
    userDataDir: options.userDataDir,
    projectOutputDir: options.projectOutputDir,
    name: 'popup-manage-prompts',
    queries: [
      '管理Prompts',
      '管理 Prompt',
      '管理prompt',
      '管理 Prompts',
      'Manage Prompts',
      'Manage Prompt',
      'Prompts',
      'Prompt'
    ]
  });
}
