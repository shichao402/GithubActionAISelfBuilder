# 迁移到 TypeScript - 完整指南

## 概述

项目已完全迁移到 TypeScript，不再保留 Python 代码。所有 Pipeline 类和脚手架工具都使用 TypeScript 实现。

## 核心变化

### 1. 使用 TypeScript，可以使用 Reusable Actions

- ✅ 所有代码使用 TypeScript
- ✅ 类型安全，编译时检查
- ✅ 可复用的 TypeScript Actions

### 2. 以派生类为单位生成 GitHub Action YAML

- ✅ TypeScript Pipeline 类定义配置和逻辑
- ✅ TypeScript 脚手架工具生成 YAML
- ✅ 每个 Pipeline 类对应一个 workflow 文件

## 项目结构

```
github-action-builder/
├── src/
│   ├── base-pipeline.ts          # Pipeline 基类
│   ├── workflow-config.ts        # 工作流配置构建器
│   ├── scaffold.ts               # 脚手架工具
│   └── pipelines/
│       ├── flutter-build-pipeline.ts
│       ├── build-pipeline.ts
│       └── release-pipeline.ts
├── actions/
│   ├── build-action/             # 构建 Action
│   └── release-action/            # 发布 Action
├── .github/workflows/             # 生成的 YAML
├── package.json
└── tsconfig.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 创建 Pipeline 类

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

  static getWorkflowRunsOn(): string {
    return 'ubuntu-latest';
  }

  async execute(): Promise<PipelineResult> {
    await this.runCommand('npm run build');
    return {
      success: true,
      message: '构建成功',
      exitCode: 0,
    };
  }
}
```

### 4. 生成工作流 YAML

```bash
npm run scaffold -- --pipeline MyPipeline --output my-pipeline.yml
```

## API 参考

### BasePipeline 基类

```typescript
abstract class BasePipeline {
  // 静态方法：定义工作流配置
  static getWorkflowInputs(): Record<string, InputConfig>
  static getWorkflowSetup(): SetupConfig
  static getWorkflowTriggers(): TriggerConfig
  static getWorkflowEnv(): Record<string, string>
  static getWorkflowRunsOn(): string

  // 实例方法：执行逻辑
  abstract execute(): Promise<PipelineResult>
  
  // 工具方法
  protected getInput(key: string, defaultValue?: any): any
  protected setOutput(key: string, value: any): void
  protected runCommand(command: string, options?: {}): Promise<boolean>
  protected log(level: 'info' | 'warning' | 'error' | 'debug', message: string): void
}
```

### WorkflowConfig 配置构建器

```typescript
const config = createWorkflowConfig();

// 输入参数
config.addInput('name', 'description', required, defaultValue);

// 环境设置
config.setupPython('3.9', 'pip');
config.setupNode('18', 'npm');
config.setupFlutter('3.16.0', 'stable', true);
config.addSetupStep('name', 'command');

// 触发条件
config.onPush(['main', 'develop']);
config.onPullRequest(['main']);
config.onWorkflowDispatch({ ... });
config.onSchedule('0 0 * * *');

// 环境变量
config.setEnv('KEY', 'value');
config.setRunsOn('ubuntu-latest');

// 转换为字典
const dict = config.toDict();
```

## 脚手架工具

### 使用方式

```bash
# 生成工作流文件
npm run scaffold -- --pipeline PipelineClassName --output workflow.yml

# 更新已存在的文件
npm run scaffold -- --pipeline PipelineClassName --output workflow.yml --update
```

### 参数说明

- `--pipeline`: Pipeline 类名（必需）
- `--output`: 输出文件路径（可选，默认自动生成）
- `--update`: 更新已存在的文件

## 示例

### Flutter 构建 Pipeline

```typescript
export class FlutterBuildPipeline extends BasePipeline {
  static getWorkflowInputs() {
    const config = createWorkflowConfig();
    config.addInput('flutter-version', 'Flutter 版本', false, '3.16.0');
    config.addInput('build-mode', '构建模式', false, 'release');
    return config.toDict().inputs || {};
  }

  static getWorkflowSetup() {
    const config = createWorkflowConfig();
    config.setupFlutter('3.16.0', 'stable', true);
    config.addSetupStep('Get dependencies', 'flutter pub get');
    return config.toDict().setup || {};
  }

  static getWorkflowTriggers() {
    const config = createWorkflowConfig();
    config.onPush(['main', 'develop']);
    config.onPullRequest(['main']);
    return config.toDict().triggers || {};
  }

  static getWorkflowRunsOn(): string {
    return 'windows-latest';
  }

  async execute(): Promise<PipelineResult> {
    const buildMode = this.getInput('build-mode', 'release');
    await this.runCommand(`flutter build windows --${buildMode}`);
    
    return {
      success: true,
      message: '构建成功',
      data: {
        'artifact-path': 'build/windows/runner/Release',
      },
      exitCode: 0,
    };
  }
}
```

## 优势

### 1. 类型安全

- ✅ 编译时类型检查
- ✅ IDE 自动补全
- ✅ 减少运行时错误

### 2. 统一语言栈

- ✅ Pipeline 类：TypeScript
- ✅ 脚手架工具：TypeScript
- ✅ Actions：TypeScript

### 3. 现代化工具链

- ✅ npm workspaces
- ✅ TypeScript 编译器
- ✅ ESLint/Prettier

### 4. 可复用 Actions

- ✅ 可以在多个项目中使用
- ✅ 可以发布到 GitHub Marketplace
- ✅ 统一的接口和流程

## 迁移检查清单

- [ ] 安装 Node.js 18+
- [ ] 运行 `npm install`
- [ ] 迁移所有 Pipeline 类到 TypeScript
- [ ] 更新脚手架工具调用
- [ ] 测试生成的 YAML
- [ ] 清理 Python 文件
- [ ] 更新文档

## 下一步

1. 查看 `docs/typescript-migration.md` 了解详细迁移步骤
2. 参考 `src/pipelines/flutter-build-pipeline.ts` 作为示例
3. 使用 `npm run scaffold` 生成工作流文件

