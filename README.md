# GitHub Action Builder - TypeScript 版本

一个通用的 GitHub Action 构建脚手架工具，完全使用 TypeScript 实现。支持通过 Pipeline 类定义配置和逻辑，自动生成 GitHub Action 工作流文件。

## 核心特性

1. ✅ **完全 TypeScript**：Pipeline 类、脚手架工具、Actions 全部使用 TypeScript
2. ✅ **类型安全**：编译时检查，减少错误
3. ✅ **以派生类为单位生成 YAML**：每个 Pipeline 类对应一个 workflow 文件
4. ✅ **可复用 Actions**：可以在多个项目中使用
5. ✅ **跨平台构建**：使用 GitHub Actions 的真实 runner
6. ✅ **AI 自我调试**：自动触发、监控和收集日志

## 技术栈

- **语言**: TypeScript
- **运行时**: Node.js 18+
- **包管理**: npm workspaces

## 快速开始

### 1. 安装 Node.js

确保已安装 Node.js 18+ 版本：

```bash
# 检查 Node.js 版本
node --version

# 如果未安装，请访问 https://nodejs.org/
```

### 2. 安装项目依赖

```bash
npm install
```

### 3. 构建项目

```bash
npm run build
```

### 4. 本地测试

```bash
# 运行单元测试
npm test

# 运行特定 Pipeline
npm run test:flutter
```

## 项目结构

```
github-action-builder/
├── src/
│   ├── base-pipeline.ts        # Pipeline 基类
│   ├── workflow-config.ts       # 工作流配置构建器
│   ├── scaffold.ts             # 脚手架工具
│   └── pipelines/
│       ├── base/                    # 基类 Pipeline
│       │   ├── build-pipeline.ts
│       │   └── release-base-pipeline.ts
│       ├── build/                   # 构建相关 Pipeline
│       │   └── flutter-build-pipeline.ts
│       ├── release/                 # 发布相关 Pipeline
│       │   └── release-pipeline.ts
│       └── version/                 # 版本相关 Pipeline
│           └── version-bump-pipeline.ts
├── .github/workflows/           # 生成的 YAML 文件
├── package.json
├── tsconfig.json
└── README.md
```

## 使用方式

### 1. 创建 Pipeline 类

```typescript
// src/pipelines/my-pipeline.ts
import { BasePipeline, PipelineResult } from '../base-pipeline';
import { createWorkflowConfig } from '../workflow-config';

export class MyPipeline extends BasePipeline {
  static getWorkflowInputs() {
    const config = createWorkflowConfig();
    config.addInput('project-name', '项目名称', true);
    return config.toDict().inputs || {};
  }

  static getWorkflowSetup() {
    const config = createWorkflowConfig();
    config.setupNode('18', 'npm');
    return config.toDict().setup || {};
  }

  static getWorkflowTriggers() {
    const config = createWorkflowConfig();
    config.onPush(['main', 'develop']);
    return config.toDict().triggers || {};
  }

  async execute(): Promise<PipelineResult> {
    await this.runCommand('npm run build');
    return { success: true, message: '构建成功', exitCode: 0 };
  }
}
```

### 2. 生成工作流 YAML

```bash
npm run build
npm run scaffold -- --pipeline MyPipeline --output my-pipeline.yml
```

### 在其他项目中使用

#### 1. 在其他项目中使用 Pipeline

```yaml
# .github/workflows/build.yml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Run BuildPipeline
        run: node -e "const { BuildPipeline } = require('./dist/src/pipelines/build-pipeline'); const pipeline = new BuildPipeline(); pipeline.run();"
        env:
          INPUT_BUILD_COMMAND: "npm run build"
          INPUT_ARTIFACT_PATH: "dist/**"
```

#### 2. 使用 Pipeline 继承

```typescript
// 在你的项目中
import { BuildPipeline } from './path/to/github-action-builder/dist/src/pipelines/build-pipeline';

export class MyBuildPipeline extends BuildPipeline {
  protected async performBuild(): Promise<boolean> {
    // 实现你的构建逻辑
    return await this.runCommand('npm run build');
  }
}
```

## 本地测试

### 运行单元测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 直接运行 Pipeline

```bash
# 构建项目
npm run build

# 运行 Pipeline
ts-node -e "const { BuildPipeline } = require('./dist/src/pipelines/build-pipeline'); const pipeline = new BuildPipeline(); pipeline.run();"

# 运行 Pipeline（需要设置环境变量）
export INPUT_BUILD_COMMAND="npm run build"
export INPUT_ARTIFACT_PATH="dist/**"
node -e "const { BuildPipeline } = require('./dist/src/pipelines/build-pipeline'); const pipeline = new BuildPipeline(); pipeline.run();"
```

## 开发指南

### 创建新的 Pipeline

1. 创建 Pipeline 文件：
```bash
touch src/pipelines/my-pipeline.ts
```

2. 创建 `action.yml`：
```yaml
name: 'My Action'
description: 'My custom action'
inputs:
  my-input:
    description: 'My input'
    required: true
runs:
  using: 'node20'
  main: 'dist/index.js'
```

3. 创建 `package.json`：
```json
{
  "name": "my-action",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "ncc build src/index.ts -o dist"
  },
  "dependencies": {
    "@actions/core": "^1.10.1"
  }
}
```

4. 实现 Action：
```typescript
// src/index.ts
import * as core from '@actions/core'

async function run() {
  const input = core.getInput('my-input')
  core.info(`Input: ${input}`)
}

run()
```

## 优势

### 相比其他方案

1. ✅ **类型安全**：TypeScript 编译时检查
2. ✅ **官方支持**：GitHub Actions 官方支持 TypeScript
3. ✅ **可复用**：可以发布到 GitHub Marketplace
4. ✅ **AI 自我调试**：自动触发、监控和收集日志

## AI 自我调试

本项目实现了 AI 自我调试 GitHub Actions workflow 的能力，可以：

1. ✅ **自动触发 workflow** - 使用 GitHub CLI
2. ✅ **实时监控状态** - 持续监控执行状态
3. ✅ **自动收集日志** - 失败时自动收集详细错误日志
4. ✅ **AI 分析支持** - 日志格式优化，便于 AI 分析

### 快速使用

```typescript
import { WorkflowManager } from './src/workflow-manager';

const manager = new WorkflowManager();

// 触发并监控 workflow
const result = await manager.runWorkflow('.github/workflows/build.yml', {
  ref: 'main',
  inputs: { version: '1.0.0' },
});

if (!result.success) {
  // 失败时自动收集日志
  const logFile = await manager.collectWorkflowLogs(result.runId);
  // 日志可用于 AI 分析
}
```

详细文档请参考 [docs/ai-self-debug.md](docs/ai-self-debug.md)

## 注意事项

### 跨平台构建

- ⚠️ **跨平台构建**：需要使用真实的 GitHub Actions runner
  - 在 Windows 上无法构建 macOS 程序
  - 使用 GitHub Actions 在目标平台构建

### 推荐工作流

1. **开发阶段**：本地运行 Pipeline 测试逻辑
2. **构建阶段**：使用 GitHub Actions 在目标平台构建
3. **发布阶段**：使用 gh CLI 完成发布操作

## 许可证

MIT
