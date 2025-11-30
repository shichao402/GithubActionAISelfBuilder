# AI 自我调试 GitHub Actions - 快速指南

## 概述

本项目实现了 AI 自我调试 GitHub Actions workflow 的能力，可以：

1. ✅ **自动触发 workflow** - 使用 GitHub CLI
2. ✅ **实时监控状态** - 持续监控执行状态
3. ✅ **自动收集日志** - 失败时自动收集详细错误日志
4. ✅ **AI 分析支持** - 日志格式优化，便于 AI 分析

## 快速开始

### 1. 安装依赖

```bash
npm install
npm run build
```

### 2. 使用 Debug Action

```yaml
# .github/workflows/debug.yml
name: Debug Workflow

on:
  workflow_dispatch:
    inputs:
      workflow-file:
        description: 'Workflow 文件路径'
        required: true

jobs:
  debug:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Debug Workflow
        uses: ./actions/debug-action
        with:
          action: run
          workflow-file: ${{ inputs.workflow-file }}
          ref: main
```

### 3. 在代码中使用

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
  const logFile = await manager.collectWorkflowLogs(runId);
  // 日志可用于 AI 分析
}
```

## 作为子项目使用

### 1. 添加为 Git Submodule

```bash
git submodule add https://github.com/your-org/GithubActionAISelfBuilder.git
```

### 2. 在父项目中使用

```yaml
# 父项目/.github/workflows/build.yml
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive
      
      - name: Use Debug Action
        uses: ./GithubActionAISelfBuilder/actions/debug-action
        with:
          action: run
          workflow-file: .github/workflows/build.yml
```

## 详细文档

查看 [docs/ai-self-debug.md](docs/ai-self-debug.md) 了解完整功能和使用方法。

