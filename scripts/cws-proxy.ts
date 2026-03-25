import { execSync } from 'node:child_process';
import { lookup as dnsLookup } from 'node:dns/promises';
import { existsSync, readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import * as path from 'node:path';
import * as net from 'node:net';
import * as tls from 'node:tls';

import { Agent, EnvHttpProxyAgent, buildConnector, type Dispatcher } from 'undici';

export const CWS_PROXY_ENV_PRIORITY = [
  'CWS_PROXY',
  'HTTPS_PROXY',
  'https_proxy',
  'HTTP_PROXY',
  'http_proxy',
  'ALL_PROXY',
  'all_proxy'
] as const;

export type CwsProxyEnvKey = (typeof CWS_PROXY_ENV_PRIORITY)[number];

export const NO_PROXY_ENV_PRIORITY = ['NO_PROXY', 'no_proxy'] as const;
export type NoProxyEnvKey = (typeof NO_PROXY_ENV_PRIORITY)[number];

export const CWS_PROXY_SUPPORTED_PROTOCOLS = ['http:', 'https:', 'socks5:', 'socks5h:'] as const;
export type CwsProxySupportedProtocol = (typeof CWS_PROXY_SUPPORTED_PROTOCOLS)[number];

export const CWS_PROXY_FIX_COMMANDS = Object.freeze({
  startProxy: 'pxy',
  startProxyWithProfile: 'source ~/.bash_profile && pxy',
  retryDryRun: 'npm run publish:cws -- --dry-run'
});

export function buildProxyNotStartedFixCommand(options?: { retryCommand?: string | null }): string {
  const retryCommand = options?.retryCommand?.trim() || CWS_PROXY_FIX_COMMANDS.retryDryRun;
  return `${CWS_PROXY_FIX_COMMANDS.startProxyWithProfile} && ${retryCommand}`;
}

export class CwsProxyConfigError extends Error {
  public readonly help: string;

  constructor(message: string, help: string) {
    super(message);
    this.name = 'CwsProxyConfigError';
    this.help = help;
  }
}

export type ResolvedCwsProxyEnv = Readonly<{
  proxyEnabled: boolean;
  proxyEnvKey: CwsProxyEnvKey | null;
  proxyUrl: URL | null;
  proxyUrlNormalized: string | null;
  proxyUrlMasked: string | null;
  noProxyEnvKey: NoProxyEnvKey | null;
  noProxyValue: string;
}>;

export type CwsProxyDiagnostic = Readonly<{
  diagnosticVersion: 'v1-47';
  proxy: {
    enabled: boolean;
    envKey: string | null;
    urlMasked: string | null;
    noProxy: { envKey: string | null; value: string };
    precedence: string[];
    schemeRequired: true;
  };
  runtime: { node: string };
  script: { entry: string; gitCommit: string | null; packageVersion: string | null; extensionVersion: string | null };
  fetch: { globalFetch: boolean; dispatcher: string };
}>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function pickFirstEnvValue(
  env: NodeJS.ProcessEnv,
  keys: readonly string[]
): { key: string; value: string } | null {
  for (const key of keys) {
    const value = env[key];
    if (isNonEmptyString(value)) return { key, value: value.trim() };
  }
  return null;
}

function buildProxyHelpText(): string {
  return [
    '可复制示例（注意：代理 URL 必须包含 scheme）：',
    '  1) HTTPS_PROXY=http://127.0.0.1:7890  (推荐：多数本地代理提供 HTTP 代理端口)',
    '  2) HTTPS_PROXY=socks5://127.0.0.1:1080 (Socks5 代理端口；常见于 VPN/本地代理客户端)',
    '  3) HTTPS_PROXY=socks5h://127.0.0.1:1080 (Socks5 + 远程 DNS；当本地 DNS 受限/被污染时优先)',
    '  4) ALL_PROXY=http://127.0.0.1:7890    (兜底；与 HTTPS_PROXY 作用类似，但优先级更低)',
    '',
    '优先级：CWS_PROXY > HTTPS_PROXY/https_proxy > HTTP_PROXY/http_proxy > ALL_PROXY/all_proxy',
    '支持协议：http/https/socks5/socks5h',
    'NO_PROXY/no_proxy：用于指定不走代理的域名/IP（脚本默认至少包含 localhost/127.0.0.1/::1）'
  ].join('\n');
}

export function mergeNoProxyValue(noProxyRaw: string | null | undefined): string {
  // 约定：若用户未显式设置 NO_PROXY/no_proxy，则默认至少保证 localhost/127.0.0.1/::1 不走代理；
  // 若用户显式设置了 NO_PROXY/no_proxy，则尊重其原值（避免“强制追加”导致行为不可控）。
  if (!isNonEmptyString(noProxyRaw)) return 'localhost,127.0.0.1,::1';

  const entries: string[] = [];
  for (const entry of noProxyRaw.split(',')) {
    const trimmed = entry.trim();
    if (trimmed.length > 0) entries.push(trimmed);
  }
  return entries.join(',');
}

export function parseAndValidateProxyUrl(proxyUrlRaw: string, envKey: string): URL {
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(proxyUrlRaw)) {
    throw new CwsProxyConfigError(
      `代理配置错误：${envKey} 的值缺少 scheme（协议头），当前值为：${proxyUrlRaw}`,
      buildProxyHelpText()
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(proxyUrlRaw);
  } catch (error) {
    throw new CwsProxyConfigError(
      `代理配置错误：${envKey} 的值不是合法 URL：${proxyUrlRaw}`,
      buildProxyHelpText()
    );
  }

  if (!CWS_PROXY_SUPPORTED_PROTOCOLS.includes(parsed.protocol as CwsProxySupportedProtocol)) {
    throw new CwsProxyConfigError(
      `代理配置错误：${envKey} 仅支持 ${CWS_PROXY_SUPPORTED_PROTOCOLS.join('/')} 代理（当前 protocol=${parsed.protocol}）。`,
      buildProxyHelpText()
    );
  }

  return parsed;
}

export function maskProxyUrl(url: URL): string {
  const masked = new URL(url.toString());
  if (masked.username || masked.password) {
    masked.username = '***';
    masked.password = '***';
  }

  // 避免泄露 query/fragment（即使通常不会出现）
  masked.search = '';
  masked.hash = '';
  // URL.origin 对于非 http(s) scheme 可能为 "null"（例如 socks5://），这里手动拼接保证可审计输出稳定。
  if (masked.origin === 'null') return `${masked.protocol}//${masked.host}`;
  return masked.origin;
}

export function resolveCwsProxyEnv(env: NodeJS.ProcessEnv): ResolvedCwsProxyEnv {
  const proxyHit = pickFirstEnvValue(env, CWS_PROXY_ENV_PRIORITY);
  const noProxyHit = pickFirstEnvValue(env, NO_PROXY_ENV_PRIORITY);
  const mergedNoProxy = mergeNoProxyValue(noProxyHit?.value);

  if (!proxyHit) {
    return {
      proxyEnabled: false,
      proxyEnvKey: null,
      proxyUrl: null,
      proxyUrlNormalized: null,
      proxyUrlMasked: null,
      noProxyEnvKey: (noProxyHit?.key ?? null) as NoProxyEnvKey | null,
      noProxyValue: mergedNoProxy
    };
  }

  const proxyUrl = parseAndValidateProxyUrl(proxyHit.value, proxyHit.key);
  return {
    proxyEnabled: true,
    proxyEnvKey: proxyHit.key as CwsProxyEnvKey,
    proxyUrl,
    proxyUrlNormalized: proxyUrl.toString(),
    proxyUrlMasked: maskProxyUrl(proxyUrl),
    noProxyEnvKey: (noProxyHit?.key ?? null) as NoProxyEnvKey | null,
    noProxyValue: mergedNoProxy
  };
}

export function createUndiciProxyDispatcher(resolved: ResolvedCwsProxyEnv): Dispatcher | null {
  if (!resolved.proxyEnabled || !resolved.proxyUrl || !resolved.proxyUrlNormalized) return null;

  const proxyProtocol = resolved.proxyUrl.protocol as CwsProxySupportedProtocol;
  if (proxyProtocol === 'http:' || proxyProtocol === 'https:') {
    return new EnvHttpProxyAgent({
      httpProxy: resolved.proxyUrlNormalized,
      httpsProxy: resolved.proxyUrlNormalized,
      noProxy: resolved.noProxyValue
    });
  }

  // Socks5: 通过自定义 connector 走 socks5/socks5h，确保 Node global fetch(undici) 可用。
  // 注意：undici 没有内置 socks5 proxy agent，这里实现最小可用握手与 CONNECT。
  const proxyUrl = resolved.proxyUrl;
  const remoteDns = proxyProtocol === 'socks5h:';
  const proxyHost = proxyUrl.hostname;
  const proxyPort = proxyUrl.port ? Number(proxyUrl.port) : 1080;
  const proxyAuth =
    proxyUrl.username || proxyUrl.password
      ? { username: decodeURIComponent(proxyUrl.username), password: decodeURIComponent(proxyUrl.password) }
      : null;

  type UndiciConnector = ReturnType<typeof buildConnector>;
  type UndiciConnectorOptions = Parameters<UndiciConnector>[0];

  const directConnector: UndiciConnector = buildConnector({});

  const shouldBypassProxy = (hostname: string, port: string, noProxyValue: string): boolean => {
    const raw = (noProxyValue ?? '').trim();
    if (raw.length === 0) return false;

    const hostnameLower = hostname.toLowerCase();
    const portNumber = Number(port);

    for (const entryRaw of raw.split(',')) {
      const entry = entryRaw.trim();
      if (!entry) continue;
      if (entry === '*') return true;

      // 支持形如 "example.com:443"
      let entryHost = entry;
      let entryPort: number | null = null;
      const lastColon = entry.lastIndexOf(':');
      if (lastColon > -1 && lastColon < entry.length - 1) {
        const maybePort = entry.slice(lastColon + 1);
        if (/^\d+$/.test(maybePort)) {
          entryHost = entry.slice(0, lastColon);
          entryPort = Number(maybePort);
        }
      }
      if (entryPort !== null && Number.isFinite(portNumber) && entryPort !== portNumber) continue;

      const normalized = entryHost.trim().toLowerCase();
      if (!normalized) continue;

      const normalizedNoDot = normalized.startsWith('.') ? normalized.slice(1) : normalized;
      if (normalizedNoDot.length === 0) continue;

      // IP 精确匹配
      if (isIP(hostnameLower) && isIP(normalizedNoDot)) {
        if (hostnameLower === normalizedNoDot) return true;
        continue;
      }

      // 域名匹配：example.com 命中 example.com 与 *.example.com
      if (hostnameLower === normalizedNoDot) return true;
      if (hostnameLower.endsWith(`.${normalizedNoDot}`)) return true;
      if (normalized.startsWith('.') && hostnameLower.endsWith(normalized)) return true;
    }

    return false;
  };

  const ipv6ToBuffer = (addressRaw: string): Buffer => {
    const address = addressRaw.split('%')[0]; // strip zone id (e.g. fe80::1%lo0)
    const hasIpv4Tail = address.includes('.') && address.lastIndexOf(':') > -1;

    const [leftRaw, rightRaw] = address.split('::');
    const left = leftRaw ? leftRaw.split(':').filter((p) => p.length > 0) : [];
    const right = rightRaw ? rightRaw.split(':').filter((p) => p.length > 0) : [];

    let rightGroups = right;
    let leftGroups = left;
    let ipv4Groups: string[] = [];

    if (hasIpv4Tail) {
      const parts = address.split(':');
      const ipv4 = parts[parts.length - 1];
      const nums = ipv4.split('.').map((x) => Number(x));
      if (nums.length !== 4 || nums.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
        throw new Error(`Socks proxy IPv4-mapped IPv6 地址解析失败：${addressRaw}`);
      }
      const g1 = ((nums[0] << 8) | nums[1]).toString(16);
      const g2 = ((nums[2] << 8) | nums[3]).toString(16);
      ipv4Groups = [g1, g2];

      // 重新计算左右组：把 ipv4 tail 从最后一组里剥离
      const base = address.slice(0, address.lastIndexOf(':'));
      const [l2, r2] = base.split('::');
      leftGroups = l2 ? l2.split(':').filter((p) => p.length > 0) : [];
      rightGroups = r2 ? r2.split(':').filter((p) => p.length > 0) : [];
    }

    const needsExpansion = address.includes('::');
    const totalGroups = leftGroups.length + rightGroups.length + ipv4Groups.length;
    const missing = needsExpansion ? 8 - totalGroups : 0;
    if (missing < 0) throw new Error(`Socks proxy IPv6 地址解析失败：${addressRaw}`);

    const groups = needsExpansion
      ? [...leftGroups, ...Array.from({ length: missing }, () => '0'), ...rightGroups, ...ipv4Groups]
      : [...leftGroups, ...rightGroups, ...ipv4Groups];

    if (groups.length !== 8) throw new Error(`Socks proxy IPv6 地址解析失败：${addressRaw}`);

    const bytes: number[] = [];
    for (const g of groups) {
      const v = parseInt(g || '0', 16);
      if (!Number.isFinite(v) || v < 0 || v > 0xffff) throw new Error(`Socks proxy IPv6 地址解析失败：${addressRaw}`);
      bytes.push((v >> 8) & 0xff, v & 0xff);
    }
    return Buffer.from(bytes);
  };

  const connectThroughSocks5 = async (options: UndiciConnectorOptions): Promise<net.Socket | tls.TLSSocket> => {
    if (options.httpSocket) {
      throw new Error('Socks proxy connector 不支持 options.httpSocket（仅支持直连 origin）。');
    }

    const targetHost = options.hostname;
    const inferredPort = options.protocol === 'https:' ? 443 : 80;
    const targetPort = options.port ? Number(options.port) : inferredPort;
    if (!Number.isFinite(targetPort) || targetPort <= 0) {
      throw new Error(`Socks proxy connector 目标端口不合法：${options.port}`);
    }

    // 1) 连接到 socks5 proxy
    const socket = await new Promise<net.Socket>((resolve, reject) => {
      const connectTimeoutMs = 10_000;
      const s = net.connect({ host: proxyHost, port: proxyPort });
      const timer = setTimeout(() => {
        s.destroy(new Error('Socks proxy 连接超时（connect timeout）。'));
      }, connectTimeoutMs);

      s.once('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
      s.once('connect', () => {
        clearTimeout(timer);
        resolve(s);
      });
    });

    // 2) socks5 握手（完成后 pause + 清理监听，避免吞数据）
    const handshakeTimeoutMs = 15_000;
    socket.setTimeout(handshakeTimeoutMs);

    let buffer = Buffer.alloc(0);
    type PendingRead = { len: number; resolve: (buf: Buffer) => void; reject: (err: Error) => void };
    const pending: PendingRead[] = [];

    const cleanupHandshakeListeners = () => {
      socket.setTimeout(0);
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('close', onClose);
      socket.off('timeout', onTimeout);
    };

    const failHandshake = (err: Error) => {
      cleanupHandshakeListeners();
      for (const p of pending) p.reject(err);
      pending.length = 0;
    };

    const flushReads = () => {
      while (pending.length > 0 && buffer.length >= pending[0].len) {
        const p = pending.shift();
        if (!p) return;
        const out = buffer.subarray(0, p.len);
        buffer = buffer.subarray(p.len);
        p.resolve(out);
      }
    };

    const onData = (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      flushReads();
    };
    const onError = (err: Error) => failHandshake(err);
    const onClose = () => failHandshake(new Error('Socks proxy socket 在握手阶段意外关闭。'));
    const onTimeout = () => {
      const err = new Error('Socks proxy 握手超时（handshake timeout）。');
      socket.destroy(err);
      failHandshake(err);
    };

    socket.on('data', onData);
    socket.on('error', onError);
    socket.on('close', onClose);
    socket.on('timeout', onTimeout);

    const readExactly = (len: number): Promise<Buffer> =>
      new Promise((resolve, reject) => {
        if (buffer.length >= len) {
          const out = buffer.subarray(0, len);
          buffer = buffer.subarray(len);
          resolve(out);
          return;
        }
        pending.push({ len, resolve, reject });
      });

    try {
      // 2.1) 选择认证方式
      const methods: number[] = [0x00];
      if (proxyAuth) methods.push(0x02);
      socket.write(Buffer.from([0x05, methods.length, ...methods]));

      const methodReply = await readExactly(2);
      if (methodReply[0] !== 0x05) throw new Error(`Socks proxy 握手失败：版本不匹配（${methodReply[0]}）`);
      const method = methodReply[1];
      if (method === 0xff) throw new Error('Socks proxy 握手失败：不支持的认证方式。');

      if (method === 0x02) {
        if (!proxyAuth) throw new Error('Socks proxy 要求用户名密码认证，但 proxy URL 未提供用户名/密码。');
        const u = Buffer.from(proxyAuth.username);
        const p = Buffer.from(proxyAuth.password);
        if (u.length > 255 || p.length > 255) throw new Error('Socks proxy 用户名/密码过长（>255）。');
        socket.write(Buffer.concat([Buffer.from([0x01, u.length]), u, Buffer.from([p.length]), p]));
        const authReply = await readExactly(2);
        if (authReply[0] !== 0x01 || authReply[1] !== 0x00) {
          throw new Error('Socks proxy 用户名密码认证失败。');
        }
      } else if (method !== 0x00) {
        throw new Error(`Socks proxy 选择了未实现的认证方式：0x${method.toString(16)}`);
      }

      // 2.2) CONNECT 到目标
      let atyp: number;
      let addrBuf: Buffer;
      const ipType = isIP(targetHost);
      if (ipType === 4) {
        atyp = 0x01;
        addrBuf = Buffer.from(targetHost.split('.').map((x) => Number(x)));
      } else if (ipType === 6) {
        atyp = 0x04;
        addrBuf = ipv6ToBuffer(targetHost);
      } else if (remoteDns) {
        atyp = 0x03;
        const hostBuf = Buffer.from(targetHost);
        if (hostBuf.length > 255) throw new Error('Socks proxy 目标域名过长（>255）。');
        addrBuf = Buffer.concat([Buffer.from([hostBuf.length]), hostBuf]);
      } else {
        // socks5://：按约定优先本地解析（本地 DNS 不可达时建议切换 socks5h://）
        const lookedUp = await dnsLookup(targetHost);
        if (lookedUp.family === 6) {
          atyp = 0x04;
          addrBuf = ipv6ToBuffer(lookedUp.address);
        } else {
          atyp = 0x01;
          addrBuf = Buffer.from(lookedUp.address.split('.').map((x) => Number(x)));
        }
      }

      const portBuf = Buffer.from([(targetPort >> 8) & 0xff, targetPort & 0xff]);
      const request = Buffer.concat([Buffer.from([0x05, 0x01, 0x00, atyp]), addrBuf, portBuf]);
      socket.write(request);

      const header = await readExactly(4);
      if (header[0] !== 0x05) throw new Error(`Socks proxy CONNECT 失败：版本不匹配（${header[0]}）`);
      const rep = header[1];
      const repText = (code: number): string => {
        switch (code) {
          case 0x00:
            return 'succeeded';
          case 0x01:
            return 'general SOCKS server failure';
          case 0x02:
            return 'connection not allowed by ruleset';
          case 0x03:
            return 'network unreachable';
          case 0x04:
            return 'host unreachable';
          case 0x05:
            return 'connection refused';
          case 0x06:
            return 'TTL expired';
          case 0x07:
            return 'command not supported';
          case 0x08:
            return 'address type not supported';
          default:
            return `unknown(${code})`;
        }
      };
      if (rep !== 0x00) throw new Error(`Socks proxy CONNECT 失败：${repText(rep)} (0x${rep.toString(16)})`);

      const replyAtyp = header[3];
      if (replyAtyp === 0x01) {
        await readExactly(4);
      } else if (replyAtyp === 0x04) {
        await readExactly(16);
      } else if (replyAtyp === 0x03) {
        const lenBuf = await readExactly(1);
        await readExactly(lenBuf[0]);
      } else {
        throw new Error(`Socks proxy CONNECT 返回不支持的 ATYP：0x${replyAtyp.toString(16)}`);
      }
      await readExactly(2); // bind port
      cleanupHandshakeListeners();
    } catch (error) {
      cleanupHandshakeListeners();
      socket.destroy();
      throw error;
    } finally {
      // 返回给 undici 前，必须暂停 socket，避免在无 data listener 时数据被丢弃。
      socket.pause();
    }

    if (options.protocol === 'https:') {
      return await new Promise<tls.TLSSocket>((resolve, reject) => {
        const tlsSocket = tls.connect({
          socket,
          servername: options.servername ?? options.hostname
        });
        tlsSocket.once('secureConnect', () => resolve(tlsSocket));
        tlsSocket.once('error', (err) => reject(err));
      });
    }

    return socket;
  };

  const socksConnector: UndiciConnector = (options, callback) => {
    try {
      const inferredPort = options.protocol === 'https:' ? '443' : '80';
      const effectivePort = options.port && options.port.length > 0 ? options.port : inferredPort;
      if (shouldBypassProxy(options.hostname, effectivePort, resolved.noProxyValue)) {
        directConnector(options, callback);
        return;
      }
      void connectThroughSocks5(options)
        .then((s) => callback(null, s))
        .catch((err) => callback(err as Error, null));
    } catch (err) {
      callback(err as Error, null);
    }
  };

  return new Agent({
    connect: socksConnector
  });
}

export function getGitCommitShort(): string | null {
  try {
    const out = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function getPackageVersion(): string | null {
  if (isNonEmptyString(process.env.npm_package_version)) return process.env.npm_package_version.trim();

  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const raw = readFileSync(pkgPath, 'utf-8');
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === 'string' ? parsed.version : null;
  } catch {
    return null;
  }
}

export function getExtensionVersionFromManifest(): string | null {
  try {
    const manifestPath = path.resolve(process.cwd(), 'manifest.json');
    if (!existsSync(manifestPath)) return null;
    const raw = readFileSync(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === 'string' ? parsed.version : null;
  } catch {
    return null;
  }
}

export function buildCwsProxyDiagnostic(
  resolved: ResolvedCwsProxyEnv,
  dispatcherInstalled: boolean
): CwsProxyDiagnostic {
  let dispatcher = 'undici.default';
  if (dispatcherInstalled) {
    const protocol = resolved.proxyUrl?.protocol as CwsProxySupportedProtocol | undefined;
    if (protocol === 'socks5:' || protocol === 'socks5h:') {
      dispatcher = 'undici.Agent (socks5 connector) (setGlobalDispatcher)';
    } else {
      dispatcher = 'undici.EnvHttpProxyAgent (setGlobalDispatcher)';
    }
  }
  return {
    diagnosticVersion: 'v1-47',
    proxy: {
      enabled: resolved.proxyEnabled,
      envKey: resolved.proxyEnvKey,
      urlMasked: resolved.proxyUrlMasked,
      noProxy: { envKey: resolved.noProxyEnvKey, value: resolved.noProxyValue },
      precedence: [...CWS_PROXY_ENV_PRIORITY],
      schemeRequired: true
    },
    runtime: { node: process.version },
    script: {
      entry: 'scripts/chrome-webstore.ts',
      gitCommit: getGitCommitShort(),
      packageVersion: getPackageVersion(),
      extensionVersion: getExtensionVersionFromManifest()
    },
    fetch: { globalFetch: typeof fetch === 'function', dispatcher }
  };
}

export function formatCwsProxyDiagnosticBlock(diagnostic: CwsProxyDiagnostic): string {
  return [
    '-----BEGIN CWS PROXY DIAGNOSTIC BLOCK-----',
    JSON.stringify(diagnostic, null, 2),
    '-----END CWS PROXY DIAGNOSTIC BLOCK-----'
  ].join('\n');
}
