# GitHub Actions 替代方案示例

本目录包含两种替代方案的完整示例：
1. **Reusable Workflows** - 可复用工作流
2. **自定义 Actions (TypeScript)** - 自定义 Action

## 方案 1: Reusable Workflows

### 目录结构

```
reusable-workflows/
├── .github/
│   └── workflows/
│       ├── reusable-build.yml      # 可复用的构建工作流
│       └── reusable-release.yml    # 可复用的发布工作流
├── project-flutter/
│   └── .github/
│       └── workflows/
│           └── build.yml            # Flutter 项目调用可复用工作流
└── project-nodejs/
    └── .github/
        └── workflows/
            └── build.yml            # Node.js 项目调用可复用工作流
```

### 使用方式

#### 1. 定义可复用工作流

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build Workflow

on:
  workflow_call:
    inputs:
      build-command:
        required: true
        type: string
      setup-command:
        required: false
        type: string
      artifact-path:
        required: false
        type: string
        default: 'artifacts/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up environment
        if: ${{ inputs.setup-command != '' }}
        run: ${{ inputs.setup-command }}
      - name: Build
        run: ${{ inputs.build-command }}
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          path: ${{ inputs.artifact-path }}
```

#### 2. 在各个项目中调用

**Flutter 项目**：
```yaml
jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      setup-command: |
        flutter pub get
      build-command: flutter build windows --release
      artifact-path: build/windows/runner/Release/**
```

**Node.js 项目**：
```yaml
jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      setup-command: npm ci
      build-command: npm run build
      artifact-path: dist/**
```

### ✅ 优点

- GitHub 官方支持
- 简单直接，不需要额外工具
- 可以在不同仓库间复用

### ❌ 缺点

- 每个项目仍需要写 YAML
- 复杂逻辑在 YAML 中难以维护
- 参数传递有限

## 方案 2: 自定义 Actions (TypeScript)

### 目录结构

```
custom-actions/
├── build-action/
│   ├── action.yml                  # Action 定义
│   ├── src/
│   │   └── index.ts                # TypeScript 实现
│   ├── package.json
│   └── tsconfig.json
├── project-flutter/
│   └── .github/
│       └── workflows/
│           └── build.yml            # Flutter 项目使用自定义 Action
└── project-nodejs/
    └── .github/
        └── workflows/
            └── build.yml            # Node.js 项目使用自定义 Action
```

### 使用方式

#### 1. 创建自定义 Action

```typescript
// src/index.ts
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as artifact from '@actions/artifact'

async function run() {
  const buildCommand = core.getInput('build-command', { required: true })
  const setupCommand = core.getInput('setup-command')
  const artifactPath = core.getInput('artifact-path') || 'artifacts/**'
  
  // 环境设置
  if (setupCommand) {
    await exec.exec(setupCommand)
  }
  
  // 执行构建
  await exec.exec(buildCommand)
  
  // 上传产物
  const artifactClient = artifact.create()
  await artifactClient.uploadArtifact('build-artifacts', [artifactPath], '.')
  
  core.setOutput('build-status', 'success')
}

run()
```

#### 2. 在各个项目中使用

**Flutter 项目**：
```yaml
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - uses: ./../../custom-actions/build-action
        with:
          setup-command: flutter pub get
          build-command: flutter build windows --release
          artifact-path: build/windows/runner/Release/**
```

**Node.js 项目**：
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: ./../../custom-actions/build-action
        with:
          setup-command: npm ci
          build-command: npm run build
          artifact-path: dist/**
```

### ✅ 优点

- 类型安全（TypeScript）
- 可以封装复杂逻辑
- 官方支持
- 可以发布到 GitHub Marketplace

### ❌ 缺点

- 每个项目仍需要写 YAML
- 需要维护 Action 代码
- 需要学习 TypeScript 和 Actions API

## 对比当前项目

| 特性 | Reusable Workflows | 自定义 Actions | 当前项目 (Go) |
|------|-------------------|----------------|---------------|
| **自动生成 YAML** | ❌ 需要手动写 | ❌ 需要手动写 | ✅ 自动生成 |
| **项目特定逻辑** | ⚠️ YAML 中配置 | ⚠️ 参数传递 | ✅ 派生类中实现 |
| **类型安全** | ⚠️ YAML 验证 | ✅ TypeScript | ✅ Go 强类型 |
| **每个项目仍需 YAML** | ✅ 需要（简化版） | ✅ 需要（简化版） | ✅ 自动生成 |

## 总结

### Reusable Workflows + 自定义 Actions

**可以部分解决痛点，但**：
- ❌ 每个项目仍需要写 YAML
- ❌ 项目特定逻辑需要在 YAML 中配置
- ❌ 无法自动生成 YAML

**适合场景**：
- ✅ 构建逻辑简单
- ✅ 可以接受手动写 YAML
- ✅ 需要跨仓库复用

### 当前项目（迁移到 Go）

**可以完全解决痛点**：
- ✅ 自动生成 YAML
- ✅ 项目特定逻辑在代码中
- ✅ 类型安全（Go）
- ✅ 统一的接口和流程

**适合场景**：
- ✅ 多个项目，相同流程模式
- ✅ 需要自动生成 YAML
- ✅ 需要类型安全
- ✅ 项目特定逻辑复杂

## 建议

如果你的主要痛点是"每个项目都要重复写 YAML"，那么：

1. **Reusable Workflows + Actions**：可以部分解决，但每个项目仍需要写 YAML
2. **当前项目（迁移到 Go）**：可以完全解决，自动生成 YAML

如果你的主要痛点是"需要类型安全"，那么：

1. **自定义 Actions (TypeScript)**：✅ 类型安全
2. **当前项目（迁移到 Go）**：✅ 类型安全

**综合建议**：
- 如果**不想迁移到 Go**，可以考虑 Reusable Workflows + 自定义 Actions
- 如果**可以迁移到 Go**，当前项目可能是最佳方案（自动生成 YAML + 类型安全）


