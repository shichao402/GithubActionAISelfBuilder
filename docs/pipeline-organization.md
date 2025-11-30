# Pipeline 组织说明

## 目录结构

```
src/pipelines/
├── base/                    # 基类 Pipeline（共享）
│   ├── build-pipeline.ts           # 通用构建 Pipeline 基类
│   └── release-base-pipeline.ts    # 通用发布 Pipeline 基类
├── build/                   # 构建相关 Pipeline（共享）
│   └── flutter-build-pipeline.ts  # Flutter 构建 Pipeline（供父项目使用）
└── ProjectOnly/             # 本项目测试用 Pipeline（不共享）
    ├── README.md                    # 说明文档
    ├── flutter-build-pipeline.ts   # Flutter 构建 Pipeline（测试本项目 flutter-demo）
    ├── release-pipeline.ts         # 发布 Pipeline（测试本项目）
    └── version-bump-pipeline.ts    # 版本号递增 Pipeline（测试本项目）
```

## 分类说明

### 1. 共享 Pipeline（供父项目使用）

位于 `base/`, `build/`, `release/`, `version/` 目录下的 Pipeline 会被脚手架工具扫描，可以供父项目使用。

**特点**:
- ✅ 会被脚手架工具扫描
- ✅ 父项目可以使用
- ✅ 通用性强，可配置

### 2. 测试用 Pipeline（仅本项目）

位于 `ProjectOnly/` 目录下的 Pipeline **不会被脚手架工具扫描**，仅用于测试本项目。

**特点**:
- ❌ 不会被脚手架工具扫描（自动排除）
- ❌ 父项目不可见
- ✅ 仅用于测试本项目

## 脚手架工具行为

脚手架工具在扫描 Pipeline 时会**自动排除** `ProjectOnly/` 目录：

```typescript
// src/scaffold.ts
const findFilesRecursive = (dir: string): void => {
  // ...
  if (entry.isDirectory()) {
    // 跳过 ProjectOnly 目录
    if (entry.name === 'ProjectOnly') {
      continue;
    }
    // 递归查找子目录
    findFilesRecursive(fullPath);
  }
  // ...
};
```

## 为什么需要 ProjectOnly 目录？

1. **避免混淆**: 明确区分测试用 Pipeline 和共享 Pipeline
2. **父项目隔离**: 父项目不需要看到这些测试用的 Pipeline
3. **维护清晰**: 测试相关的代码集中管理
4. **自动排除**: 脚手架工具自动排除，无需额外配置

## 使用示例

### 共享 Pipeline（供父项目使用）

```typescript
// src/pipelines/build/flutter-build-pipeline.ts
export class FlutterBuildPipeline extends BuildPipeline {
  // 可配置项目路径，适用于任何 Flutter 项目
}
```

### 测试用 Pipeline（仅本项目）

```typescript
// src/pipelines/ProjectOnly/flutter-build-pipeline.ts
export class FlutterBuildPipeline extends BuildPipeline {
  // 硬编码了 flutter-demo 路径，仅用于测试本项目
  private readonly flutterDemoPath = path.join(this.projectRoot, 'flutter-demo');
}
```

## 相关文档

- **Pipeline 目录说明**: `src/pipelines/README.md`
- **ProjectOnly 说明**: `src/pipelines/ProjectOnly/README.md`
- **父项目使用指南**: `docs/parent-project-pipelines.md`

