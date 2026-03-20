import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

import { EnvHttpProxyAgent, type Dispatcher } from 'undici';

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
  diagnosticVersion: 'v1-39';
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
    '  2) ALL_PROXY=http://127.0.0.1:7890    (兜底；若你的 ALL_PROXY 是 socks5，请改用本地 HTTP 代理端口或 VPN)',
    '',
    '优先级：CWS_PROXY > HTTPS_PROXY/https_proxy > HTTP_PROXY/http_proxy > ALL_PROXY/all_proxy',
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

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new CwsProxyConfigError(
      `代理配置错误：${envKey} 仅支持 http/https 代理（当前 protocol=${parsed.protocol}）。若你使用 socks5，请改用本地 HTTP 代理端口或 VPN。`,
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
  if (!resolved.proxyEnabled || !resolved.proxyUrlNormalized) return null;
  return new EnvHttpProxyAgent({
    httpProxy: resolved.proxyUrlNormalized,
    httpsProxy: resolved.proxyUrlNormalized,
    noProxy: resolved.noProxyValue
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
  const dispatcher = dispatcherInstalled ? 'undici.EnvHttpProxyAgent (setGlobalDispatcher)' : 'undici.default';
  return {
    diagnosticVersion: 'v1-39',
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
