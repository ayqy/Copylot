import http from 'node:http';
import fs from 'node:fs/promises';
import type { Socket } from 'node:net';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const reportPath = path.resolve(process.cwd(), '.tmp_e2e/html-to-markdown-report.json');
const HOST = '127.0.0.1';
const TEST_ROOT = path.resolve(process.cwd(), '.tmp_e2e/extension');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.png': 'image/png'
};

interface HtmlToMarkdownReport {
  total: number;
  passed: number;
  failed: number;
  failedTitles: string[];
}

function resolveTestAssetPath(urlPathname: string): string {
  const cleanPath = urlPathname === '/' ? '/test/index.html' : urlPathname;
  const normalized = path.posix.normalize(cleanPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.resolve(TEST_ROOT, `.${normalized}`);
}

function parseCount(text: string | null): number {
  const match = text?.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

async function writeReport(report: HtmlToMarkdownReport): Promise<void> {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
}

async function startStaticServer(): Promise<{
  origin: string;
  close(): Promise<void>;
}> {
  const sockets = new Set<Socket>();
  let listeningPort = 0;
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://${HOST}:${listeningPort}`);
      const filePath = resolveTestAssetPath(requestUrl.pathname);
      if (!filePath.startsWith(TEST_ROOT)) {
        throw new Error('path traversal rejected');
      }

      const body = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'content-type': MIME_TYPES[ext] || 'application/octet-stream',
        'cache-control': 'no-store',
        connection: 'close'
      });
      res.shouldKeepAlive = false;
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    }
  });

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => {
      sockets.delete(socket);
    });
  });
  server.keepAliveTimeout = 0;

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, HOST, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to resolve html-to-markdown server address');
  }

  listeningPort = address.port;

  return {
    origin: `http://${HOST}:${listeningPort}`,
    async close() {
      for (const socket of sockets) {
        socket.destroy();
      }
      server.closeAllConnections?.();
      server.closeIdleConnections?.();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };
}

async function run(): Promise<void> {
  const server = await startStaticServer();
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chromium',
      headless: true
    });
  } catch {
    browser = await chromium.launch({
      headless: true
    });
  }

  try {
    const page = await browser.newPage();
    await page.goto(`${server.origin}/test/index.html`);
    await page.waitForLoadState('domcontentloaded');

    await expect
      .poll(async () => {
        return parseCount(await page.locator('#stats-total').textContent());
      })
      .toBeGreaterThan(0);

    await page.locator('#run-all-btn').click();

    await expect
      .poll(async () => {
        const total = parseCount(await page.locator('#stats-total').textContent());
        const passed = parseCount(await page.locator('#stats-passed').textContent());
        const failed = parseCount(await page.locator('#stats-failed').textContent());
        return total > 0 && passed + failed === total;
      }, { timeout: 180_000 })
      .toBe(true);

    const total = parseCount(await page.locator('#stats-total').textContent());
    const passed = parseCount(await page.locator('#stats-passed').textContent());
    const failed = parseCount(await page.locator('#stats-failed').textContent());
    const failedTitles = await page
      .locator('.test-case')
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.querySelector('.test-status')?.textContent?.trim() === 'failed')
          .map((element) => element.querySelector('.test-title')?.textContent?.trim() || 'unknown')
      );

    await writeReport({
      total,
      passed,
      failed,
      failedTitles
    });

    if (total <= 0 || passed !== total || failed !== 0) {
      throw new Error(
        `html-to-markdown-tests failed: total=${total}, passed=${passed}, failed=${failed}, failedTitles=${failedTitles.join(', ')}`
      );
    }

    console.log(`PASS html-to-markdown-tests (${total} cases)`);
    await page.close();
  } finally {
    await browser.close();
    await server.close();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
