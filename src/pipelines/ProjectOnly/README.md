# ProjectOnly Pipelines

本目录包含仅用于测试本项目的 Pipeline，**不会共享给父项目**。

## 目录说明

**重要**: 
- ✅ 本项目开发时：这些 Pipeline 可用
- ❌ 父项目使用时：这些 Pipeline **不会被扫描**（脚手架工具会排除此目录）
- 🚫 **父项目不应该引用这些 Pipeline**

## Pipeline 列表

### FlutterBuildPipeline

**文件**: `flutter-build-pipeline.ts`

**用途**: 测试本项目的 `flutter-demo` 样例工程

**特点**:
- 专门用于测试本项目的 Flutter 构建功能
- 硬编码了 `flutter-demo` 路径（本项目特有）
- 不适用于父项目的通用场景

**使用方式**:
```bash
npm run test:flutter
```

**与共享版本的区别**:
- 共享版本 (`src/pipelines/build/flutter-build-pipeline.ts`): 供父项目使用，可配置项目路径
- 测试版本 (`src/pipelines/ProjectOnly/flutter-build-pipeline.ts`): 仅用于测试本项目

### ReleasePipeline

**文件**: `release-pipeline.ts`

**用途**: 测试本项目的发布功能

**特点**:
- 用于测试 GitHub Release 创建功能
- 继承自 `ReleaseBasePipeline`，实现具体的发布逻辑
- 通过 `.github/workflows/release.yml` 触发

**使用方式**:
- 在 GitHub Actions 中手动触发 `release.yml` workflow

### VersionBumpPipeline

**文件**: `version-bump-pipeline.ts`

**用途**: 测试本项目的版本号递增功能

**特点**:
- 用于测试版本号递增功能
- 从 JSON 文件读取版本号，递增后保存
- 通过 `.github/workflows/version-bump.yml` 触发

**使用方式**:
- 在 GitHub Actions 中手动触发 `version-bump.yml` workflow

## 为什么单独存放？

1. **避免混淆**: 明确区分测试用 Pipeline 和共享 Pipeline
2. **父项目隔离**: 父项目不需要看到这些测试用的 Pipeline
3. **维护清晰**: 测试相关的代码集中管理

## 脚手架工具行为

脚手架工具在扫描 Pipeline 时会**自动排除** `ProjectOnly/` 目录：

```typescript
// 脚手架工具会跳过 ProjectOnly 目录
const pipelineFiles = findPipelineFiles(scriptsDir)
  .filter(file => !file.includes('ProjectOnly'));
```

因此，父项目使用脚手架工具时，不会看到这些测试用的 Pipeline。

