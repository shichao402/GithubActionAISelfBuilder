#!/usr/bin/env node
/**
 * Pipeline 验证和调试脚本
 * 
 * 功能：
 * 1. 删除旧的 workflow 文件
 * 2. 使用脚手架工具重新生成 workflow
 * 3. 验证生成的 workflow 文件
 * 4. 可选：触发 workflow 进行在线测试
 * 5. 监控 workflow 执行状态
 * 6. 分析失败原因
 * 
 * 用法:
 *   ts-node scripts/test-pipelines.ts [options]
 *   或
 *   npm run test:pipelines -- [options]
 * 
 * 选项:
 *   --pipeline <name>    指定要测试的 Pipeline 类名（可多次指定）
 *   --all                测试所有 Pipeline
 *   --trigger            触发 workflow 进行在线测试
 *   --watch              监控 workflow 执行状态
 *   --clean              删除旧的 workflow 文件
 *   --verify             仅验证生成的 workflow 文件，不触发测试
 * 
 * 示例:
 *   # 测试单个 Pipeline
 *   npm run test:pipelines -- --pipeline FlutterBuildPipeline --trigger
 * 
 *   # 测试所有 Pipeline
 *   npm run test:pipelines -- --all --trigger --watch
 * 
 *   # 仅验证生成的 workflow 文件
 *   npm run test:pipelines -- --all --verify
 * 
 * 注意：
 * - 此脚本可以共享给父项目使用
 * - 需要安装 GitHub CLI (gh) 才能触发和监控 workflow
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as yaml from 'js-yaml';

const execAsync = promisify(exec);

interface Options {
  pipelines?: string[];
  all?: boolean;
  trigger?: boolean;
  watch?: boolean;
  clean?: boolean;
  verify?: boolean;
}

/**
 * 解析命令行参数
 */
function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    pipelines: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--pipeline':
        if (i + 1 < args.length) {
          options.pipelines!.push(args[++i]);
        }
        break;
      case '--all':
        options.all = true;
        break;
      case '--trigger':
        options.trigger = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--clean':
        options.clean = true;
        break;
      case '--verify':
        options.verify = true;
        break;
    }
  }

  return options;
}

/**
 * 检测项目根目录
 */
function detectProjectRoot(): string {
  let current = process.cwd();
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'package.json'))) {
      return current;
    }
    current = path.dirname(current);
  }
  return process.cwd();
}

/**
 * 查找所有 Pipeline 文件
 */
function findPipelineFiles(projectRoot: string): string[] {
  const pipelinesDir = path.join(projectRoot, 'src', 'pipelines');
  if (!fs.existsSync(pipelinesDir)) {
    return [];
  }

  const files: string[] = [];
  const findFilesRecursive = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // 跳过 test 目录（除非配置了 include_test_pipelines）
        if (entry.name === 'test') {
          // 检查配置
          const configPath = path.join(projectRoot, 'config', 'ProjectOnly', 'config.yaml');
          if (fs.existsSync(configPath)) {
            try {
              const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
              if (config?.pipelines?.include_test_pipelines === true) {
                findFilesRecursive(fullPath);
              }
            } catch {
              // 忽略配置读取错误
            }
          }
          continue;
        }
        findFilesRecursive(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.startsWith('_')) {
        files.push(fullPath);
      }
    }
  };

  findFilesRecursive(pipelinesDir);
  return files;
}

/**
 * 从文件内容中提取 Pipeline 类名
 */
function extractClassName(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // 查找 export class XxxPipeline 模式
    const classMatch = content.match(/export\s+class\s+(\w+Pipeline)\s+extends/);
    if (classMatch && classMatch[1]) {
      return classMatch[1];
    }
    // 如果没有找到，返回 null
    return null;
  } catch {
    return null;
  }
}

/**
 * 删除旧的 workflow 文件
 */
async function cleanWorkflows(workflowsDir: string): Promise<void> {
  console.log('🧹 清理旧的 workflow 文件...');
  const files = fs.readdirSync(workflowsDir);
  for (const file of files) {
    if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      const filePath = path.join(workflowsDir, file);
      fs.unlinkSync(filePath);
      console.log(`   ✓ 删除: ${file}`);
    }
  }
}

/**
 * 生成 workflow 文件
 */
async function generateWorkflow(
  projectRoot: string,
  pipelineName: string,
  workflowsDir: string
): Promise<string | null> {
  console.log(`📝 生成 workflow: ${pipelineName}...`);
  try {
    // 生成 workflow 文件名（将 PascalCase 转换为 kebab-case）
    const workflowFileName = pipelineName
      .replace(/Pipeline$/, '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '') + '.yml';
    
    const outputPath = path.join(workflowsDir, workflowFileName);
    
    // 尝试使用 npm 脚本，如果失败则直接使用 ts-node
    let command = `npm run scaffold -- --pipeline ${pipelineName} --output ${outputPath}`;
    
    // 检查是否有 scaffold 脚本
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (!packageJson.scripts?.scaffold) {
        // 如果没有 scaffold 脚本，直接使用 ts-node
        const scaffoldPath = path.join(projectRoot, 'src', 'scaffold.ts');
        if (fs.existsSync(scaffoldPath)) {
          command = `ts-node ${scaffoldPath} --pipeline ${pipelineName} --output ${outputPath}`;
        } else {
          // 尝试从子模块路径查找
          const possiblePaths = [
            path.join(projectRoot, 'GithubActionAISelfBuilder', 'src', 'scaffold.ts'),
            path.join(projectRoot, 'Tools', 'GithubActionAISelfBuilder', 'src', 'scaffold.ts'),
          ];
          for (const scaffoldPath of possiblePaths) {
            if (fs.existsSync(scaffoldPath)) {
              command = `ts-node ${scaffoldPath} --pipeline ${pipelineName} --output ${outputPath}`;
              break;
            }
          }
        }
      }
    }
    
    const { stdout, stderr } = await execAsync(command, { cwd: projectRoot });

    // 检查输出中是否包含成功信息
    const output = stdout + stderr;
    if (output.includes('成功生成') || output.includes('Successfully generated') || output.includes('✓')) {
      if (fs.existsSync(outputPath)) {
        console.log(`   ✓ 成功: ${path.relative(projectRoot, outputPath)}`);
        return outputPath;
      }
    }

    // 即使没有成功信息，也检查文件是否存在
    if (fs.existsSync(outputPath)) {
      console.log(`   ✓ 成功: ${path.relative(projectRoot, outputPath)}`);
      return outputPath;
    }

    // 如果有错误信息，显示错误
    if (stderr && !stderr.includes('成功生成') && !stderr.includes('Successfully')) {
      console.error(`   ❌ 生成失败: ${stderr}`);
      return null;
    }

    return null;
  } catch (error: any) {
    console.error(`   ❌ 生成失败: ${error.message}`);
    return null;
  }
}

/**
 * 验证 workflow 文件
 */
function verifyWorkflow(workflowPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const workflow = yaml.load(content) as any;

    // 检查基本结构
    if (!workflow.name) {
      errors.push('缺少 workflow 名称');
    }
    if (!workflow.on) {
      errors.push('缺少触发条件');
    }
    if (!workflow.jobs) {
      errors.push('缺少 jobs 定义');
    }

    // 检查 Pipeline 路径
    const contentStr = content;
    if (!contentStr.includes('require(')) {
      errors.push('缺少 Pipeline 执行步骤');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    errors.push(`YAML 解析错误: ${error.message}`);
    return { valid: false, errors };
  }
}

/**
 * 触发 workflow
 */
async function triggerWorkflow(workflowFile: string, ref: string = 'main'): Promise<number | null> {
  console.log(`🚀 触发 workflow: ${workflowFile}...`);
  try {
    const { stdout } = await execAsync(`gh workflow run ${workflowFile} --ref ${ref}`);
    // 等待一下让 workflow 启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 获取最新的 run ID
    const { stdout: listOutput } = await execAsync(
      `gh run list --workflow ${workflowFile} --limit 1 --json databaseId --jq '.[0].databaseId'`
    );
    
    const runId = parseInt(listOutput.trim(), 10);
    if (runId) {
      console.log(`   ✓ 已触发，Run ID: ${runId}`);
      return runId;
    }
    return null;
  } catch (error: any) {
    console.error(`   ❌ 触发失败: ${error.message}`);
    return null;
  }
}

/**
 * 监控 workflow 执行
 */
async function watchWorkflow(runId: number): Promise<boolean> {
  console.log(`👀 监控 workflow 执行 (Run ID: ${runId})...`);
  try {
    const { stdout } = await execAsync(`gh run watch ${runId} --exit-status`, {
      timeout: 600000, // 10 分钟超时
    });
    
    // 检查是否成功
    const success = stdout.includes('completed') && !stdout.includes('failure');
    return success;
  } catch (error: any) {
    // exit-status 会在失败时抛出错误
    return false;
  }
}

/**
 * 获取 workflow 执行结果
 */
async function getWorkflowResult(runId: number): Promise<{
  status: string;
  conclusion: string;
  url: string;
}> {
  try {
    const { stdout } = await execAsync(
      `gh run view ${runId} --json status,conclusion,url --jq '{status: .status, conclusion: .conclusion, url: .url}'`
    );
    return JSON.parse(stdout);
  } catch (error: any) {
    return {
      status: 'unknown',
      conclusion: 'unknown',
      url: '',
    };
  }
}

/**
 * 主函数
 */
async function main() {
  const options = parseArgs();
  const projectRoot = detectProjectRoot();
  const workflowsDir = path.join(projectRoot, '.github', 'workflows');

  console.log('🔍 Pipeline 验证和调试工具\n');
  console.log(`项目根目录: ${projectRoot}\n`);

  // 确定要测试的 Pipeline
  let pipelinesToTest: string[] = [];

  if (options.all) {
    // 查找所有 Pipeline
    const files = findPipelineFiles(projectRoot);
    const classNames = files
      .map(extractClassName)
      .filter((name): name is string => name !== null)
      .filter((name, index, self) => self.indexOf(name) === index); // 去重
    
    pipelinesToTest = classNames;
    console.log(`📋 找到 ${pipelinesToTest.length} 个 Pipeline:\n`);
    pipelinesToTest.forEach(name => console.log(`   - ${name}`));
    console.log('');
  } else if (options.pipelines && options.pipelines.length > 0) {
    pipelinesToTest = options.pipelines;
  } else {
    console.error('❌ 错误: 请指定 --pipeline <name> 或 --all');
    process.exit(1);
  }

  // 清理旧的 workflow 文件
  if (options.clean) {
    await cleanWorkflows(workflowsDir);
    console.log('');
  }

  // 生成 workflow 文件
  const generatedWorkflows: Array<{ name: string; path: string }> = [];
  for (const pipelineName of pipelinesToTest) {
    const workflowPath = await generateWorkflow(projectRoot, pipelineName, workflowsDir);
    if (workflowPath) {
      generatedWorkflows.push({
        name: pipelineName,
        path: workflowPath,
      });
    }
  }

  if (generatedWorkflows.length === 0) {
    console.error('❌ 没有成功生成任何 workflow 文件');
    process.exit(1);
  }

  console.log('');

  // 验证 workflow 文件
  console.log('✅ 验证生成的 workflow 文件...\n');
  const verificationResults: Array<{ name: string; valid: boolean; errors: string[] }> = [];
  for (const workflow of generatedWorkflows) {
    const result = verifyWorkflow(workflow.path);
    verificationResults.push({
      name: workflow.name,
      ...result,
    });
    
    if (result.valid) {
      console.log(`   ✓ ${workflow.name}: 验证通过`);
    } else {
      console.log(`   ❌ ${workflow.name}: 验证失败`);
      result.errors.forEach(error => console.log(`      - ${error}`));
    }
  }

  console.log('');

  // 如果只是验证，就退出
  if (options.verify) {
    const allValid = verificationResults.every(r => r.valid);
    process.exit(allValid ? 0 : 1);
  }

  // 触发 workflow 进行在线测试
  if (options.trigger) {
    console.log('🚀 触发 workflow 进行在线测试...\n');
    const runIds: number[] = [];

    for (const workflow of generatedWorkflows) {
      const workflowFile = path.basename(workflow.path);
      const runId = await triggerWorkflow(workflowFile, 'main');
      if (runId) {
        runIds.push(runId);
      }
    }

    if (runIds.length === 0) {
      console.error('❌ 没有成功触发任何 workflow');
      process.exit(1);
    }

    console.log('');

    // 监控 workflow 执行
    if (options.watch) {
      console.log('👀 监控 workflow 执行状态...\n');
      const results: Array<{ name: string; success: boolean; runId: number }> = [];

      for (let i = 0; i < generatedWorkflows.length && i < runIds.length; i++) {
        const workflow = generatedWorkflows[i];
        const runId = runIds[i];
        
        console.log(`\n📊 ${workflow.name} (Run ID: ${runId}):`);
        const success = await watchWorkflow(runId);
        results.push({ name: workflow.name, success, runId });

        // 获取详细结果
        const result = await getWorkflowResult(runId);
        console.log(`   状态: ${result.status}`);
        console.log(`   结果: ${result.conclusion}`);
        if (result.url) {
          console.log(`   链接: ${result.url}`);
        }
      }

      console.log('\n📊 测试结果总结:\n');
      results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        console.log(`   ${icon} ${result.name} (Run ID: ${result.runId})`);
      });

      const allSuccess = results.every(r => r.success);
      process.exit(allSuccess ? 0 : 1);
    } else {
      console.log('💡 提示: 使用 --watch 选项可以监控 workflow 执行状态');
      console.log(`\n📊 已触发的 workflow:\n`);
      for (let i = 0; i < generatedWorkflows.length && i < runIds.length; i++) {
        const workflow = generatedWorkflows[i];
        const runId = runIds[i];
        console.log(`   - ${workflow.name}: Run ID ${runId}`);
        console.log(`     查看: gh run view ${runId}`);
      }
    }
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});

