#!/usr/bin/env node
/*
  chrome-webstore.ts
  ------------------
  独立脚本：读取 .env 中的凭据，将 dist 打包的 zip 上传并立即发布到 Chrome Web Store。
  可单独执行，也可被 publish.ts 调用。
*/

import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import webstoreUpload from 'chrome-webstore-upload';

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
function logError(msg: string) {
  console.error(`${colors.red}[CWS] ${msg}${colors.reset}`);
}

async function ensureZipExists(version: string): Promise<string> {
  const rootDir = process.cwd();
  const distDir = path.resolve(rootDir, 'dist');
  const zipFileName = `plugin-${version}.zip`;
  const zipFilePath = path.resolve(rootDir, zipFileName);

  if (existsSync(zipFilePath)) {
    return zipFilePath;
  }

  // 若 zip 不存在，则尝试构建并打包
  logInfo('未找到现成 zip，开始构建并打包…');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    logError('构建失败，无法继续。');
    throw err;
  }

  if (!existsSync(distDir)) {
    throw new Error('dist 目录不存在，构建可能失败。');
  }

  try {
    execSync(`cd ${distDir} && zip -r ../${zipFileName} . && cd ..`, { stdio: 'inherit' });
  } catch (err) {
    logError('打包 dist 目录失败。');
    throw err;
  }
  if (!existsSync(zipFilePath)) {
    throw new Error('zip 文件生成失败。');
  }
  return zipFilePath;
}

async function main() {
  logInfo('开始 Chrome Web Store 发布流程…');

  const {
    CWS_EXTENSION_ID: extensionId,
    CWS_CLIENT_ID: clientId,
    CWS_CLIENT_SECRET: clientSecret,
    CWS_REFRESH_TOKEN: refreshToken
  } = process.env as Record<string, string | undefined>;

  if (!extensionId || !clientId || !clientSecret || !refreshToken) {
    logError(
      '缺少必需的环境变量 (CWS_EXTENSION_ID, CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN)。'
    );
    process.exit(1);
  }

  // 读取 manifest 版本
  const manifestPath = path.resolve(process.cwd(), 'manifest.json');
  let version = 'unknown';
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    version = JSON.parse(raw).version ?? 'unknown';
  } catch {
    logError('读取 manifest.json 失败，无法确定版本号。');
    process.exit(1);
  }

  // 确保 zip 文件存在
  const zipFilePath = await ensureZipExists(version);

  // 初始化 webstore client
  const webstore = webstoreUpload({
    extensionId,
    clientId,
    clientSecret,
    refreshToken
  });

  // 上传并发布
  try {
    logInfo('上传 zip 到 Chrome Web Store…');
    await webstore.uploadExisting(zipFilePath);
    logSuccess('上传成功');

    logInfo('立即发布 (publish) 到公开通道…');
    await webstore.publish('default');
    logSuccess('发布成功 🎉');
  } catch (err) {
    logError('上传或发布过程出错：');
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  logError('未捕获的异常：');
  console.error(err);
  process.exit(1);
});
