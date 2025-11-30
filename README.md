# GitHub Action Builder - TypeScript 版本

一个通用的 GitHub Action 构建脚手架工具，完全使用 TypeScript 实现。支持通过 Pipeline 类定义配置和逻辑，自动生成 GitHub Action 工作流文件。

## 核心特性

1. ✅ **完全 TypeScript**：Pipeline 类、脚手架工具、Actions 全部使用 TypeScript
2. ✅ **类型安全**：编译时检查，减少错误
3. ✅ **以派生类为单位生成 YAML**：每个 Pipeline 类对应一个 workflow 文件
4. ✅ **可复用 Actions**：可以在多个项目中使用
5. ✅ **使用 act 本地测试**：完全模拟 GitHub Actions 环境
6. ✅ **跨平台构建**：使用 GitHub Actions 的真实 runner

## 技术栈

- **语言**: TypeScript
- **运行时**: Node.js 18+
- **测试工具**: act（本地运行 GitHub Actions）
- **包管理**: npm workspaces

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 构建 Actions

```bash
npm run build
```

### 3. 本地测试（使用 act）

```bash
# 安装 act
# macOS: brew install act
# Windows: choco install act-cli
# Linux: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# 列出所有工作流
npm run act:list

# 运行构建工作流
npm run act:build

# 运行发布工作流
npm run act:release
```

## 项目结构

```
github-action-builder/
├── src/
│   ├── base-pipeline.ts        # Pipeline 基类
│   ├── workflow-config.ts       # 工作流配置构建器
│   ├── scaffold.ts             # 脚手架工具
│   └── pipelines/
│       ├── flutter-build-pipeline.ts
│       ├── build-pipeline.ts
│       └── release-pipeline.ts
├── actions/
│   ├── build-action/            # 构建 Action
│   └── release-action/          # 发布 Action
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

#### 1. 作为本地 Action 使用

```yaml
# .github/workflows/build.yml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./path/to/github-action-builder/actions/build-action
        with:
          build-command: npm run build
          artifact-path: dist/**
```

#### 2. 发布到 GitHub Marketplace

```bash
# 1. 构建 Action
cd actions/build-action
npm run build

# 2. 提交并推送
git add dist/
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin v1.0.0
```

#### 3. 在其他项目中使用发布的 Action

```yaml
# .github/workflows/build.yml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: your-org/build-action@v1.0.0
        with:
          build-command: npm run build
```

## 本地测试

### 使用 act

```bash
# 运行构建工作流
act -j build

# 运行发布工作流
act -j release

# 使用特定事件
act push
act workflow_dispatch
```

### 直接运行 Action

```bash
# 进入 Action 目录
cd actions/build-action

# 构建
npm run build

# 测试（需要设置环境变量）
export INPUT_BUILD-COMMAND="npm run build"
export INPUT_ARTIFACT-PATH="dist/**"
node dist/index.js
```

## 开发指南

### 创建新的 Action

1. 创建 Action 目录：
```bash
mkdir -p actions/my-action/src
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
4. ✅ **本地测试**：使用 act 完全模拟 GitHub Actions

### 使用 act 的优势

1. ✅ **完全模拟**：完全模拟 GitHub Actions 环境
2. ✅ **不需要 mock**：不需要写本地 mock
3. ✅ **完整测试**：可以测试完整的流程

## 注意事项

### act 的局限性

1. ⚠️ **跨平台构建**：act 无法构建其他平台的程序
   - 在 Windows 上无法构建 macOS 程序
   - 需要使用真实的 GitHub Actions runner

2. ⚠️ **GitHub API**：act 无法连接到真实的 GitHub API
   - 查询工作流运行需要使用 gh CLI
   - 创建 Release 需要使用 gh CLI

### 推荐工作流

1. **开发阶段**：使用 act 测试工作流逻辑
2. **构建阶段**：使用 GitHub Actions 在目标平台构建
3. **发布阶段**：使用 gh CLI 完成发布操作

## 许可证

MIT
