import { processContent } from '../src/shared/content-processor';
import { getSettings, type Settings } from '../src/shared/settings-manager';
import * as Diff from 'diff';
import TurndownServiceCtor from 'turndown';
import { gfm as gfmPlugin } from 'turndown-plugin-gfm';

type TestGlobals = typeof globalThis & {
  TurndownService: typeof TurndownServiceCtor;
  turndownPluginGfm: { gfm: typeof gfmPlugin };
  chrome: { i18n: { getMessage(key: string): string } };
};

// Expose globals for content-processor which expects TurndownService & turndownPluginGfm
const testGlobals = globalThis as TestGlobals;
testGlobals.TurndownService = TurndownServiceCtor;
// turndown-plugin-gfm exports { gfm }, but content-processor expects an object with .gfm
testGlobals.turndownPluginGfm = { gfm: gfmPlugin };
// 在测试环境中提供可切换的 offscreen 裁剪开关，默认关闭
const offscreenGlobals = globalThis as typeof globalThis & { __COPYLOT_TEST_DISABLE_OFFSCREEN?: boolean };
offscreenGlobals.__COPYLOT_TEST_DISABLE_OFFSCREEN = false;

// Mock chrome APIs
testGlobals.chrome = {
  i18n: {
    getMessage: (key: string) => key,
  },
};

interface TestCase {
  path: string;
  title: string;
  expected?: string;
  disableOffscreenPruning?: boolean;
}

interface TestResult {
  case: TestCase;
  status: 'passed' | 'failed' | 'running';
  actual: string;
  expected: string;
  diff: string;
}

const elements = {
  runAllBtn: document.getElementById('run-all-btn')!,
  statsTotal: document.getElementById('stats-total')!,
  statsPassed: document.getElementById('stats-passed')!,
  statsFailed: document.getElementById('stats-failed')!,
  testResults: document.getElementById('test-results')!,
  batchUpdateSection: document.getElementById('batch-update-section')!,
  batchUpdateOutput: document.getElementById('batch-update-output') as HTMLTextAreaElement,
  copyBatchBtn: document.getElementById('copy-batch-btn')!,
};

let testCases: TestCase[] = [];
const results: TestResult[] = [];
const snapshotsToUpdate: Record<string, string> = {};

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash >>> 0;
}

type LineDiffType = 'equal' | 'add' | 'remove' | 'change';

interface LineDiffResult {
  type: LineDiffType;
  expected?: string;
  actual?: string;
}

function diffLines(expected: string[], actual: string[]): LineDiffResult[] {
  const results: LineDiffResult[] = [];
  let i = 0;
  let j = 0;

  while (i < expected.length && j < actual.length) {
    if (expected[i] === actual[j]) {
      results.push({ type: 'equal', expected: expected[i], actual: actual[j] });
      i++;
      j++;
      continue;
    }

    if (expected[i + 1] !== undefined && expected[i + 1] === actual[j]) {
      results.push({ type: 'remove', expected: expected[i] });
      i++;
      continue;
    }

    if (actual[j + 1] !== undefined && expected[i] === actual[j + 1]) {
      results.push({ type: 'add', actual: actual[j] });
      j++;
      continue;
    }

    results.push({ type: 'change', expected: expected[i], actual: actual[j] });
    i++;
    j++;
  }

  while (i < expected.length) {
    results.push({ type: 'remove', expected: expected[i] });
    i++;
  }
  while (j < actual.length) {
    results.push({ type: 'add', actual: actual[j] });
    j++;
  }

  return results;
}

function buildDiffFromLineResults(lineResults: LineDiffResult[], contextLines = 3): string {
  if (lineResults.length === 0) {
    return '';
  }

  const hasMeaningfulChange = lineResults.some(result => result.type !== 'equal');
  if (!hasMeaningfulChange) {
    return '';
  }

  const include = new Array(lineResults.length).fill(false);
  lineResults.forEach((result, index) => {
    if (result.type !== 'equal') {
      for (let offset = -contextLines; offset <= contextLines; offset++) {
        const target = index + offset;
        if (target >= 0 && target < include.length) {
          include[target] = true;
        }
      }
    }
  });

  let diffHtml = '';
  let omittedCount = 0;

  const flushOmitted = () => {
    if (omittedCount === 0) return;
    diffHtml += `<span class="diff-omitted">…… ${omittedCount} 行未变</span>\n`;
    omittedCount = 0;
  };

  lineResults.forEach((result, index) => {
    if (result.type === 'equal') {
      if (!include[index] || result.actual === undefined) {
        omittedCount++;
        return;
      }
      flushOmitted();
      diffHtml += `${escapeHtml(result.actual)}\n`;
      return;
    }

    flushOmitted();

    if (result.type === 'add' && result.actual !== undefined) {
      diffHtml += `<ins>${escapeHtml(result.actual)}</ins>\n`;
      return;
    }

    if (result.type === 'remove' && result.expected !== undefined) {
      diffHtml += `<del>${escapeHtml(result.expected)}</del>\n`;
      return;
    }

    if (result.type === 'change' && result.actual !== undefined && result.expected !== undefined) {
      const charDiff = Diff.diffChars(result.expected, result.actual);
      charDiff.forEach(part => {
        const tag = part.added ? 'ins' : part.removed ? 'del' : 'span';
        diffHtml += `<${tag}>${escapeHtml(part.value)}</${tag}>`;
      });
      diffHtml += '\n';
    }
  });

  flushOmitted();

  return diffHtml.trim();
}

function renderAllTestSkeletons() {
  elements.testResults.innerHTML = '';
  testCases.forEach(testCase => {
    const resultEl = createResultElement({
      case: testCase,
      status: '',
      actual: '',
      expected: '',
      diff: '',
    });
    elements.testResults.appendChild(resultEl);
  });
}

async function loadTestCases() {
  try {
    const response = await fetch('test-manifest.json');
    if (!response.ok) {
      throw new Error('Could not load test-manifest.json. Please run "npm run build:tests" and ensure it exists in the dist/public folder.');
    }
    const manifestText = await response.text();
    console.log('%c[Debug] Raw test-manifest.json content:', 'color: blue; font-weight: bold;', manifestText);

    testCases = JSON.parse(manifestText);
    console.log('%c[Debug] Parsed test cases object:', 'color: blue; font-weight: bold;', testCases);

    elements.statsTotal.textContent = `Total: ${testCases.length}`;
    renderAllTestSkeletons();
  } catch (error) {
    const resultsDiv = elements.testResults;
    resultsDiv.innerHTML = `<div class="test-case"><div class="test-header"><span class="test-title">Error</span></div><div class="test-content open"><pre>${(error as Error).message}</pre></div></div>`;
  }
}

async function runTest(testCase: TestCase): Promise<TestResult> {
  console.group(`[Test Case] ${testCase.title}`);

  const snapshotPath = testCase.path.replace('cases/', 'test/snapshots/').replace('.html', '.expected.md');
  console.log(`[Debug] Case Path from manifest: ${testCase.path}`);
  console.log(`[Debug] Derived Snapshot Path: ${snapshotPath}`);

  const shouldMeasurePerf = testCase.path === 'cases/2.html';
  const perfLog = (stage: string, start: number) => {
    if (!shouldMeasurePerf) return;
    const duration = performance.now() - start;
    console.log(`[Perf][Case2] ${stage}: ${duration.toFixed(2)} ms`);
  };

  // Use inlined expected content if provided in manifest
  let expected = testCase.expected ?? '';

  // Legacy fallback: if expected still empty attempt fetch (kept for backward compatibility)
  if (!expected) {
    try {
      const resp = await fetch(snapshotPath);
      if (resp.ok) {
        expected = await resp.text();
      }
    } catch {
      // ignore errors; expected remains empty
    }
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1024px';
  iframe.style.height = '768px';
  document.body.appendChild(iframe);

  let stageStart = shouldMeasurePerf ? performance.now() : 0;
  console.error('!!! ATTEMPTING TO FETCH CASE HTML:', testCase.path);
  const response = await fetch(testCase.path);
  let html = await response.text();
  perfLog('Fetch HTML', stageStart);
  console.log('[Debug] Fetched raw HTML for test case:', html);

  stageStart = shouldMeasurePerf ? performance.now() : 0;
  // 清理HTML，移除所有script标签，避免异步资源加载问题
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 移除所有script标签（包括内联和外部脚本）
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // 改进的CSS处理：保留内联样式，移除外部样式表链接
  const stylesheets = doc.querySelectorAll('link[rel="stylesheet"]');
  console.log(`[Debug] Removing ${stylesheets.length} external stylesheets to simulate test environment`);
  stylesheets.forEach(link => link.remove());

  // 保留内联样式标签 <style> 中的CSS规则
  const inlineStyles = doc.querySelectorAll('style');
  console.log(`[Debug] Preserving ${inlineStyles.length} inline style blocks`);

  // 将清理后的HTML重新序列化为字符串
  const cleanedHtml = doc.documentElement.outerHTML;
  perfLog('DOM cleanup', stageStart);

  console.log('[Debug] Cleaned HTML for test case (scripts removed):', cleanedHtml);

  const iframeDoc = iframe.contentWindow!.document;
  stageStart = shouldMeasurePerf ? performance.now() : 0;
  iframeDoc.open();
  iframeDoc.write(cleanedHtml);
  iframeDoc.close();

  await new Promise(r => setTimeout(r, 300));
  perfLog('Iframe render', stageStart);

  const previousOffscreenFlag = offscreenGlobals.__COPYLOT_TEST_DISABLE_OFFSCREEN;
  offscreenGlobals.__COPYLOT_TEST_DISABLE_OFFSCREEN = !!testCase.disableOffscreenPruning;

  try {
    const settings: Settings = await getSettings();
    const targetElement = iframeDoc.body;

    console.log('[Debug] Starting content processing...');
    stageStart = shouldMeasurePerf ? performance.now() : 0;
    const actual = processContent(targetElement, settings);
    perfLog('processContent', stageStart);
    console.log('[Debug] Actual output from processContent:', actual);

    document.body.removeChild(iframe);

    let status: 'passed' | 'failed' = 'passed';
    let diff = '';
    let diffStart = shouldMeasurePerf ? performance.now() : 0;

    // If expected is missing, auto-fail to generate snapshot
    if (!expected) {
      status = 'failed';
      snapshotsToUpdate[snapshotPath] = actual;
      diff = '<ins>' + escapeHtml(actual) + '</ins>';
      perfLog('Diff (fallback empty expected)', diffStart);
    } else {
      const expectedHash = fnv1aHash(expected);
      const actualHash = fnv1aHash(actual);

      if (expected.length === actual.length && expectedHash === actualHash) {
        diff = '';
        perfLog('Diff.hashEqual', diffStart);
      } else {
        const expectedLines = expected.split('\n');
        const actualLines = actual.split('\n');
        const lineDiffResults = diffLines(expectedLines, actualLines);
        diff = buildDiffFromLineResults(lineDiffResults);
        const hasChanges = lineDiffResults.some(result => result.type !== 'equal');
        if (hasChanges) {
          status = 'failed';
          snapshotsToUpdate[snapshotPath] = actual;
        }
        perfLog('Diff.line+char', diffStart);
      }
    }

    console.log(`[Debug] Test status: ${status}`);
    console.groupEnd();

    return { case: testCase, status, actual, expected: expected || '', diff };
  } finally {
    offscreenGlobals.__COPYLOT_TEST_DISABLE_OFFSCREEN = previousOffscreenFlag;
  }
}

function createResultElement(result: TestResult): HTMLElement {
  const el = document.createElement('div');
  el.className = 'test-case';
  el.id = `test-${result.case.path.replace(/[^a-zA-Z0-9]/g, '-')}`;
  el.innerHTML = `
    <div class="test-header">
      <span class="test-title">${result.case.title}</span>
      <span class="test-status ${result.status ? result.status : 'pending'}">${escapeHtml(result.status)}</span>
    </div>
    <div class="test-content">
      <h3>Difference</h3>
      <div class="diff">${result.diff ? `<pre>${result.diff}</pre>` : '<div class="diff-empty">No difference</div>'}</div>
    </div>
  `;
  el.querySelector('.test-header')?.addEventListener('click', () => {
    el.querySelector('.test-content')?.classList.toggle('open');
  });
  return el;
}

function updateResultElement(result: TestResult) {
  const el = document.getElementById(`test-${result.case.path.replace(/[^a-zA-Z0-9]/g, '-')}`);
  console.log('Updating result for:', result.case.title, 'Element ID:', el ? el.id : 'not found');
  if (!el) {
    console.log('Element not found for:', result.case.title);
    return;
  }

  const statusEl = el.querySelector('.test-status')!;
  statusEl.textContent = result.status ? escapeHtml(result.status) : '';
  statusEl.className = `test-status ${result.status ? result.status : 'pending'}`;

  if (result.status === 'failed') {
    el.querySelector('.test-content')!.classList.add('open');
    const diffContainer = el.querySelector('.diff')!;
    diffContainer.innerHTML = result.diff ? `<pre>${result.diff}</pre>` : '<div class="diff-empty">No difference</div>';
  } else {
     el.querySelector('.test-content')!.innerHTML = 'Test passed. No differences found.';
  }
}

function updateStats() {
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  elements.statsPassed.textContent = `Passed: ${passed}`;
  elements.statsFailed.textContent = `Failed: ${failed}`;
}

function showBatchUpdate() {
  if (Object.keys(snapshotsToUpdate).length > 0) {
    elements.batchUpdateSection.style.display = 'block';
    elements.batchUpdateOutput.value = JSON.stringify(snapshotsToUpdate, null, 2);
  } else {
    elements.batchUpdateSection.style.display = 'none';
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function runAllTests() {
  elements.testResults.innerHTML = '';
  results.length = 0;
  Object.keys(snapshotsToUpdate).forEach(key => delete snapshotsToUpdate[key]);

  // Render placeholders so updateResultElement can find them
  renderAllTestSkeletons();

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    updateResultElement(result);
    updateStats();
  }
  showBatchUpdate();
}

elements.runAllBtn.addEventListener('click', runAllTests);
elements.copyBatchBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(elements.batchUpdateOutput.value);
  elements.copyBatchBtn.textContent = 'Copied!';
  setTimeout(() => {
    elements.copyBatchBtn.textContent = 'Copy Batch';
  }, 2000);
});

loadTestCases();
