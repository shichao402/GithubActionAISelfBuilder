#!/usr/bin/env node
/**
 * AI 自我调试 GitHub Actions Workflow 脚本
 *
 * 功能：
 * 1. 触发指定的 GitHub Action 工作流
 * 2. 实时监控工作流执行状态
 * 3. 如果失败，自动收集日志
 * 4. 分析日志并提供修正建议
 *
 * 用法:
 *   ts-node scripts/test/ai-debug-workflow.ts <workflow-file> [ref]
 *   或
 *   npm run ai-debug -- <workflow-file> [ref]
 * 
 * 注意：此脚本仅用于测试本项目，不作为子项目提供
 */

import { WorkflowManager } from '../src/workflow-manager';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '..');

/**
 * 分析日志文件，提取错误信息
 */
function analyzeLogFile(logFile: string): {
  errors: string[];
  warnings: string[];
  suggestions: string[];
} {
  const logContent = fs.readFileSync(logFile, 'utf8');
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // 提取错误信息
  const errorPatterns = [
    /Error: (.+)/gi,
    /error: (.+)/gi,
    /ERROR (.+)/gi,
    /Failed to (.+)/gi,
    /失败: (.+)/gi,
    /失败 (.+)/gi,
  ];

  for (const pattern of errorPatterns) {
    const matches = logContent.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !errors.includes(match[1])) {
        errors.push(match[1]);
      }
    }
  }

  // 提取警告信息
  const warningPatterns = [
    /Warning: (.+)/gi,
    /warning: (.+)/gi,
    /WARNING (.+)/gi,
  ];

  for (const pattern of warningPatterns) {
    const matches = logContent.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && !warnings.includes(match[1])) {
        warnings.push(match[1]);
      }
    }
  }

  // 生成修正建议
  if (errors.length > 0) {
    // 检查常见错误模式并提供建议
    const errorText = errors.join(' ').toLowerCase();

    if (errorText.includes('not found') || errorText.includes('不存在')) {
      suggestions.push('检查文件路径是否正确，确保文件存在');
    }

    if (errorText.includes('permission') || errorText.includes('权限')) {
      suggestions.push('检查文件权限，确保有执行权限');
    }

    if (errorText.includes('syntax') || errorText.includes('语法')) {
      suggestions.push('检查 YAML 或代码语法错误');
    }

    if (errorText.includes('dependency') || errorText.includes('依赖')) {
      suggestions.push('检查依赖是否正确安装，运行 npm install 或类似命令');
    }

    if (errorText.includes('timeout') || errorText.includes('超时')) {
      suggestions.push('考虑增加超时时间或优化执行步骤');
    }
  }

  return { errors, warnings, suggestions };
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ 错误: 请指定工作流文件');
    console.error('');
    console.error('用法:');
    console.error('  ts-node scripts/test/ai-debug-workflow.ts <workflow-file> [ref]');
    console.error('  或');
    console.error('  npm run ai-debug -- <workflow-file> [ref]');
    console.error('');
    console.error('示例:');
    console.error('  npm run ai-debug -- .github/workflows/flutter-build.yml');
    console.error('  npm run ai-debug -- .github/workflows/flutter-build.yml main');
    process.exit(1);
  }

  const workflowFile = args[0];
  const ref = args[1] || 'main';

  console.log('🤖 AI 自我调试 GitHub Actions Workflow');
  console.log('==========================================\n');
  console.log(`📋 工作流文件: ${workflowFile}`);
  console.log(`🌿 分支/引用: ${ref}\n`);

  // 检查工作流文件是否存在
  const workflowPath = path.join(projectRoot, workflowFile);
  if (!fs.existsSync(workflowPath)) {
    console.error(`❌ 错误: 工作流文件不存在: ${workflowFile}`);
    process.exit(1);
  }

  const manager = new WorkflowManager(projectRoot);

  // 检查 GitHub CLI
  console.log('🔍 检查 GitHub CLI...');
  if (!(await manager.checkGhCli())) {
    console.error('❌ 错误: 未找到 GitHub CLI (gh)');
    console.error('请安装 GitHub CLI: https://cli.github.com/');
    process.exit(1);
  }

  if (!(await manager.checkGhAuth())) {
    console.error('❌ 错误: GitHub CLI 未登录');
    console.error('请运行: gh auth login');
    process.exit(1);
  }
  console.log('✅ GitHub CLI 已就绪\n');

  // 触发并监控工作流
  console.log('🚀 开始触发并监控工作流...\n');
  const result = await manager.runWorkflow(workflowFile, {
    ref,
    pollInterval: 5,
  });

  if (result.success) {
    console.log('\n✅ 工作流执行成功！');
    process.exit(0);
  }

  // 工作流失败，收集日志并分析
  console.log('\n❌ 工作流执行失败');
  console.log('==========================================\n');

  // 获取 run ID（从文件读取或从监控结果获取）
  const runIdFile = path.join(projectRoot, '.github_run_id.txt');
  let runId: number | undefined;

  if (fs.existsSync(runIdFile)) {
    const runIdContent = fs.readFileSync(runIdFile, 'utf8').trim();
    runId = parseInt(runIdContent, 10);
  }

  if (!runId || isNaN(runId)) {
    console.error('⚠️  警告: 无法获取 run ID，跳过日志收集');
    process.exit(1);
  }

  console.log(`📥 收集工作流日志 (Run ID: ${runId})...`);
  const logFile = await manager.collectWorkflowLogs(runId);

  if (!logFile) {
    console.error('❌ 错误: 无法收集工作流日志');
    process.exit(1);
  }

  console.log(`✅ 日志已保存到: ${logFile}\n`);

  // 分析日志
  console.log('🔍 分析错误日志...\n');
  const analysis = analyzeLogFile(logFile);

  // 显示分析结果
  console.log('📊 错误分析结果');
  console.log('==========================================\n');

  if (analysis.errors.length > 0) {
    console.log('❌ 发现的错误:');
    analysis.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
    console.log('');
  }

  if (analysis.warnings.length > 0) {
    console.log('⚠️  警告信息:');
    analysis.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
    console.log('');
  }

  if (analysis.suggestions.length > 0) {
    console.log('💡 修正建议:');
    analysis.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });
    console.log('');
  }

  // 显示日志文件位置
  console.log('📄 完整日志文件:');
  console.log(`   ${logFile}\n`);

  console.log('💬 下一步操作:');
  console.log('   1. 查看完整日志文件了解详细错误信息');
  console.log('   2. 根据修正建议修改工作流或代码');
  console.log('   3. 重新触发工作流进行验证');
  console.log('   4. 重复此流程直到工作流成功执行\n');

  process.exit(1);
}

// 运行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ 发生错误:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

