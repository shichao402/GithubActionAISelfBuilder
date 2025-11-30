# Pipelines 目录

本目录包含所有 Pipeline 类，按功能分类组织。

## 目录结构

```
src/pipelines/
├── base/                    # 基类 Pipeline（共享）
│   ├── build-pipeline.ts           # 通用构建 Pipeline 基类
│   └── release-base-pipeline.ts    # 通用发布 Pipeline 基类
├── build/                   # 构建相关 Pipeline（共享）
│   └── flutter-build-pipeline.ts  # Flutter 构建 Pipeline（供父项目使用）
└── test/                    # 本项目测试用 Pipeline（不共享给父项目）
    ├── flutter-build-pipeline.ts  # Flutter 构建 Pipeline（测试本项目 flutter-demo）
    ├── release-pipeline.ts        # 发布 Pipeline（测试本项目）
    └── version-bump-pipeline.ts   # 版本号递增 Pipeline（测试本项目）
```

## 组织原则

### 1. 基类（base/）

包含可复用的 Pipeline 基类，提供通用功能：

- **`BuildPipeline`**: 通用构建流程基类
  - 环境设置
  - 执行构建
  - 处理产物
  - 上传产物

- **`ReleaseBasePipeline`**: 通用发布流程基类
  - 检查 GitHub CLI
  - 查询构建工作流
  - 下载产物
  - 创建 Release

### 2. 具体实现（build/）

按功能分类，每个 Pipeline 继承对应的基类：

- **构建类** (`build/`): 继承 `BuildPipeline`

### 3. 测试用 Pipeline（test/）

**重要**: `test/` 目录下的 Pipeline 仅用于测试本项目，不会共享给父项目。

- **`FlutterBuildPipeline`**: 用于测试本项目的 `flutter-demo` 样例工程
  - 位置: `src/pipelines/test/flutter-build-pipeline.ts`
  - 用途: 测试 Flutter 构建功能
  - 使用: `npm run test:flutter`

- **`ReleasePipeline`**: 用于测试本项目的发布功能
  - 位置: `src/pipelines/test/release-pipeline.ts`
  - 用途: 测试 GitHub Release 创建功能
  - 使用: 通过 `.github/workflows/release.yml` 触发

- **`VersionBumpPipeline`**: 用于测试本项目的版本号递增功能
  - 位置: `src/pipelines/test/version-bump-pipeline.ts`
  - 用途: 测试版本号递增功能
  - 使用: 通过 `.github/workflows/version-bump.yml` 触发

## 使用方式

### 创建新的 Pipeline

1. **确定分类**：根据功能选择对应的目录
2. **选择基类**：如果功能类似，继承对应的基类
3. **实现逻辑**：覆盖基类的方法实现特定逻辑

### 示例：创建新的构建 Pipeline

```typescript
// src/pipelines/build/my-build-pipeline.ts
import { BuildPipeline, PipelineResult } from '../base/build-pipeline';

export class MyBuildPipeline extends BuildPipeline {
  protected async performBuild(): Promise<boolean> {
    // 实现你的构建逻辑
    return await this.runCommand('npm run build');
  }
}
```

### 示例：创建新的 Pipeline（无基类）

```typescript
// src/pipelines/version/my-version-pipeline.ts
import { BasePipeline, PipelineResult } from '../../base-pipeline';

export class MyVersionPipeline extends BasePipeline {
  async execute(): Promise<PipelineResult> {
    // 实现你的逻辑
    return { success: true, message: '完成', exitCode: 0 };
  }
}
```

## 导入路径规范

### 基类导入

```typescript
// 从 base/ 目录导入基类
import { BuildPipeline } from '../base/build-pipeline';
import { ReleaseBasePipeline } from '../base/release-base-pipeline';
```

### 基础类导入

```typescript
// 从 src/ 根目录导入 BasePipeline
import { BasePipeline } from '../../base-pipeline';
```

### 工具类导入

```typescript
// 从 src/ 根目录导入工具
import { createWorkflowConfig } from '../../workflow-config';
```

## 命名规范

- **基类**: `*Pipeline` 或 `*BasePipeline`（如 `BuildPipeline`, `ReleaseBasePipeline`）
- **具体实现**: `*Pipeline`（如 `FlutterBuildPipeline`, `ReleasePipeline`）
- **文件名**: 使用 kebab-case（如 `flutter-build-pipeline.ts`）

## 注册到 PipelineRegistry

Pipeline 类会在首次使用时自动注册到 `PipelineRegistry`，也可以通过 `getPipelineRegistry().register()` 手动注册。


