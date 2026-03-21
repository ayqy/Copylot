#!/usr/bin/env node
/*
  chrome-webstore.ts
  ------------------
  独立脚本：读取 .env 中的凭据，将 dist 打包的 zip 上传并立即发布到 Chrome Web Store。
  可单独执行，也可被 publish.ts 调用。

  V1-33 要求：
  - 强制执行 `bash scripts/test.sh`（生产回归 + 产物自检）作为唯一发布门禁
  - 校验 `dist/manifest.json` 的 `version === manifest.json.version`
  - 基于当前 `dist/` 重新生成 `plugin-${version}.zip`（若存在则先删除再生成）
  - 支持 `--dry-run`：不进行任何 upload/publish 网络调用；允许无 `.env` 凭据演练前置流程；但会执行网络可达性预检（Preflight）并输出可审计报告
*/

import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import { execSync } from 'child_process';

import { setGlobalDispatcher } from 'undici';

import {
  CwsProxyConfigError,
  buildCwsProxyDiagnostic,
  createUndiciProxyDispatcher,
  formatCwsProxyDiagnosticBlock,
  resolveCwsProxyEnv,
  type ResolvedCwsProxyEnv
} from './cws-proxy.ts';
import {
  buildCwsPreflightFixHints,
  formatCwsPreflightReportBlock,
  formatCwsPublishDiagnosticPackBlock,
  getDefaultCwsPreflightTargets,
  runCwsPreflight
} from './cws-preflight.ts';
import {
  buildCwsPublishEvidencePack,
  buildCwsPublishEvidenceZip,
  formatCwsPublishEvidencePackFilename,
  type CwsPublishEvidenceCredentials,
  type CwsPublishEvidencePublishAttempt,
  writeCwsPublishEvidencePackJsonFile
} from './cws-publish-evidence-pack.ts';

function setupCwsProxyOrExit(env: NodeJS.ProcessEnv): { resolved: ResolvedCwsProxyEnv; dispatcherInstalled: boolean } {
  try {
    const resolved = resolveCwsProxyEnv(env);
    const dispatcher = createUndiciProxyDispatcher(resolved);
    if (dispatcher) {
      setGlobalDispatcher(dispatcher);
      return { resolved, dispatcherInstalled: true };
    }
    return { resolved, dispatcherInstalled: false };
  } catch (error) {
    if (error instanceof CwsProxyConfigError) {
      console.error(`[CWS] ${error.message}`);
      console.error(error.help);
      process.exit(1);
    }
    console.error('[CWS] Proxy 初始化失败（未知错误）：', error);
    process.exit(1);
  }
}

const cwsProxySetup = setupCwsProxyOrExit(process.env);
const cwsProxyResolved = cwsProxySetup.resolved;

// 可复制/可审计：用于排障与简报留证（禁止包含 token/secret）
const cwsProxyDiagnostic = buildCwsProxyDiagnostic(cwsProxyResolved, cwsProxySetup.dispatcherInstalled);
console.log(formatCwsProxyDiagnosticBlock(cwsProxyDiagnostic));

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function logInfo(msg: string) {
  console.info(`${colors.blue}[CWS] ${msg}${colors.reset}`);
}
function logSuccess(msg: string) {
  console.log(`${colors.green}[CWS] ${msg}${colors.reset}`);
}
function logWarn(msg: string) {
  console.warn(`${colors.yellow}[CWS] ${msg}${colors.reset}`);
}
function logError(msg: string) {
  console.error(`${colors.red}[CWS] ${msg}${colors.reset}`);
}

function extractErrorCode(error: Error): string | null {
  const anyError = error as unknown as Record<string, unknown>;
  if (typeof anyError.code === 'string') return anyError.code;

  const cause = anyError.cause;
  if (cause && typeof cause === 'object') {
    const anyCause = cause as Record<string, unknown>;
    if (typeof anyCause.code === 'string') return anyCause.code;
  }

  return null;
}

function extractErrorCauseMessage(error: Error): string | null {
  const anyError = error as unknown as Record<string, unknown>;
  const cause = anyError.cause;
  if (cause && typeof cause === 'object') {
    const anyCause = cause as Record<string, unknown>;
    if (typeof anyCause.message === 'string' && anyCause.message.trim().length > 0) return anyCause.message.trim();
  }
  return null;
}

function printActionableNetworkHints(error: Error) {
  const code = extractErrorCode(error);
  const causeMessage = extractErrorCauseMessage(error);

  console.error('\n下一步排障指引（可复制执行；禁止粘贴任何 token/secret 到日志）：');
  if (code) console.error(`- 观测到错误码：${code}`);
  if (causeMessage) console.error(`- 底层原因：${causeMessage}`);

  // 结合当前代理状态给出更可执行的动作
  if (!cwsProxyResolved.proxyEnabled) {
    console.error('- 当前 Proxy Diagnostic Block 显示：proxy.enabled=false（未启用代理）。');
  } else {
    console.error(
      `- 当前 Proxy Diagnostic Block 显示：proxy.enabled=true（命中 ${cwsProxyResolved.proxyEnvKey}=${cwsProxyResolved.proxyUrlMasked}）。`
    );
  }

  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    console.error('- 这通常表示 DNS/网络不可达（常见于直连 Google 被阻断，或代理未生效）。');
  }
  if (code === 'ECONNREFUSED') {
    console.error('- 这通常表示代理地址/端口不可用（本地代理未启动、端口写错、或被防火墙拦截）。');
  }
  if (code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT') {
    console.error('- 这通常表示连接超时（代理不可达、网络不稳定，或目标被阻断）。');
  }

  console.error('\n环境变量示例（任选其一；代理 URL 必须包含 scheme）：');
  console.error('  示例 1（HTTPS_PROXY）：');
  console.error('    export HTTPS_PROXY=http://127.0.0.1:7890');
  console.error('    export NO_PROXY=localhost,127.0.0.1,::1');
  console.error('    npm run publish:cws');
  console.error('  示例 1b（HTTPS_PROXY + socks5）：');
  console.error('    export HTTPS_PROXY=socks5://127.0.0.1:1080');
  console.error('    export NO_PROXY=localhost,127.0.0.1,::1');
  console.error('    npm run publish:cws');
  console.error('  示例 1c（HTTPS_PROXY + socks5h 远程 DNS）：');
  console.error('    export HTTPS_PROXY=socks5h://127.0.0.1:1080');
  console.error('    export NO_PROXY=localhost,127.0.0.1,::1');
  console.error('    npm run publish:cws');
  console.error('  示例 2（ALL_PROXY 兜底）：');
  console.error('    export ALL_PROXY=http://127.0.0.1:7890');
  console.error('    export NO_PROXY=localhost,127.0.0.1,::1');
  console.error('    npm run publish:cws');
  console.error('\n最小必需信息：代理协议(http/https) + 地址 + 端口。');
  console.error('提示：可使用 CWS_PROXY 覆盖默认优先级（CWS_PROXY > HTTPS_PROXY > HTTP_PROXY > ALL_PROXY）。');
  console.error('提示：你也可以先执行 `npm run publish:cws -- --dry-run` 验证前置门禁与诊断块（无网络调用）。');
}

// 改进的错误显示函数
function displayError(error: unknown, context: string = '') {
  logError(`${context}发生错误：`);
  
  if (error instanceof Error) {
    console.error(`错误类型: ${error.constructor.name}`);
    console.error(`错误消息: ${error.message}`);
    const causeMessage = extractErrorCauseMessage(error);
    if (causeMessage) console.error(`底层原因: ${causeMessage}`);
    if (error.stack) {
      console.error(`错误堆栈:\n${error.stack}`);
    }
    
    // 显示错误的其他属性
    const errorProps = Object.getOwnPropertyNames(error).filter(
      (prop) => !['name', 'message', 'stack'].includes(prop)
    );
    if (errorProps.length > 0) {
      console.error('错误详细信息:');
      errorProps.forEach((prop) => {
        const lower = prop.toLowerCase();
        if (lower.includes('token') || lower.includes('secret') || lower.includes('authorization')) {
          console.error(`  ${prop}: [REDACTED]`);
          return;
        }
        try {
          const value = (error as unknown as Record<string, unknown>)[prop];
          console.error(`  ${prop}: ${JSON.stringify(value, null, 2)}`);
        } catch (e) {
          console.error(`  ${prop}: [无法序列化]`);
        }
      });
    }
    
    // 特殊处理网络错误
    const errorCode = extractErrorCode(error);
    const isNetworkError =
      error.message.includes('fetch failed') ||
      error.message.toLowerCase().includes('enotfound') ||
      error.message.toLowerCase().includes('timeout') ||
      ['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(String(errorCode));

    if (isNetworkError) printActionableNetworkHints(error);
  } else {
    console.error('错误对象类型:', typeof error);
    try {
      console.error('错误内容:', JSON.stringify(error, null, 2));
    } catch (e) {
      console.error('错误内容: [无法序列化的对象]');
      console.error('错误对象:', error);
    }
  }
}

async function ensureZipExists(version: string): Promise<string> {
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const zipFileName = `plugin-${version}.zip`;
  const zipFilePath = path.resolve(rootDir, zipFileName);

  if (!existsSync(distDir)) {
    throw new Error('dist 目录不存在，请先确保已通过 `bash scripts/test.sh` 生成生产构建产物。');
  }

  // V1-33：必须基于当前 dist/ 重新生成 zip（若存在则先删除）
  if (existsSync(zipFilePath)) {
    logInfo(`发现同名 zip，将删除后重新生成: ${zipFilePath}`);
    await fs.unlink(zipFilePath);
  }

  try {
    execSync(`zip -r ../${zipFileName} .`, { cwd: distDir, stdio: 'inherit' });
  } catch (err) {
    displayError(err, '打包');
    throw err;
  }
  if (!existsSync(zipFilePath)) {
    throw new Error('zip 文件生成失败。');
  }
  logInfo(`成功创建 zip 文件: ${zipFilePath}`);
  return zipFilePath;
}

function hasFlag(flag: string): boolean {
  return process.argv.slice(2).includes(flag);
}

function getFlagValue(flag: string): string | null | '' {
  const args = process.argv.slice(2);

  const directIndex = args.indexOf(flag);
  if (directIndex >= 0) {
    const value = args[directIndex + 1];
    if (!value || value.startsWith('--')) return '';
    return value;
  }

  const prefix = `${flag}=`;
  const hit = args.find((a) => a.startsWith(prefix));
  if (!hit) return null;
  return hit.slice(prefix.length);
}

const REQUIRED_ENV_VARS = [
  'CWS_EXTENSION_ID',
  'CWS_CLIENT_ID',
  'CWS_CLIENT_SECRET',
  'CWS_REFRESH_TOKEN'
] as const;

function getMissingEnvVars(env: NodeJS.ProcessEnv = process.env): string[] {
  return REQUIRED_ENV_VARS.filter((key) => !env[key]);
}

async function readManifestVersion(manifestPath: string): Promise<string> {
  const raw = await fs.readFile(manifestPath, 'utf-8');
  const parsed = JSON.parse(raw) as { version?: unknown };
  const version = parsed?.version;
  if (!version || typeof version !== 'string') {
    throw new Error(`无法在 ${manifestPath} 中找到有效的 version 字符串。`);
  }
  return version;
}

async function runPreflight(): Promise<{ version: string; zipFilePath: string }> {
  // 1) 强制生产回归（唯一门禁）
  logInfo('发布前置门禁：开始执行全量回归 bash scripts/test.sh');
  execSync('bash scripts/test.sh', { stdio: 'inherit' });
  logSuccess('发布前置门禁：全量回归通过');

  // 2) 读取 root manifest 版本 + 校验 dist manifest 版本一致
  const rootManifestPath = path.resolve(process.cwd(), 'manifest.json');
  const distManifestPath = path.resolve(process.cwd(), 'dist', 'manifest.json');

  const rootVersion = await readManifestVersion(rootManifestPath);
  const distVersion = await readManifestVersion(distManifestPath);

  if (distVersion !== rootVersion) {
    throw new Error(
      `产物一致性校验失败：dist/manifest.json 的 version=${String(distVersion)}，期望=${rootVersion}。`
    );
  }
  logSuccess(`产物一致性校验通过：dist/manifest.json version === ${rootVersion}`);

  // 3) 基于当前 dist/ 重新生成 zip（若存在则先删除）
  const zipFilePath = await ensureZipExists(rootVersion);
  return { version: rootVersion, zipFilePath };
}

async function main() {
  const dryRun = hasFlag('--dry-run');
  const evidenceDirRaw = getFlagValue('--evidence-dir');
  if (evidenceDirRaw === '') {
    logError('参数错误：--evidence-dir 需要提供一个目录路径（例如：--evidence-dir docs/evidence/v1-62/preflight/）');
    process.exit(1);
  }
  const evidenceDir = evidenceDirRaw === null ? null : evidenceDirRaw;

  const exportedAtDate = new Date();
  const exportedAt = exportedAtDate.toISOString();

  const credentials: CwsPublishEvidenceCredentials = {
    extensionId: Boolean(process.env.CWS_EXTENSION_ID),
    clientId: Boolean(process.env.CWS_CLIENT_ID),
    clientSecret: Boolean(process.env.CWS_CLIENT_SECRET),
    refreshToken: Boolean(process.env.CWS_REFRESH_TOKEN)
  };

  logInfo(`开始 Chrome Web Store 发布流程…${dryRun ? '（dry-run）' : ''}`);

  // --- Preflight：任何网络调用前必须完成的门禁 ---
  let exitCode = 0;
  let version = 'unknown';
  let zipFilePath = '';
  let zipEvidence: Awaited<ReturnType<typeof buildCwsPublishEvidenceZip>> | null = null;
  let preflightFixHints: string[] = [];
  let preflightReport: Awaited<ReturnType<typeof runCwsPreflight>> | null = null;
  let publishAttempt: CwsPublishEvidencePublishAttempt = {
    uploaded: false,
    published: false,
    channel: 'default',
    errorCode: dryRun ? 'skipped' : 'not_attempted',
    errorMessage: dryRun ? 'dry-run: upload/publish skipped' : 'not attempted'
  };
  try {
    try {
      const preflight = await runPreflight();
      version = preflight.version;
      zipFilePath = preflight.zipFilePath;
      if (evidenceDir) {
        zipEvidence = await buildCwsPublishEvidenceZip(zipFilePath);
      }
      logInfo(`当前版本: ${version}`);
      logInfo(`已生成发布 zip: ${zipFilePath}`);
    } catch (err) {
      displayError(err, '发布前置门禁');
      exitCode = 1;
    }

    // --- 网络可达性预检（使用同一套代理配置；dry-run 也会执行，用于取证） ---
    if (exitCode === 0) {
      logInfo('网络可达性预检（Preflight）：开始');
      preflightReport = await runCwsPreflight(getDefaultCwsPreflightTargets(), { timeoutMs: 8_000 });
      for (const check of preflightReport.checks) {
        if (check.ok) {
          logSuccess(
            `Preflight PASS: ${check.hostname} (${check.method} ${check.status ?? 'n/a'}) ${check.elapsedMs}ms`
          );
          continue;
        }
        const reason =
          check.failureType === 'http_status'
            ? `HTTP ${check.status ?? 'n/a'}`
            : `${check.failureType ?? 'unknown'} ${check.errorCode ?? ''}`.trim();
        logWarn(`Preflight FAIL: ${check.hostname} (${check.method}) ${reason} ${check.elapsedMs}ms`);
      }

      console.log(formatCwsPreflightReportBlock(preflightReport));
      console.log(
        formatCwsPublishDiagnosticPackBlock({
          packVersion: 'v1-47',
          proxy: cwsProxyDiagnostic,
          preflight: preflightReport
        })
      );

      preflightFixHints = buildCwsPreflightFixHints(preflightReport, {
        enabled: cwsProxyResolved.proxyEnabled,
        envKey: cwsProxyResolved.proxyEnvKey,
        urlMasked: cwsProxyResolved.proxyUrlMasked,
        protocol: cwsProxyResolved.proxyUrl?.protocol ?? null
      });

      if (preflightReport.summary.fail > 0) {
        if (preflightFixHints.length > 0) {
          console.error('\n[CWS] Preflight 失败修复建议（最短可执行）：');
          for (const line of preflightFixHints) console.error(`- ${line}`);
        }

        if (!dryRun) {
          logError('网络可达性预检失败：已阻断真实发布（不会进行任何 upload/publish 网络调用）。');
          exitCode = 1;
          publishAttempt = {
            uploaded: false,
            published: false,
            channel: 'default',
            errorCode: 'preflight_failed',
            errorMessage: 'preflight failed: publish blocked'
          };
        } else {
          logWarn(
            'dry-run：网络可达性预检失败（已输出证据与修复建议）；后续仍会按 dry-run 约定不进行 upload/publish。'
          );
        }
      } else {
        logSuccess('网络可达性预检通过：关键外网依赖可达');
      }
    }

    // --- 环境变量检查：dry-run 仅提示；非 dry-run 缺失则阻断（且不会发生任何网络调用） ---
    if (exitCode === 0) {
      logInfo('环境变量检查:');
      for (const key of REQUIRED_ENV_VARS) {
        console.log(`  ${key}: ${process.env[key] ? '已设置' : '未设置'}`);
      }
      const missingEnvVars = getMissingEnvVars();
      if (missingEnvVars.length > 0) {
        const missingList = missingEnvVars.join(', ');
        if (dryRun) {
          logWarn(`dry-run 检测到缺失的 CWS 凭据项（真实发布前需要补齐）：${missingList}`);
          logSuccess('dry-run 完成：未进行任何上传/发布网络调用。');
          publishAttempt = {
            uploaded: false,
            published: false,
            channel: 'default',
            errorCode: 'skipped',
            errorMessage: `dry-run: missing credentials (${missingList})`
          };
          return;
        }

        logError(`缺少必需的环境变量：${missingList}`);
        logError('已阻断发布（不会进行任何上传/发布网络调用）。请检查 .env 文件或环境变量配置。');
        exitCode = 1;
        publishAttempt = {
          uploaded: false,
          published: false,
          channel: 'default',
          errorCode: 'missing_credentials',
          errorMessage: `missing env vars: ${missingList}`
        };
      }

      if (dryRun) {
        logSuccess('dry-run 完成：凭据已齐全，但按约定不会进行任何上传/发布网络调用。');
        publishAttempt = {
          uploaded: false,
          published: false,
          channel: 'default',
          errorCode: 'skipped',
          errorMessage: 'dry-run: upload/publish skipped'
        };
        return;
      }
    }

    // --- 非 dry-run：保持现有上传并发布行为 ---
    if (exitCode !== 0) {
      // Non-dry-run: preflight/env gates failed -> must exit 1 (but allow evidence pack to land).
      if (!dryRun) return;
    }

    const {
      CWS_EXTENSION_ID: extensionId,
      CWS_CLIENT_ID: clientId,
      CWS_CLIENT_SECRET: clientSecret,
      CWS_REFRESH_TOKEN: refreshToken
    } = process.env as Record<string, string | undefined>;

    if (!extensionId || !clientId || !clientSecret || !refreshToken) {
      // 理论上不会触发：已在 missingEnvVars 检查阻断
      logError('内部错误：环境变量检查与读取不一致。');
      exitCode = 1;
      return;
    }

    // 初始化 webstore client
    logInfo('初始化 Chrome Web Store 客户端…');
    const { default: webstoreUpload } = await import('chrome-webstore-upload');
    const webstore = webstoreUpload({
      extensionId,
      clientId,
      clientSecret,
      refreshToken
    });

    // 上传并发布
    try {
      logInfo('上传 zip 到 Chrome Web Store…');
      logInfo(`正在上传文件: ${zipFilePath}`);
      const zipStream = createReadStream(zipFilePath);
      await webstore.uploadExisting(zipStream);
      logSuccess('上传成功');
      publishAttempt = { ...publishAttempt, uploaded: true };

      logInfo('立即发布 (publish) 到公开通道…');
      await webstore.publish('default');
      logSuccess('发布成功 🎉');
      publishAttempt = { ...publishAttempt, published: true, errorCode: null, errorMessage: null };
    } catch (err) {
      displayError(err, '上传或发布');
      const errorCode = err instanceof Error ? extractErrorCode(err) : null;
      const errorMessage = err instanceof Error ? extractErrorCauseMessage(err) ?? err.message : null;
      publishAttempt = {
        uploaded: publishAttempt.uploaded,
        published: false,
        channel: 'default',
        errorCode,
        errorMessage
      };
      exitCode = 1;
    }
  } finally {
    // --- evidence pack + exit code ---
    // Note: keep default behavior when --evidence-dir is not provided (no extra writes).
    if (evidenceDir) {
      if (!zipEvidence) {
        logError('证据包落盘失败：zip 证据缺失（请先确保前置门禁通过且 zip 生成成功）。');
        exitCode = 1;
      } else if (!preflightReport) {
        logError('证据包落盘失败：preflightReport 缺失（请先确保预检阶段已执行并产出报告）。');
        exitCode = 1;
      } else {
        try {
          const fileName = formatCwsPublishEvidencePackFilename({
            extensionVersion: version,
            exportedAt: exportedAtDate,
            dryRun
          });

          const pack = buildCwsPublishEvidencePack({
            exportedAt,
            dryRun,
            extensionVersion: version,
            zip: zipEvidence,
            proxyDiagnostic: cwsProxyDiagnostic,
            preflightReport,
            preflightFixHints,
            credentials,
            publishAttempt
          });

          const written = await writeCwsPublishEvidencePackJsonFile({ evidenceDir, fileName, pack });
          logSuccess(`诊断证据包已落盘：${written.filePath}`);
        } catch (err) {
          displayError(err, '证据包落盘');
          exitCode = 1;
        }
      }
    }

    if (exitCode !== 0) process.exit(exitCode);
  }
}

// 改进的主函数错误处理
main().catch((err) => {
  displayError(err, '主程序');
  process.exit(1);
});
