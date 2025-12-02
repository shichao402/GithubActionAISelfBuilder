# AI 自我调试 GitHub Actions 能力

## 概述

本项目实现了 AI 自我调试 GitHub Actions workflow 的能力，核心功能包括：

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

## 使用方式

### 方式 1: 在代码中使用

```typescript
import { WorkflowManager } from './src/workflow-manager';

const manager = new WorkflowManager();

// 完整流程（推荐）
const result = await manager.runWorkflow('.github/workflows/build.yml', {
  ref: 'main',
  inputs: { version: '1.0.0' },
  pollInterval: 5,
});

if (!result.success) {
  // 自动收集日志
  const logFile = await manager.collectWorkflowLogs(result.runId);
  if (logFile) {
    // 读取日志并分析
    const logContent = fs.readFileSync(logFile, 'utf8');
    // 分析错误并修正...
  }
}
```

### 方式 2: 使用命令行脚本

```bash
# 使用 AI 调试脚本
npm run ai-debug -- .github/workflows/build.yml main

# 或直接使用
ts-node scripts/ai-debug-workflow.ts .github/workflows/build.yml main
```

### 方式 3: 在 GitHub Action 中使用

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
        run: node -e "const { WorkflowManager } = require('./dist/src/workflow-manager'); const manager = new WorkflowManager(); manager.runWorkflow('${{ inputs.workflow-file }}', { ref: 'main', pollInterval: 5 }).then(result => { if (!result.success) { process.exit(1); } });"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 方式 3: 命令行脚本

```bash
# 使用 AI 调试脚本
npm run ai-debug -- .github/workflows/build.yml main
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
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Debug Workflow
        run: node -e "const { WorkflowManager } = require('./GithubActionAISelfBuilder/dist/src/workflow-manager'); const manager = new WorkflowManager(); manager.runWorkflow('.github/workflows/build.yml', { ref: 'main', pollInterval: 5 }).then(result => { if (!result.success) { process.exit(1); } });"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 日志格式

收集的日志文件格式已优化，便于 AI 分析：

```
=== Workflow Run: 12345678 ===
Status: failure
Workflow: .github/workflows/build.yml
Branch: main
Commit: abc123

=== Job: build ===
Status: failure

=== Step: Build TypeScript ===
Status: failure
Exit Code: 1

Error Output:
[错误详情...]

=== Step: Run Pipeline ===
Status: failure
Exit Code: 1

Error Output:
[错误详情...]
```

## 最佳实践

### AI 自我调试流程

1. **触发工作流**：使用 `WorkflowManager.triggerWorkflow()`
2. **监控状态**：使用 `WorkflowManager.monitorWorkflow()`
3. **收集日志**：失败时使用 `WorkflowManager.collectWorkflowLogs()`
4. **分析错误**：读取日志文件，分析错误原因
5. **修正代码**：根据错误信息修正工作流或代码
6. **重新测试**：修正后重新触发工作流验证

### 禁止的操作

- ❌ 不收集日志就猜测错误原因
- ❌ 手动查看 GitHub 网页界面分析错误（除非无法使用脚本）
- ❌ 不验证修正就推送代码

## 相关文档

- 核心实现：`src/workflow-manager.ts`
- 命令行脚本：`scripts/ai-debug-workflow.ts`
