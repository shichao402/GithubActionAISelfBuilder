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

## 测试

### 运行单元测试

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 覆盖率报告
npm run test:coverage
```

### 测试结构

```
├── src/__tests__/          # 单元测试
│   ├── base-pipeline.test.ts
│   ├── workflow-config.test.ts
│   ├── workflow-manager.test.ts
│   └── scaffold.test.ts
├── .github/workflows/
│   └── test.yml            # 单元测试和基础集成测试
└── jest.config.js          # Jest 配置
```

### 测试类型

1. **单元测试** - 测试核心模块功能
2. **集成测试** - 测试脚手架工具和 Pipeline 执行
3. **GitHub Actions 测试** - 在真实环境中测试

### 测试最佳实践

- ✅ 测试行为，而非实现细节
- ✅ 端到端测试优先
- ✅ 覆盖边界情况和错误场景
- ✅ 只 Mock 外部依赖

详细测试规范请参考 [docs/testing-best-practices.md](docs/testing-best-practices.md)

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

## 项目架构

### 核心设计

**TypeScript Pipeline + Scaffold**：
```
TypeScript Pipeline 类（定义配置和逻辑）
  ↓
TypeScript 脚手架工具（生成 YAML）
  ↓
GitHub Action YAML（使用 TypeScript Actions）
  ↓
TypeScript Actions（执行构建/发布）
```

### 核心优势

1. ✅ **类型安全**：TypeScript 编译时检查，减少运行时错误
2. ✅ **模块化设计**：清晰的职责划分，易于维护和扩展
3. ✅ **可复用**：可以在多个项目中使用，可发布到 GitHub Marketplace
4. ✅ **跨平台构建**：使用 GitHub Actions 的真实 runner，支持所有平台
5. ✅ **AI 自我调试**：自动触发、监控和收集日志

## 项目价值

### 解决的痛点

用户有**多个项目**，每个项目都需要：
1. ✅ **提交分支触发构建** - 标准化触发条件
2. ✅ **产出构建结果** - 项目特定的构建逻辑
3. ✅ **保留产物** - 标准化的产物管理
4. ✅ **指定构建找到流水线执行发布** - 标准化的发布流程

**问题**：虽然每个项目的**构建方法不同**（Flutter、Python、Node.js 等），但**流程模式是相同的**。每个项目都要重新写一遍 GitHub Action YAML，重复工作。

### 本项目提供的价值

1. **标准化流程模式**
   - 通过 `BasePipeline` 定义标准接口
   - 所有项目使用相同的流程模式
   - 触发条件、产物管理、发布流程统一

2. **复用通用逻辑**
   - 触发条件：`getWorkflowTriggers()` 定义标准触发
   - 产物管理：自动上传到 artifacts
   - 发布流程：`ReleaseBasePipeline` 标准化发布

3. **项目特定逻辑**
   - 只需要写 `execute()` 方法中的构建逻辑
   - 其他部分（触发、产物、发布）由框架处理

4. **脚手架生成**
   - 自动生成标准化的 YAML
   - 减少手动编写和错误

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

## 在父项目中使用

本项目可以作为 Git Submodule 或 npm 包在其他项目中使用。详细指南请参考：

- [在父项目中创建 Pipeline](docs/parent-project-pipelines.md)
- [配置说明](config/README.md)
- [Pipeline 目录组织](src/pipelines/README.md)

## 注意事项

### 跨平台构建

- ⚠️ **跨平台构建**：需要使用真实的 GitHub Actions runner
  - 在 Windows 上无法构建 macOS 程序
  - 使用 GitHub Actions 在目标平台构建

### 推荐工作流

1. **开发阶段**：本地运行 Pipeline 测试逻辑
2. **构建阶段**：使用 GitHub Actions 在目标平台构建
3. **发布阶段**：使用 gh CLI 完成发布操作

## 相关文档

### 核心文档
- [AI 自我调试](docs/ai-self-debug.md) - AI 调试 GitHub Actions workflow
- [在父项目中使用](docs/parent-project-pipelines.md) - 如何在其他项目中使用本项目
- [测试最佳实践](docs/testing-best-practices.md) - 单元测试规范和最佳实践

### 技术文档
- [GitHub Actions 身份验证](docs/github-actions-authentication.md) - 认证方式说明
- [GitHub API 客户端抽象](docs/github-api-client-abstraction.md) - API 客户端设计
- [Cursor 规则管理](docs/cursor-rules-management.md) - 规则文件管理方案
- [配置说明](config/README.md) - 配置文件使用说明
- [Pipeline 组织](src/pipelines/README.md) - Pipeline 目录结构说明
- [脚本使用](scripts/README.md) - 工具脚本使用说明

## 许可证

MIT
