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
  - 支持 `--dry-run`：不进行任何上传/发布网络调用；允许无 `.env` 凭据演练前置流程
*/

import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import { execSync } from 'child_process';
import webstoreUpload from 'chrome-webstore-upload';

// 配置undici代理支持
import { setGlobalDispatcher, ProxyAgent } from 'undici';

// 设置代理配置
function setupProxy() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  
  if (proxyUrl) {
    console.log(`[CWS] 检测到代理设置: ${proxyUrl}`);
    try {
      const proxyAgent = new ProxyAgent(proxyUrl);
      setGlobalDispatcher(proxyAgent);
      console.log(`[CWS] 代理已配置成功`);
    } catch (error) {
      console.error(`[CWS] 代理配置失败:`, error);
    }
  } else {
    console.log(`[CWS] 未检测到代理设置`);
  }
}

// 初始化代理设置
setupProxy();

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

// 改进的错误显示函数
function displayError(error: unknown, context: string = '') {
  logError(`${context}发生错误：`);
  
  if (error instanceof Error) {
    console.error(`错误类型: ${error.constructor.name}`);
    console.error(`错误消息: ${error.message}`);
    if (error.stack) {
      console.error(`错误堆栈:\n${error.stack}`);
    }
    
    // 显示错误的其他属性
    const errorProps = Object.getOwnPropertyNames(error).filter(prop => 
      !['name', 'message', 'stack'].includes(prop)
    );
    if (errorProps.length > 0) {
      console.error('错误详细信息:');
      errorProps.forEach(prop => {
        try {
          const value = (error as unknown as Record<string, unknown>)[prop];
          console.error(`  ${prop}: ${JSON.stringify(value, null, 2)}`);
        } catch (e) {
          console.error(`  ${prop}: [无法序列化]`);
        }
      });
    }
    
    // 特殊处理网络错误
    if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
      console.error('\n网络连接问题诊断:');
      console.error('- 检查网络连接是否正常');
      console.error('- 确认是否能够访问 Google 服务');
      console.error('- 如果在中国大陆，可能需要配置代理或 VPN');
      console.error('- 检查防火墙设置');
    }
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
  logInfo(`开始 Chrome Web Store 发布流程…${dryRun ? '（dry-run）' : ''}`);

  // --- Preflight：任何网络调用前必须完成的门禁 ---
  let version = 'unknown';
  let zipFilePath = '';
  try {
    const preflight = await runPreflight();
    version = preflight.version;
    zipFilePath = preflight.zipFilePath;
    logInfo(`当前版本: ${version}`);
    logInfo(`已生成发布 zip: ${zipFilePath}`);
  } catch (err) {
    displayError(err, '发布前置门禁');
    process.exit(1);
  }

  // --- 环境变量检查：dry-run 仅提示；非 dry-run 缺失则阻断（且不会发生任何网络调用） ---
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
      return;
    }

    logError(`缺少必需的环境变量：${missingList}`);
    logError('已阻断发布（不会进行任何上传/发布网络调用）。请检查 .env 文件或环境变量配置。');
    process.exit(1);
  }

  if (dryRun) {
    logSuccess('dry-run 完成：凭据已齐全，但按约定不会进行任何上传/发布网络调用。');
    return;
  }

  // --- 非 dry-run：保持现有上传并发布行为 ---
  const {
    CWS_EXTENSION_ID: extensionId,
    CWS_CLIENT_ID: clientId,
    CWS_CLIENT_SECRET: clientSecret,
    CWS_REFRESH_TOKEN: refreshToken
  } = process.env as Record<string, string | undefined>;

  if (!extensionId || !clientId || !clientSecret || !refreshToken) {
    // 理论上不会触发：已在 missingEnvVars 检查阻断
    logError('内部错误：环境变量检查与读取不一致。');
    process.exit(1);
  }

  // 初始化 webstore client
  logInfo('初始化 Chrome Web Store 客户端…');
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

    logInfo('立即发布 (publish) 到公开通道…');
    await webstore.publish('default');
    logSuccess('发布成功 🎉');
  } catch (err) {
    displayError(err, '上传或发布');
    process.exit(1);
  }
}

// 改进的主函数错误处理
main().catch((err) => {
  displayError(err, '主程序');
  process.exit(1);
});
