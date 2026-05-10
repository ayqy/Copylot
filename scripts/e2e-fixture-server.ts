import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Socket } from 'node:net';

const HOST = '127.0.0.1';
const PORT = 4173;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function resolveFixturePath(urlPathname: string): string {
  const cleanPath = urlPathname === '/' ? '/index.html' : urlPathname;
  const withoutTraversal = path.posix.normalize(cleanPath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.resolve(process.cwd(), 'e2e/fixtures', `.${withoutTraversal}`);
}

export async function startFixtureServer(): Promise<{
  origin: string;
  close(): Promise<void>;
}> {
  const sockets = new Set<Socket>();
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);
      const filePath = resolveFixturePath(requestUrl.pathname);
      const ext = path.extname(filePath).toLowerCase();
      const body = await readFile(filePath);
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
    server.listen(PORT, HOST, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return {
    origin: `http://${HOST}:${PORT}`,
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
