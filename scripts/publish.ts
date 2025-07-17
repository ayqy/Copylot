#!/usr/bin/env node
// ^-- 这个 "shebang" 允许脚本作为可执行文件直接运行

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { execSync } from 'child_process'; // 用于执行 git 命令等
import readline from 'readline'; // 用于用户交互

// ANSI Color Codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Colored log functions
const log = {
  default: (msg: string) => console.log(msg), // Default or green for general success
  info: (msg: string) => console.info(`${colors.blue}[INFO] ${msg}${colors.reset}`),
  warn: (msg: string) => console.warn(`${colors.yellow}[WARN] ${msg}${colors.reset}`),
  error: (msg: string) => console.error(`${colors.red}[ERROR] ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}[SUCCESS] ${msg}${colors.reset}`)
};

// Helper function to ask user a question
function askQuestion(query: string): Promise<string> {
  // Ensure question also uses default color, but input is not colored.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function getRepoUrlPath(): Promise<string> {
  let repoPath = '';
  // 1. Try package.json
  try {
    const pkgJsonPath = path.resolve(process.cwd(), 'package.json');
    const pkgRaw = await fs.readFile(pkgJsonPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw);
    if (pkg.repository && pkg.repository.url) {
      const repoUrl = pkg.repository.url;
      // Regex to capture 'user/repo' from various GitHub URL formats
      const match = repoUrl.match(/github\.com[/:]([^/]+\/[^/]+?)(\.git)?$/);
      if (match && match[1]) {
        repoPath = match[1];
      }
    }
  } catch (e) {
    log.warn('读取 package.json 或解析 repository.url 失败。');
  }

  // 2. Try git remote if package.json didn't yield a result
  if (!repoPath) {
    try {
      const remoteUrl = execSync('git remote get-url origin').toString().trim();
      const matchHttps = remoteUrl.match(/github\.com\/([^/]+\/[^/]+?)(\.git)?$/);
      const matchSsh = remoteUrl.match(/git@github\.com:([^/]+\/[^/]+?)(\.git)?$/);
      if (matchHttps && matchHttps[1]) {
        repoPath = matchHttps[1];
      } else if (matchSsh && matchSsh[1]) {
        repoPath = matchSsh[1];
      } else {
        log.warn(`无法从 git remote URL (${remoteUrl}) 解析仓库路径。`);
      }
    } catch (gitError) {
      log.warn("执行 'git remote get-url origin' 失败。");
    }
  }

  if (!repoPath) {
    log.error('无法自动获取 GitHub 仓库路径。请在提示 URL 时手动确认。');
    return 'your_username/your_repo'; // Fallback
  }
  return repoPath;
}

async function main() {
  log.info('开始发布流程...');

  // --- 步骤 4: 获取当前版本号 ---
  const manifestPath = path.resolve(process.cwd(), 'manifest.json');
  let manifestContent;
  let currentVersion;

  try {
    const rawManifest = await fs.readFile(manifestPath, 'utf-8');
    manifestContent = JSON.parse(rawManifest);
    currentVersion = manifestContent.version;
    if (!currentVersion || typeof currentVersion !== 'string') {
      log.error("无法在 manifest.json 中找到有效的 'version' 字符串。");
      process.exit(1);
    }
    log.info(`当前版本号: ${currentVersion}`);
  } catch (error) {
    log.error(`读取或解析 manifest.json 出错 (${manifestPath})。`);
    console.error(error); // Log the actual error object
    process.exit(1);
  }

  // --- 步骤 5: 生成新版本号 ---
  const versionParts = currentVersion.split('.');
  const lastPart = parseInt(versionParts[versionParts.length - 1], 10);
  if (isNaN(lastPart)) {
    log.error(`版本号 ${currentVersion} 的最后一部分不是一个有效的数字。`);
    process.exit(1);
  }
  versionParts[versionParts.length - 1] = (lastPart + 1).toString();
  const newVersion = versionParts.join('.');
  log.info(`建议新版本号: ${newVersion}`);

  // --- 步骤 6: 用户确认新版本号 ---
  const confirmation = await askQuestion(
    `${colors.yellow}您确定要将版本号从 ${currentVersion} 更新到 ${newVersion} 吗? (y/N): ${colors.reset}`
  );
  if (confirmation.toLowerCase() !== 'y' && confirmation.toLowerCase() !== 'yes') {
    log.warn('操作已取消。');
    process.exit(0);
  }

  // --- 步骤 7: 更新 Manifest 文件 ---
  manifestContent.version = newVersion;
  try {
    await fs.writeFile(manifestPath, `${JSON.stringify(manifestContent, null, 2)}\n`, 'utf-8');
    log.success(`manifest.json 已更新至版本 ${newVersion}`);
  } catch (error) {
    log.error(`写入 manifest.json 出错 (${manifestPath})。`);
    console.error(error);
    process.exit(1);
  }

  // --- 步骤 8: 创建 commit ---
  const commitMessage = `chore: bump version to ${newVersion}`;
  try {
    execSync(`git add ${manifestPath}`);
    execSync(`git commit -m "${commitMessage}"`);
    log.success(`已创建 commit: "${commitMessage}"`);
  } catch (error) {
    log.error('git commit 执行失败。');
    console.error(error);
    // TODO: 考虑在这里添加 git reset 或者其他恢复操作的提示
    process.exit(1);
  }

  // --- 步骤 9: 创建 git tag ---
  const tagName = `v${newVersion}`;
  try {
    execSync(`git tag ${tagName}`);
    log.success(`已创建 git tag: ${tagName}`);
  } catch (error) {
    log.error(`git tag ${tagName} 创建失败。可能已存在同名标签。`);
    console.error(error);
    // TODO: 考虑在这里添加删除旧标签或提示用户的操作
    process.exit(1);
  }

  // --- 步骤 10: 构建生产环境插件 ---
  log.info('开始构建生产环境插件...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log.success('生产环境插件构建完成。');
  } catch (error) {
    log.error('构建生产环境插件失败。');
    console.error(error);
    log.warn(
      `提醒：您可能需要手动执行 'git tag -d ${tagName}' 和 'git reset HEAD~1' 来撤销版本更新和标签。`
    );
    process.exit(1);
  }

  // --- 步骤 11: 用户确认测试是否通过 ---
  const testConfirmation = await askQuestion(
    `${colors.yellow}请确认您已完成插件测试并且测试通过。是否继续发布? (y/N): ${colors.reset}`
  );
  if (testConfirmation.toLowerCase() !== 'y' && testConfirmation.toLowerCase() !== 'yes') {
    log.warn('操作已取消。提醒：生产插件已构建，但未发布。');
    log.warn(
      `提醒：您可能需要手动执行 'git tag -d ${tagName}' 和 'git reset HEAD~1' 来撤销版本更新和标签。`
    );
    process.exit(0);
  }

  // --- 步骤 12: 发布到 GitHub Release ---
  const buildDir = path.resolve(process.cwd(), 'dist');
  const zipFileName = `plugin-${newVersion}.zip`;
  const zipFilePath = path.resolve(process.cwd(), zipFileName);

  log.info(`准备将 ${buildDir} 打包为 ${zipFileName}...`);
  try {
    if (fsSync.existsSync(zipFilePath)) {
      // fsSync.existsSync is sync, but ok here for a pre-check
      await fs.unlink(zipFilePath);
    }
    execSync(`cd ${buildDir} && zip -r ../${zipFileName} . && cd ..`, { cwd: process.cwd() });
    log.success(`构建产物已打包到: ${zipFilePath}`);
    log.info(`您可以使用此文件进行手动上传或测试：${colors.cyan}${zipFilePath}${colors.reset}`);
  } catch (error) {
    log.error(
      `打包构建产物 (${buildDir} to ${zipFilePath}) 失败。请确保 'zip' 命令已安装并可用，并且 dist 目录存在。`
    );
    console.error(error);
    log.warn(
      `提醒：您可能需要手动执行 'git tag -d ${tagName}' 和 'git reset HEAD~1' 来撤销版本更新和标签。`
    );
    process.exit(1);
  }

  let ghAvailable = false;
  try {
    execSync('gh --version', { stdio: 'ignore' });
    ghAvailable = true;
  } catch (e) {
    log.warn('GitHub CLI (gh) 命令未找到或无法执行。您可能需要手动创建 GitHub Release。');
  }

  if (ghAvailable) {
    // 推送标签到远程仓库（GitHub Release 需要远程标签）
    const pushTagConfirmation = await askQuestion(
      `${colors.yellow}需要先推送标签 ${tagName} 到远程仓库才能创建 GitHub Release。是否继续? (y/N): ${colors.reset}`
    );
    if (pushTagConfirmation.toLowerCase() !== 'y' && pushTagConfirmation.toLowerCase() !== 'yes') {
      log.warn('操作已取消。');
      process.exit(0);
    }

    try {
      log.info(`正在推送标签 ${tagName} 到远程仓库...`);
      execSync('git push --tags', { stdio: 'inherit' });
      log.success(`标签 ${tagName} 已成功推送到远程仓库。`);
    } catch (error) {
      log.error('推送标签到远程仓库失败。');
      console.error(error);
      log.warn(`提醒：您可能需要手动执行 'git tag -d ${tagName}' 和 'git reset HEAD~1' 来撤销版本更新和标签。`);
      process.exit(1);
    }

    log.info('尝试使用 GitHub CLI (gh) 创建 Release...');
    try {
      execSync(
        `gh release create ${tagName} "${zipFilePath}" --generate-notes --title "Release ${tagName}"`,
        { stdio: 'inherit' }
      );
      log.success(`GitHub Release ${tagName} 创建成功，并上传了 ${zipFileName}。`);
    } catch (error) {
      log.error('使用 gh CLI 创建 GitHub Release 失败。');
      console.error(error);

      const repoUrlPath = await getRepoUrlPath();

      log.info(`请手动访问 https://github.com/${repoUrlPath}/releases/new`);
      log.info(`创建一个新的 Release，标签为 ${tagName}，并将 ${zipFilePath} 文件上传。`);
      const trotzdemFortfahren = await askQuestion(
        `${colors.yellow}gh release 创建失败。是否仍要继续推送到 git? (y/N): ${colors.reset}`
      );
      if (trotzdemFortfahren.toLowerCase() !== 'y' && trotzdemFortfahren.toLowerCase() !== 'yes') {
        log.warn('操作已取消。');
        process.exit(0);
      }
    }
  } else {
    const repoUrlPath = await getRepoUrlPath();
    log.info(`请手动访问 https://github.com/${repoUrlPath}/releases/new`);
    log.info(`创建一个新的 Release，标签为 ${tagName}，并将 ${zipFilePath} 文件上传。`);
    const manualReleaseConfirmation = await askQuestion(
      `${colors.cyan}请在浏览器中完成上述手动 Release 创建和文件上传操作。完成后，请按 'y' 继续: ${colors.reset}`
    );
    if (
      manualReleaseConfirmation.toLowerCase() !== 'y' &&
      manualReleaseConfirmation.toLowerCase() !== 'yes'
    ) {
      log.warn('操作已取消。');
      process.exit(0);
    }
  }

  // --- 步骤 13: 用户确认是否 push ---
  const pushConfirmation = await askQuestion(
    `${colors.yellow}即将推送 commit 到远程仓库。是否继续? (y/N): ${colors.reset}`
  );
  if (pushConfirmation.toLowerCase() !== 'y' && pushConfirmation.toLowerCase() !== 'yes') {
    log.warn('操作已取消。Commit 已在本地创建但未推送。');
    log.info(`提示：您之后可以手动运行 'git push'。`);
    log.info(`如果您想完全回滚本地更改：git reset HEAD~1 --hard && git tag -d ${tagName}`);
    process.exit(0);
  }

  // --- 步骤 14: Git push commit ---
  try {
    log.info('正在推送 commit 到远程仓库...');
    execSync('git push', { stdio: 'inherit' });
    log.success('Commit 已成功推送到远程仓库。');

    // --- 步骤 15: 可选发布到 Chrome Web Store ---
    const cwsConfirm = await askQuestion(
      `${colors.yellow}是否现在上传并发布到 Chrome Web Store? (y/N): ${colors.reset}`
    );
    if (cwsConfirm.toLowerCase() === 'y' || cwsConfirm.toLowerCase() === 'yes') {
      try {
        execSync('npm run publish:cws', { stdio: 'inherit' });
        log.success('Chrome Web Store 发布流程完成。');
      } catch (cwsError) {
        log.error('Chrome Web Store 发布流程失败。');
        console.error(cwsError);
      }
    } else {
      log.info('已跳过 Chrome Web Store 发布。您可稍后手动运行 "npm run publish:cws"。');
    }
  } catch (error) {
    log.error('git push 执行失败。');
    console.error(error);
    log.info('请检查您的网络连接和远程仓库权限。');
    log.info(`提示：Commit 已在本地创建，但未成功推送到远程。`);
    log.info(`您可以稍后手动运行 'git push'。`);
    process.exit(1);
  }

  log.success('发布流程顺利完成！🎉');
}

main().catch((error) => {
  log.error('发布过程中发生未捕获的错误:');
  console.error(error); // Log the actual error object
  process.exit(1);
});
