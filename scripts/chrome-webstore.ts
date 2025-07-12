#!/usr/bin/env node
/*
  chrome-webstore.ts
  ------------------
  独立脚本：读取 .env 中的凭据，将 dist 打包的 zip 上传并立即发布到 Chrome Web Store。
  可单独执行，也可被 publish.ts 调用。
*/

import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
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

// 改进的错误显示函数
function displayError(error: any, context: string = '') {
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
          const value = (error as any)[prop];
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

  if (existsSync(zipFilePath)) {
    logInfo(`找到现有的 zip 文件: ${zipFilePath}`);
    return zipFilePath;
  }

  // 若 zip 不存在，则尝试构建并打包
  logInfo('未找到现成 zip，开始构建并打包…');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    displayError(err, '构建');
    throw err;
  }

  if (!existsSync(distDir)) {
    throw new Error('dist 目录不存在，构建可能失败。');
  }

  try {
    execSync(`cd ${distDir} && zip -r ../${zipFileName} . && cd ..`, { stdio: 'inherit' });
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

async function main() {
  logInfo('开始 Chrome Web Store 发布流程…');

  const {
    CWS_EXTENSION_ID: extensionId,
    CWS_CLIENT_ID: clientId,
    CWS_CLIENT_SECRET: clientSecret,
    CWS_REFRESH_TOKEN: refreshToken
  } = process.env as Record<string, string | undefined>;

  // 调试信息
  logInfo('环境变量检查:');
  console.log(`  CWS_EXTENSION_ID: ${extensionId ? '已设置' : '未设置'}`);
  console.log(`  CWS_CLIENT_ID: ${clientId ? '已设置' : '未设置'}`);
  console.log(`  CWS_CLIENT_SECRET: ${clientSecret ? '已设置' : '未设置'}`);
  console.log(`  CWS_REFRESH_TOKEN: ${refreshToken ? '已设置' : '未设置'}`);

  if (!extensionId || !clientId || !clientSecret || !refreshToken) {
    logError(
      '缺少必需的环境变量 (CWS_EXTENSION_ID, CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN)。'
    );
    logError('请检查 .env 文件是否正确配置。');
    process.exit(1);
  }

  // 读取 manifest 版本
  const manifestPath = path.resolve(process.cwd(), 'manifest.json');
  let version = 'unknown';
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    version = JSON.parse(raw).version ?? 'unknown';
    logInfo(`当前版本: ${version}`);
  } catch (err) {
    displayError(err, '读取 manifest.json');
    process.exit(1);
  }

  // 确保 zip 文件存在
  let zipFilePath: string;
  try {
    zipFilePath = await ensureZipExists(version);
  } catch (err) {
    displayError(err, '准备 zip 文件');
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
