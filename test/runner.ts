import { processContent } from '../src/shared/content-processor';
import { createVisibleClone } from '../src/shared/dom-preprocessor';
import { getSettings, type Settings } from '../src/shared/settings-manager';
import * as Diff from 'diff';
import TurndownServiceCtor from 'turndown';
import { gfm as gfmPlugin } from 'turndown-plugin-gfm';

// Expose globals for content-processor which expects TurndownService & turndownPluginGfm
// @ts-ignore
(globalThis as any).TurndownService = TurndownServiceCtor;
// turndown-plugin-gfm exports { gfm }, but content-processor expects an object with .gfm
// @ts-ignore
(globalThis as any).turndownPluginGfm = { gfm: gfmPlugin };

// Mock chrome APIs
// @ts-ignore
globalThis.chrome = {
  i18n: {
    getMessage: (key: string) => key,
  },
};

interface TestCase {
  path: string;
  title: string;
  expected?: string;
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



function renderAllTestSkeletons() {
  elements.testResults.innerHTML = '';
  testCases.forEach(testCase => {
    const resultEl = createResultElement({
      case: testCase,
      status: 'running',
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

  console.error('!!! ATTEMPTING TO FETCH CASE HTML:', testCase.path);
  const response = await fetch(testCase.path);
  let html = await response.text();
  console.log('[Debug] Fetched raw HTML for test case:', html);

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

  console.log('[Debug] Cleaned HTML for test case (scripts removed):', cleanedHtml);

  const iframeDoc = iframe.contentWindow!.document;
  iframeDoc.open();
  iframeDoc.write(cleanedHtml);
  iframeDoc.close();

  await new Promise(r => setTimeout(r, 300));

  const settings = await getSettings();
  const targetElement = iframeDoc.body;

  console.log('[Debug] Starting content processing...');
  const actual = processContent(targetElement, settings);
  console.log('[Debug] Actual output from processContent:', actual);

  document.body.removeChild(iframe);

  let status: 'passed' | 'failed' = 'passed';
  let diff = '';

  // If expected is missing, auto-fail to generate snapshot
  if (!expected) {
    status = 'failed';
    snapshotsToUpdate[snapshotPath] = actual;
    diff = '<ins>' + escapeHtml(actual) + '</ins>';
  } else {
    const diffResult = Diff.diffChars(expected, actual);
    if (diffResult.length > 1 || (diffResult.length === 1 && (diffResult[0].added || diffResult[0].removed))) {
      status = 'failed';
      snapshotsToUpdate[snapshotPath] = actual;
      diffResult.forEach(part => {
        const color = part.added ? 'ins' : part.removed ? 'del' : 'span';
        diff += `<${color}>${escapeHtml(part.value)}</${color}>`;
      });
    }
  }

  console.log(`[Debug] Test status: ${status}`);
  console.groupEnd();

  return { case: testCase, status, actual, expected: expected || '', diff };
}

function createResultElement(result: TestResult): HTMLElement {
  const el = document.createElement('div');
  el.className = 'test-case';
  el.id = `test-${result.case.path.replace(/[^a-zA-Z0-9]/g, '-')}`;
  el.innerHTML = `
    <div class="test-header">
      <span class="test-title">${result.case.title}</span>
      <span class="test-status ${result.status}">${result.status}</span>
    </div>
    <div class="test-content">
      <h3>Difference</h3>
      <div class="diff"><pre>${result.diff || 'No difference'}</pre></div>
      <h3>Actual Output</h3>
      <pre>${escapeHtml(result.actual)}</pre>
      <h3>Expected Snapshot</h3>
      <pre>${escapeHtml(result.expected)}</pre>
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
  statusEl.textContent = result.status;
  statusEl.className = `test-status ${result.status}`;

  if (result.status === 'failed') {
    el.querySelector('.test-content')!.classList.add('open');
    el.querySelector('.diff')!.innerHTML = `<pre>${result.diff}</pre>`;
    el.querySelectorAll('pre')[1].textContent = result.actual;
    el.querySelectorAll('pre')[2].textContent = result.expected;
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
