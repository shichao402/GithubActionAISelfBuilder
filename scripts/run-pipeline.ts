#!/usr/bin/env node
/**
 * 本地运行 Pipeline 脚本
 * 
 * 简化本地运行 Pipeline 的流程，支持通过命令行参数传递输入
 * 
 * 用法:
 *   npm run pipeline -- BuildPipeline
 *   npm run pipeline -- FlutterBuildPipeline --build-command "flutter build"
 *   npm run pipeline -- BuildPipeline --setup-command "npm install" --build-command "npm run build"
 * 
 * 选项:
 *   <PipelineName>           Pipeline 类名（必需）
 *   --<input-key> <value>    设置输入参数（如 --build-command "npm run build"）
 *   --help                   显示帮助信息
 */

import * as path from 'path';
import * as fs from 'fs';

// 解析命令行参数
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
本地运行 Pipeline 脚本

用法:
  npm run pipeline -- <PipelineName> [选项]

示例:
  # 运行 BuildPipeline（使用默认参数）
  npm run pipeline -- BuildPipeline

  # 运行 BuildPipeline 并设置构建命令
  npm run pipeline -- BuildPipeline --build-command "npm run build"

  # 运行 FlutterBuildPipeline
  npm run pipeline -- FlutterBuildPipeline

  # 设置多个参数
  npm run pipeline -- BuildPipeline \\
    --setup-command "npm install" \\
    --build-command "npm run build" \\
    --artifact-path "dist/**"

选项:
  --<input-key> <value>    设置输入参数
  --help, -h               显示此帮助信息

可用的 Pipeline:
  - BuildPipeline
  - FlutterBuildPipeline
  - ReleasePipeline
  - VersionBumpPipeline
`);
  process.exit(0);
}

const pipelineName = args[0];
const inputArgs: Record<string, string> = {};

// 解析输入参数
for (let i = 1; i < args.length; i += 2) {
  const key = args[i];
  const value = args[i + 1];
  
  if (key && key.startsWith('--')) {
    const inputKey = key.substring(2).replace(/-/g, '-');
    if (value) {
      inputArgs[inputKey] = value;
    }
  }
}

// 设置环境变量（GitHub Actions 格式）
for (const [key, value] of Object.entries(inputArgs)) {
  const envKey = `INPUT_${key.toUpperCase().replace(/-/g, '_')}`;
  process.env[envKey] = value;
}

// 动态加载 Pipeline 类
async function loadPipeline(pipelineName: string): Promise<any> {
  // 尝试从编译后的文件加载
  const possiblePaths = [
    path.join(process.cwd(), 'dist', 'src', 'pipelines', 'base', `${pipelineName.toLowerCase().replace('pipeline', '')}-pipeline.js`),
    path.join(process.cwd(), 'dist', 'src', 'pipelines', 'build', `${pipelineName.toLowerCase().replace('pipeline', '')}-pipeline.js`),
    path.join(process.cwd(), 'dist', 'src', 'pipelines', 'test', `${pipelineName.toLowerCase().replace('pipeline', '')}-pipeline.js`),
  ];

  // 也尝试直接按类名查找
  const allPipelineFiles: string[] = [];
  
  function findPipelineFiles(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findPipelineFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js') && entry.name.includes('pipeline')) {
        allPipelineFiles.push(fullPath);
      }
    }
  }

  findPipelineFiles(path.join(process.cwd(), 'dist', 'src', 'pipelines'));

  // 尝试加载
  for (const filePath of [...possiblePaths, ...allPipelineFiles]) {
    if (fs.existsSync(filePath)) {
      try {
        const module = require(filePath);
        if (module[pipelineName]) {
          return module[pipelineName];
        }
      } catch (e) {
        // 继续尝试下一个
      }
    }
  }

  throw new Error(`无法找到 Pipeline 类: ${pipelineName}\n请确保已运行 npm run build`);
}

// 运行 Pipeline
async function main() {
  try {
    console.log(`🚀 运行 Pipeline: ${pipelineName}\n`);
    
    if (Object.keys(inputArgs).length > 0) {
      console.log('📋 输入参数:');
      for (const [key, value] of Object.entries(inputArgs)) {
        console.log(`   ${key}: ${value}`);
      }
      console.log('');
    }

    const PipelineClass = await loadPipeline(pipelineName);
    const pipeline = new PipelineClass(inputArgs);
    
    console.log('⏳ 执行中...\n');
    const result = await pipeline.run();
    
    console.log('\n📊 执行结果:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Pipeline 执行成功！');
      process.exit(0);
    } else {
      console.log('\n❌ Pipeline 执行失败！');
      process.exit(result.exitCode || 1);
    }
  } catch (error: any) {
    console.error('\n❌ 错误:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

