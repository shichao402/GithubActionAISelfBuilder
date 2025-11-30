# TypeScript 迁移指南

## 概述

项目已完全迁移到 TypeScript，不再使用 Python。所有 Pipeline 类和脚手架工具都使用 TypeScript 实现。

## 架构变化

### 之前（Python）

```
Python Pipeline 类
  ↓
Python 脚手架工具
  ↓
GitHub Action YAML（调用 Python 脚本）
```

### 现在（TypeScript）

```
TypeScript Pipeline 类
  ↓
TypeScript 脚手架工具
  ↓
GitHub Action YAML（使用 TypeScript Actions）
```

## 项目结构

```
github-action-builder/
├── src/
│   ├── base-pipeline.ts          # Pipeline 基类
│   ├── workflow-config.ts         # 工作流配置构建器
│   ├── scaffold.ts                # 脚手架工具
│   └── pipelines/
│       ├── flutter-build-pipeline.ts
│       ├── build-pipeline.ts
│       └── release-pipeline.ts
├── actions/
│   ├── build-action/              # 构建 Action
│   └── release-action/             # 发布 Action
├── .github/workflows/              # 生成的 YAML 文件
├── package.json
└── tsconfig.json
```

## 核心组件

### 1. BasePipeline 基类

所有 Pipeline 类必须继承自 `BasePipeline`：

```typescript
import { BasePipeline, PipelineResult } from '../base-pipeline';

export class MyPipeline extends BasePipeline {
  // 定义工作流配置（静态方法）
  static getWorkflowInputs() { ... }
  static getWorkflowSetup() { ... }
  static getWorkflowTriggers() { ... }
  static getWorkflowRunsOn() { ... }

  // 实现执行逻辑
  async execute(): Promise<PipelineResult> {
    // 构建逻辑
    return { success: true, message: '...', exitCode: 0 };
  }
}
```

### 2. WorkflowConfig 配置构建器

使用 `WorkflowConfig` 来定义工作流配置：

```typescript
import { createWorkflowConfig } from '../workflow-config';

const config = createWorkflowConfig();
config.setupFlutter('3.16.0', 'stable', true);
config.onPush(['main', 'develop']);
return config.toDict();
```

### 3. 脚手架工具

使用 TypeScript 脚手架工具生成 YAML：

```bash
npm run scaffold -- --pipeline FlutterBuildPipeline --output flutter-build.yml
```

## 迁移步骤

### 步骤 1: 安装依赖

```bash
npm install
```

### 步骤 2: 创建 TypeScript Pipeline 类

将 Python Pipeline 类迁移到 TypeScript：

**Python 版本**：
```python
class FlutterBuildPipeline(BasePipeline):
    @classmethod
    def get_workflow_inputs(cls):
        config = create_workflow_config()
        config.add_input("project-name", "项目名称", required=True)
        return config._inputs
    
    def execute(self):
        self._run_command("flutter build windows")
        return PipelineResult(success=True, message="构建成功")
```

**TypeScript 版本**：
```typescript
export class FlutterBuildPipeline extends BasePipeline {
  static getWorkflowInputs() {
    const config = createWorkflowConfig();
    config.addInput('project-name', '项目名称', true);
    return config.toDict().inputs || {};
  }

  async execute(): Promise<PipelineResult> {
    await this.runCommand('flutter build windows');
    return { success: true, message: '构建成功', exitCode: 0 };
  }
}
```

### 步骤 3: 生成工作流 YAML

```bash
npm run build
npm run scaffold -- --pipeline FlutterBuildPipeline --output flutter-build.yml
```

### 步骤 4: 更新 GitHub Actions

生成的 YAML 会自动使用 TypeScript Actions，无需手动修改。

## API 对比

### 配置方法

| Python | TypeScript |
|--------|-----------|
| `get_workflow_inputs()` | `getWorkflowInputs()` |
| `get_workflow_setup()` | `getWorkflowSetup()` |
| `get_workflow_triggers()` | `getWorkflowTriggers()` |
| `get_workflow_runs_on()` | `getWorkflowRunsOn()` |

### 执行方法

| Python | TypeScript |
|--------|-----------|
| `def execute(self) -> PipelineResult:` | `async execute(): Promise<PipelineResult>` |
| `self._run_command("cmd")` | `await this.runCommand("cmd")` |
| `self.get_input("key")` | `this.getInput("key")` |
| `self.set_output("key", "value")` | `this.setOutput("key", "value")` |

### WorkflowConfig API

| Python | TypeScript |
|--------|-----------|
| `config.setup_python("3.9")` | `config.setupPython("3.9")` |
| `config.setup_flutter("3.16.0")` | `config.setupFlutter("3.16.0")` |
| `config.on_push(["main"])` | `config.onPush(["main"])` |
| `config.add_input("name", "desc")` | `config.addInput("name", "desc")` |

## 优势

### 1. 类型安全

TypeScript 提供编译时类型检查，减少运行时错误：

```typescript
// 编译时检查
const result: PipelineResult = await pipeline.execute();
if (result.success) {
  // TypeScript 知道 result.success 是 boolean
}
```

### 2. 统一语言栈

所有代码都使用 TypeScript，无需切换语言：

- Pipeline 类：TypeScript
- 脚手架工具：TypeScript
- Actions：TypeScript

### 3. 更好的 IDE 支持

- 自动补全
- 类型提示
- 重构支持

### 4. 现代化工具链

- npm workspaces
- TypeScript 编译器
- ESLint/Prettier

## 注意事项

### 1. 异步执行

TypeScript Pipeline 的 `execute()` 方法是异步的：

```typescript
async execute(): Promise<PipelineResult> {
  await this.runCommand('flutter build windows');
  return { success: true, message: '...', exitCode: 0 };
}
```

### 2. 文件操作

使用 Node.js 的 `fs` 模块：

```typescript
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(this.projectRoot, 'file.txt');
fs.writeFileSync(filePath, 'content');
```

### 3. 命令执行

使用 `runCommand()` 方法：

```typescript
// 同步方式（不推荐）
await this.runCommand('flutter build windows');

// 带选项
await this.runCommand('flutter build windows', {
  cwd: this.projectRoot,
  silent: false,
});
```

## 常见问题

### Q: 如何运行 Pipeline？

A: Pipeline 由 GitHub Actions 自动执行，或使用 `act` 本地测试：

```bash
npm run act:build
```

### Q: 如何调试 Pipeline？

A: 使用 TypeScript 的调试功能，或添加日志：

```typescript
this.log('info', '开始构建');
this.log('error', '构建失败');
```

### Q: 如何迁移现有的 Python Pipeline？

A: 参考 `src/pipelines/flutter-build-pipeline.ts` 的示例，逐步迁移。

## 下一步

1. ✅ 迁移所有 Pipeline 类到 TypeScript
2. ✅ 更新文档和示例
3. ✅ 清理 Python 文件
4. ✅ 测试所有功能

