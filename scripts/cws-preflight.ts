import { CWS_PROXY_FIX_COMMANDS, buildProxyNotStartedFixCommand, type CwsProxyDiagnostic } from './cws-proxy.ts';

export type CwsPreflightFailureType =
  | 'dns'
  | 'timeout'
  | 'tls'
  | 'connection_refused'
  | 'permission'
  | 'http_status'
  | 'unknown';

export type CwsPreflightTarget = Readonly<{
  id: string;
  url: string;
  method?: 'GET' | 'HEAD' | 'POST';
  headers?: Record<string, string>;
  body?: string;
}>;

export type CwsPreflightCheckResult = Readonly<{
  id: string;
  url: string;
  hostname: string;
  method: 'GET' | 'HEAD' | 'POST';
  ok: boolean;
  status: number | null;
  failureType: CwsPreflightFailureType | null;
  errorCode: string | null;
  errorMessage: string | null;
  elapsedMs: number;
}>;

export type CwsPreflightReport = Readonly<{
  reportVersion: 'v1-47';
  generatedAt: string;
  timeoutMs: number;
  checks: CwsPreflightCheckResult[];
  summary: { total: number; pass: number; fail: number };
}>;

export type CwsPublishDiagnosticPack = Readonly<{
  packVersion: 'v1-47';
  proxy: CwsProxyDiagnostic;
  preflight: CwsPreflightReport;
  proxyReadiness?: CwsProxyReadiness;
}>;

export type CwsProxyReadinessStatus = 'ready' | 'proxy_not_started' | 'network_blocked' | 'non_proxy_blocking';

export type CwsProxyReadiness = Readonly<{
  status: CwsProxyReadinessStatus;
  fixCommand: string | null;
  blocking: boolean;
}>;

export function getDefaultCwsPreflightTargets(): CwsPreflightTarget[] {
  return [
    {
      id: 'googleapis',
      url: 'https://www.googleapis.com/discovery/v1/apis',
      method: 'GET'
    },
    {
      id: 'chromewebstore-googleapis-host',
      url: 'https://chromewebstore.googleapis.com/',
      method: 'GET'
    }
  ];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function extractErrorCode(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const anyError = error as unknown as Record<string, unknown>;
  if (typeof anyError.code === 'string') return anyError.code;

  const cause = anyError.cause;
  if (cause && typeof cause === 'object') {
    const anyCause = cause as Record<string, unknown>;
    if (typeof anyCause.code === 'string') return anyCause.code;
  }

  return null;
}

export function extractErrorCauseMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const anyError = error as unknown as Record<string, unknown>;
  const cause = anyError.cause;
  if (cause && typeof cause === 'object') {
    const anyCause = cause as Record<string, unknown>;
    if (typeof anyCause.message === 'string' && anyCause.message.trim().length > 0) return anyCause.message.trim();
  }
  return null;
}

export function classifyCwsPreflightError(error: unknown): {
  failureType: CwsPreflightFailureType;
  errorCode: string | null;
  errorMessage: string | null;
} {
  const errorCode = extractErrorCode(error);
  const errorMessage = error instanceof Error ? error.message : null;
  const errorName = error instanceof Error ? error.name : '';
  const causeMessage = extractErrorCauseMessage(error);
  const mergedMessage = isNonEmptyString(causeMessage) ? causeMessage : errorMessage;

  const code = (errorCode ?? '').toUpperCase();
  const msg = (mergedMessage ?? '').toLowerCase();

  if (errorName === 'AbortError' || code === 'ABORT_ERR' || msg.includes('aborted')) {
    return { failureType: 'timeout', errorCode: errorCode ?? 'ABORT_ERR', errorMessage: mergedMessage ?? 'aborted' };
  }

  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return { failureType: 'dns', errorCode, errorMessage: mergedMessage };
  }
  if (code === 'ECONNREFUSED') {
    return { failureType: 'connection_refused', errorCode, errorMessage: mergedMessage };
  }
  if (code === 'EPERM' || code === 'EACCES') {
    return { failureType: 'permission', errorCode, errorMessage: mergedMessage };
  }
  if (
    code === 'ETIMEDOUT' ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'UND_ERR_HEADERS_TIMEOUT' ||
    code === 'UND_ERR_BODY_TIMEOUT' ||
    code === 'UND_ERR_RESPONSE_TIMEOUT'
  ) {
    return { failureType: 'timeout', errorCode, errorMessage: mergedMessage };
  }

  const tlsCodes = [
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
    'CERT_HAS_EXPIRED',
    'ERR_TLS_CERT_ALTNAME_INVALID',
    'ERR_TLS_HANDSHAKE_TIMEOUT',
    'ERR_SSL_WRONG_VERSION_NUMBER'
  ];
  if (code.startsWith('ERR_TLS') || tlsCodes.includes(code) || msg.includes('certificate') || msg.includes('tls')) {
    return { failureType: 'tls', errorCode, errorMessage: mergedMessage };
  }

  return { failureType: 'unknown', errorCode, errorMessage: mergedMessage };
}

function isPreflightHttpStatusPass(status: number): boolean {
  // 目标：判断“网络可达性”，而不是“鉴权是否成功”。
  // - 4xx 大多代表可达（无 token/无权限很常见），因此按 PASS 处理。
  // - 407/5xx 通常代表代理/网关层问题或目标服务异常，按 FAIL 处理并输出 status。
  if (status === 407) return false;
  if (status >= 500) return false;
  return true;
}

export async function runCwsPreflight(
  targets: readonly CwsPreflightTarget[],
  options?: {
    fetchFn?: typeof fetch;
    timeoutMs?: number;
    now?: () => number;
    date?: () => Date;
  }
): Promise<CwsPreflightReport> {
  const fetchFn = options?.fetchFn ?? fetch;
  const timeoutMs = options?.timeoutMs ?? 8_000;
  const now = options?.now ?? (() => Date.now());
  const date = options?.date ?? (() => new Date());

  const checks: CwsPreflightCheckResult[] = [];
  for (const target of targets) {
    const method = target.method ?? 'GET';
    const url = target.url;
    const hostname = new URL(url).hostname;
    const startedAt = now();

    try {
      const signal =
        typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(timeoutMs)
          : undefined;

      const res = await fetchFn(url, {
        method,
        headers: target.headers,
        body: target.body,
        signal
      });

      const status = res.status;
      const ok = isPreflightHttpStatusPass(status);
      checks.push({
        id: target.id,
        url,
        hostname,
        method,
        ok,
        status,
        failureType: ok ? null : 'http_status',
        errorCode: null,
        errorMessage: null,
        elapsedMs: now() - startedAt
      });
    } catch (error) {
      const classified = classifyCwsPreflightError(error);
      checks.push({
        id: target.id,
        url,
        hostname,
        method,
        ok: false,
        status: null,
        failureType: classified.failureType,
        errorCode: classified.errorCode,
        errorMessage: classified.errorMessage,
        elapsedMs: now() - startedAt
      });
    }
  }

  const pass = checks.filter((c) => c.ok).length;
  const fail = checks.length - pass;

  return {
    reportVersion: 'v1-47',
    generatedAt: date().toISOString(),
    timeoutMs,
    checks,
    summary: { total: checks.length, pass, fail }
  };
}

export function formatCwsPreflightReportBlock(report: CwsPreflightReport): string {
  return [
    '-----BEGIN CWS PREFLIGHT REPORT BLOCK-----',
    JSON.stringify(report, null, 2),
    '-----END CWS PREFLIGHT REPORT BLOCK-----'
  ].join('\n');
}

export function formatCwsPublishDiagnosticPackBlock(pack: CwsPublishDiagnosticPack): string {
  return [
    '-----BEGIN CWS PUBLISH DIAGNOSTIC PACK-----',
    JSON.stringify(pack, null, 2),
    '-----END CWS PUBLISH DIAGNOSTIC PACK-----'
  ].join('\n');
}

function isNetworkReachabilityFailure(check: CwsPreflightCheckResult): boolean {
  if (check.ok) return false;
  if (check.failureType === 'dns') return true;
  if (check.failureType === 'timeout') return true;
  if (check.failureType === 'connection_refused') return true;
  if (check.failureType === 'permission') return true;
  if (check.failureType === 'unknown') return true;
  if (check.failureType !== 'http_status') return false;
  return check.status === 407 || (typeof check.status === 'number' && check.status >= 500);
}

export function evaluateCwsProxyReadiness(
  report: CwsPreflightReport,
  proxy: { enabled: boolean }
): CwsProxyReadiness {
  const failures = report.checks.filter((check) => !check.ok);
  if (failures.length === 0) {
    return { status: 'ready', fixCommand: null, blocking: false };
  }

  const hasNetworkReachabilityFailure = failures.some((check) => isNetworkReachabilityFailure(check));
  if (hasNetworkReachabilityFailure && !proxy.enabled) {
    return {
      status: 'proxy_not_started',
      fixCommand: buildProxyNotStartedFixCommand({ retryCommand: CWS_PROXY_FIX_COMMANDS.retryDryRun }),
      blocking: true
    };
  }

  if (hasNetworkReachabilityFailure) {
    return { status: 'network_blocked', fixCommand: null, blocking: true };
  }

  return { status: 'non_proxy_blocking', fixCommand: null, blocking: true };
}

export function buildCwsPreflightFixHints(
  report: CwsPreflightReport,
  proxy: { enabled: boolean; envKey: string | null; urlMasked: string | null; protocol: string | null }
): string[] {
  const failures = report.checks.filter((c) => !c.ok);
  if (failures.length === 0) return [];

  const hints: string[] = [];
  const proxyReadiness = evaluateCwsProxyReadiness(report, { enabled: proxy.enabled });

  if (proxyReadiness.status === 'proxy_not_started') {
    hints.push('阻塞分类：proxy_not_started（目标网络不可达，且未检测到可用代理配置）。');
    hints.push(`先启动代理：${CWS_PROXY_FIX_COMMANDS.startProxy}`);
    hints.push(`若当前 shell 未加载 profile：${CWS_PROXY_FIX_COMMANDS.startProxyWithProfile}`);
    hints.push(`然后重试：${CWS_PROXY_FIX_COMMANDS.retryDryRun}`);
    if (proxyReadiness.fixCommand) {
      hints.push(`一键串联命令：${proxyReadiness.fixCommand}`);
    }
    hints.push('当前未命中 CWS_PROXY/HTTPS_PROXY/HTTP_PROXY/ALL_PROXY。');
    hints.push('若使用环境变量配置代理，请确保代理 URL 含 scheme（http/https/socks5/socks5h）。');
  } else if (!proxy.enabled) {
    hints.push('当前未启用代理：请设置 CWS_PROXY 或 HTTPS_PROXY（支持 http/https/socks5/socks5h）。');
    hints.push('示例：export HTTPS_PROXY=http://127.0.0.1:7890');
    hints.push('示例：export HTTPS_PROXY=socks5://127.0.0.1:1080');
    hints.push('示例：export HTTPS_PROXY=socks5h://127.0.0.1:1080  # 远程 DNS（推荐排查 DNS 失败）');
    hints.push('建议：export NO_PROXY=localhost,127.0.0.1,::1');
  } else {
    hints.push(`当前代理已启用：命中 ${proxy.envKey ?? 'UNKNOWN'}=${proxy.urlMasked ?? 'UNKNOWN'}`);
  }

  const hasDnsFailure = failures.some((f) => f.failureType === 'dns');
  const hasTimeoutFailure = failures.some((f) => f.failureType === 'timeout');
  const hasConnRefused = failures.some((f) => f.failureType === 'connection_refused');
  const hasPermissionFailure = failures.some((f) => f.failureType === 'permission');
  const hasProxyAuth = failures.some((f) => f.failureType === 'http_status' && f.status === 407);

  if (hasConnRefused) {
    hints.push('观测到连接被拒绝：通常表示本地代理未启动/端口写错/被防火墙拦截。请确认代理进程与端口可用。');
  }
  if (hasPermissionFailure) {
    hints.push('观测到连接权限错误（EPERM/EACCES）：可能是系统防火墙/安全软件/运行环境沙箱阻止了网络连接。请检查网络权限或更换环境重试。');
  }
  if (hasTimeoutFailure) {
    hints.push('观测到连接超时：通常表示代理不可达、网络不稳定或目标被阻断。可尝试更换代理/VPN 节点或缩短链路。');
  }
  if (hasDnsFailure) {
    if (proxy.protocol === 'socks5:') {
      hints.push('观测到 DNS 失败且当前为 socks5://：可切换到 socks5h:// 让代理侧解析域名（远程 DNS）。');
    } else {
      hints.push('观测到 DNS 失败：通常表示直连 DNS 不可用/被污染或代理未生效。请检查代理是否生效或切换 socks5h://。');
    }
  }
  if (hasProxyAuth) {
    hints.push('观测到 HTTP 407：代理需要认证（Proxy Authentication Required）。请在代理 URL 中提供用户名密码或更换无需认证的本地代理端口。');
  }

  hints.push('提示：可先执行 `npm run publish:cws -- --dry-run` 获取完整诊断块与预检报告，再粘贴到 Issue 排障。');
  return hints;
}
