#!/usr/bin/env node
/**
 * 一键推送 Git 脚本
 *
 * 自动添加、提交并推送更改到远程仓库，方便持续测试 GitHub Actions。
 *
 * 用法:
 *   npm run push [提交信息]
 *   或
 *   ts-node scripts/push-git.ts [提交信息]
 */

import { execSync } from 'child_process';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '..');

/**
 * 执行命令并返回输出
 */
function exec(command: string, options: { cwd?: string; silent?: boolean } = {}): string {
  try {
    const result = execSync(command, {
      cwd: options.cwd || projectRoot,
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
    });
    // 当 stdio 为 'inherit' 时，result 可能为 null
    if (result === null || result === undefined) {
      return '';
    }
    return result.toString().trim();
  } catch (error: any) {
    if (!options.silent) {
      console.error(`命令执行失败: ${command}`);
      console.error(error.message);
    }
    throw error;
  }
}

/**
 * 检查是否有未提交的更改
 */
function hasChanges(): boolean {
  try {
    const status = exec('git status --porcelain', { silent: true });
    return status.length > 0;
  } catch {
    return false;
  }
}

/**
 * 获取当前分支名
 */
function getCurrentBranch(): string {
  try {
    return exec('git rev-parse --abbrev-ref HEAD', { silent: true });
  } catch {
    throw new Error('无法获取当前分支名');
  }
}

/**
 * 检查是否有远程仓库
 */
function hasRemote(): boolean {
  try {
    const remotes = exec('git remote', { silent: true });
    return remotes.length > 0;
  } catch {
    return false;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始一键推送 Git...\n');

  // 1. 检查是否有更改
  if (!hasChanges()) {
    console.log('ℹ️  没有未提交的更改，无需推送');
    return;
  }

  // 2. 显示当前状态
  console.log('📋 当前 Git 状态:');
  exec('git status -s');
  console.log('');

  // 3. 获取提交信息
  const args = process.argv.slice(2);
  const commitMessage = args[0] || `chore: update for testing GitHub Actions [${new Date().toLocaleString('zh-CN')}]`;

  // 4. 添加所有更改
  console.log('📦 添加所有更改...');
  exec('git add -A');
  console.log('✅ 更改已添加\n');

  // 5. 提交
  console.log(`💾 提交更改: ${commitMessage}`);
  exec(`git commit -m "${commitMessage}"`);
  console.log('✅ 更改已提交\n');

  // 6. 检查是否有远程仓库
  if (!hasRemote()) {
    console.log('⚠️  警告: 未配置远程仓库，跳过推送');
    return;
  }

  // 7. 获取当前分支
  const branch = getCurrentBranch();
  console.log(`📤 推送到远程仓库 (分支: ${branch})...`);

  try {
    exec(`git push origin ${branch}`);
    console.log('✅ 推送成功！\n');
    console.log('🎉 所有操作完成！');
  } catch (error) {
    console.error('\n❌ 推送失败！');
    console.error('提示: 如果是因为远程分支不存在，可以运行:');
    console.error(`   git push -u origin ${branch}`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  try {
    main();
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

