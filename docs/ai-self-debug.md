# AI 自我调试 GitHub Actions 能力

## 概述

本项目实现了 AI 自我调试 GitHub Actions workflow 的能力，基于 SvnMergeTool 项目的优秀实践。核心功能包括：

1. **自动触发 workflow** - 使用 GitHub CLI 触发 workflow 并获取 run ID
2. **实时监控状态** - 持续监控 workflow 执行状态
3. **自动收集日志** - 失败时自动收集详细错误日志
4. **AI 分析支持** - 日志格式优化，便于 AI 分析

## 核心组件

### 1. WorkflowManager (TypeScript)

位置：`src/workflow-manager.ts`

提供核心功能：
- `triggerWorkflow()` - 触发 workflow
- `monitorWorkflow()` - 监控 workflow 状态
- `collectWorkflowLogs()` - 收集失败日志
- `runWorkflow()` - 组合操作（触发 + 监控）

### 2. Debug Action

位置：`actions/debug-action/`

可复用的 GitHub Action，可以在任何项目中使用：

```yaml
- uses: ./actions/debug-action
  with:
    action: run
    workflow-file: .github/workflows/build.yml
    ref: main
```

## 使用方式

### 方式 1: 在 Pipeline 中使用

```typescript
// src/pipelines/build-pipeline.ts
import { WorkflowManager } from '../workflow-manager';

export class BuildPipeline extends BasePipeline {
  async execute(): Promise<PipelineResult> {
    // 构建逻辑...
    
    // 如果需要触发其他 workflow
    const manager = new WorkflowManager();
    const result = await manager.triggerWorkflow('.github/workflows/release.yml', {
      ref: 'main',
      inputs: { version: '1.0.0' },
    });
    
    if (result.success) {
      // 监控 workflow
      await manager.monitorWorkflow(result.runId);
    }
    
    return { success: true, message: '构建成功', exitCode: 0 };
  }
}
```

### 方式 2: 在 GitHub Action 中使用

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

### 方式 3: 作为子项目使用

如果本项目作为其他项目的子项目：

```yaml
# 父项目/.github/workflows/build.yml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive  # 包含子项目
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          cd GithubActionAISelfBuilder  # 子项目目录
          npm ci
      
      - name: Build
        run: |
          npm run build
          cd GithubActionAISelfBuilder
          npm run build
      
      - name: Debug Workflow
        uses: ./GithubActionAISelfBuilder/actions/debug-action
        with:
          action: run
          workflow-file: .github/workflows/release.yml
```

## 功能详解

### 1. 触发 Workflow

```typescript
const manager = new WorkflowManager();
const result = await manager.triggerWorkflow('.github/workflows/build.yml', {
  ref: 'main',
  inputs: {
    version: '1.0.0',
    platform: 'all',
  },
});

if (result.success) {
  console.log(`Run ID: ${result.runId}`);
}
```

### 2. 监控 Workflow

```typescript
const manager = new WorkflowManager();
const result = await manager.monitorWorkflow(runId, {
  pollInterval: 5, // 每 5 秒查询一次
  onStatusChange: (info) => {
    console.log(`状态: ${info.status}`);
  },
});

if (result.success) {
  console.log('Workflow 执行成功！');
} else {
  console.log('Workflow 执行失败！');
}
```

### 3. 收集日志

```typescript
const manager = new WorkflowManager();
const logFile = await manager.collectWorkflowLogs(runId);

if (logFile) {
  console.log(`日志已保存到: ${logFile}`);
  // 可以读取日志文件，供 AI 分析
  const logContent = fs.readFileSync(logFile, 'utf8');
  // 发送给 AI 分析...
}
```

### 4. 自动运行（触发 + 监控）

```typescript
const manager = new WorkflowManager();
const result = await manager.runWorkflow('.github/workflows/build.yml', {
  ref: 'main',
  inputs: { version: '1.0.0' },
  pollInterval: 5,
});

// 自动触发、监控，失败时自动收集日志
```

## AI 分析集成

### 日志格式

收集的日志文件包含：

1. **Workflow 基本信息**
   - Run ID
   - Workflow 名称
   - 分支、事件、状态等

2. **Jobs 摘要**
   - 所有 jobs 的状态和结论

3. **失败 Jobs 详情**
   - 每个失败 job 的完整日志
   - 错误信息和堆栈跟踪

### AI 分析示例

```typescript
import { WorkflowManager } from './src/workflow-manager';
import * as fs from 'fs';

async function analyzeWorkflowFailure(runId: number) {
  const manager = new WorkflowManager();
  
  // 收集日志
  const logFile = await manager.collectWorkflowLogs(runId);
  if (!logFile) {
    return;
  }
  
  // 读取日志
  const logContent = fs.readFileSync(logFile, 'utf8');
  
  // 发送给 AI 分析（示例）
  const analysis = await analyzeWithAI(logContent);
  
  // AI 可以：
  // 1. 识别错误原因
  // 2. 提供修复建议
  // 3. 自动生成修复代码
  // 4. 更新 workflow 文件
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

### 3. 在父项目的 Pipeline 中使用

```typescript
// 父项目/src/pipelines/build-pipeline.ts
import { WorkflowManager } from '../GithubActionAISelfBuilder/src/workflow-manager';

export class BuildPipeline extends BasePipeline {
  async execute(): Promise<PipelineResult> {
    // 使用子项目的 WorkflowManager
    const manager = new WorkflowManager();
    // ...
  }
}
```

## 优势

1. ✅ **可复用** - 可以作为子项目在任何项目中使用
2. ✅ **类型安全** - TypeScript 提供类型检查
3. ✅ **自动化** - 自动触发、监控、收集日志
4. ✅ **AI 友好** - 日志格式优化，便于 AI 分析
5. ✅ **跨平台** - 支持 Windows、Linux、macOS

## 注意事项

1. **GitHub CLI 要求** - 需要安装并登录 GitHub CLI
2. **权限要求** - 需要访问 GitHub Actions 的权限
3. **API 限制** - GitHub API 有速率限制，频繁查询可能触发限制
4. **网络连接** - 需要网络连接来访问 GitHub API

## 相关文档

- [GitHub CLI 文档](https://cli.github.com/manual/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [SvnMergeTool 项目](https://github.com/your-org/SvnMergeTool) - 原始实现参考

