# GitHub Actions 替代方案分析

## 你的痛点回顾

1. **多个项目需要相同的流程模式**
   - 提交分支触发
   - 产出构建结果
   - 保留产物
   - 指定构建执行发布

2. **每个项目的构建逻辑不同**
   - Flutter、Python、Node.js 等

3. **每个项目都要重复写 YAML**

## 方案 1: Reusable Workflows

### 什么是 Reusable Workflows？

Reusable Workflows 允许你定义一个工作流，然后在其他工作流中调用它。

### 实现示例

#### 1. 创建可复用的构建工作流

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build Workflow

on:
  workflow_call:
    inputs:
      build-command:
        required: true
        type: string
        description: 构建命令
      setup-command:
        required: false
        type: string
        description: 环境设置命令
      artifact-path:
        required: false
        type: string
        default: 'artifacts/**'
        description: 产物路径
    secrets:
      NPM_TOKEN:
        required: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up environment
        if: ${{ inputs.setup-command != '' }}
        run: ${{ inputs.setup-command }}
      
      - name: Build
        run: ${{ inputs.build-command }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: ${{ inputs.artifact-path }}
          retention-days: 30
```

#### 2. 在各个项目中调用

```yaml
# 项目 A (Flutter)
name: Build
on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      setup-command: |
        flutter --version
        flutter pub get
      build-command: flutter build windows --release
      artifact-path: build/windows/runner/Release/**
```

```yaml
# 项目 B (Node.js)
name: Build
on:
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      setup-command: npm ci
      build-command: npm run build
      artifact-path: dist/**
```

### ✅ 优点

1. **GitHub 官方支持**：原生功能，无需额外工具
2. **类型安全**：YAML 本身有验证
3. **简单直接**：不需要学习新工具
4. **跨仓库复用**：可以在不同仓库间复用

### ❌ 缺点

1. **构建逻辑仍然在 YAML 中**：复杂逻辑难以维护
2. **参数传递有限**：只能传递字符串参数
3. **无法封装复杂逻辑**：对于复杂的构建步骤，YAML 可能不够灵活
4. **每个项目仍需要写 YAML**：虽然简化了，但仍需要配置

### 适用场景

- ✅ 构建逻辑简单（单个命令或几个命令）
- ✅ 项目类型相似
- ✅ 不需要复杂的条件逻辑

## 方案 2: 自定义 Actions (TypeScript)

### 什么是自定义 Actions？

自定义 Actions 是用 TypeScript/JavaScript 编写的可复用组件，可以封装复杂的逻辑。

### 实现示例

#### 1. 创建自定义构建 Action

```typescript
// action.yml
name: 'Build Action'
description: '标准化构建流程'
inputs:
  build-command:
    description: '构建命令'
    required: true
  setup-command:
    description: '环境设置命令'
    required: false
  artifact-path:
    description: '产物路径'
    required: false
    default: 'artifacts/**'
runs:
  using: 'node20'
  main: 'dist/index.js'
```

```typescript
// index.ts
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as artifact from '@actions/artifact'

async function run() {
  try {
    const buildCommand = core.getInput('build-command', { required: true })
    const setupCommand = core.getInput('setup-command')
    const artifactPath = core.getInput('artifact-path') || 'artifacts/**'
    
    // 1. 环境设置
    if (setupCommand) {
      await exec.exec(setupCommand)
    }
    
    // 2. 执行构建
    await exec.exec(buildCommand)
    
    // 3. 上传产物
    const artifactClient = artifact.create()
    await artifactClient.uploadArtifact(
      'build-artifacts',
      [artifactPath],
      '.',
      { retentionDays: 30 }
    )
    
    core.setOutput('status', 'success')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
```

#### 2. 在各个项目中使用

```yaml
# 项目 A (Flutter)
name: Build
on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
      - uses: your-org/build-action@v1
        with:
          setup-command: flutter pub get
          build-command: flutter build windows --release
          artifact-path: build/windows/runner/Release/**
```

```yaml
# 项目 B (Node.js)
name: Build
on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: your-org/build-action@v1
        with:
          setup-command: npm ci
          build-command: npm run build
          artifact-path: dist/**
```

### ✅ 优点

1. **类型安全**：TypeScript 编译时检查
2. **封装复杂逻辑**：可以写复杂的构建逻辑
3. **官方支持**：GitHub Actions 官方支持
4. **可测试**：可以本地测试
5. **跨仓库复用**：可以发布到 GitHub Marketplace

### ❌ 缺点

1. **每个项目仍需要写 YAML**：虽然简化了，但仍需要配置
2. **需要维护 Action 代码**：需要单独维护 Action 仓库
3. **学习成本**：需要学习 TypeScript 和 Actions API
4. **参数传递有限**：只能传递字符串参数

### 适用场景

- ✅ 需要封装复杂逻辑
- ✅ 需要类型安全
- ✅ 需要在多个项目间复用

## 方案对比

| 特性 | Reusable Workflows | 自定义 Actions | 当前项目 (Python) |
|------|-------------------|----------------|-------------------|
| **类型安全** | ✅ YAML 验证 | ✅ TypeScript | ❌ Python 弱类型 |
| **封装复杂逻辑** | ❌ YAML 限制 | ✅ TypeScript | ✅ Python |
| **学习成本** | ✅ 低 | ⚠️ 中等 | ⚠️ 中等 |
| **维护成本** | ✅ 低 | ⚠️ 中等 | ⚠️ 中等 |
| **跨仓库复用** | ✅ 支持 | ✅ 支持 | ❌ 需要复制代码 |
| **每个项目仍需 YAML** | ✅ 需要 | ✅ 需要 | ✅ 自动生成 |
| **项目特定逻辑** | ⚠️ YAML 中配置 | ⚠️ 参数传递 | ✅ 派生类中实现 |

## 能否完美解决你的痛点？

### ✅ 可以解决的部分

1. **标准化流程模式**：✅ 可以
   - Reusable Workflows 定义标准流程
   - 自定义 Actions 封装标准逻辑

2. **复用通用逻辑**：✅ 可以
   - 触发条件、产物管理可以复用
   - 发布流程可以复用

3. **减少重复工作**：✅ 部分解决
   - 每个项目仍需要写 YAML（但简化了）
   - 构建逻辑仍然需要在 YAML 中配置

### ❌ 无法完美解决的部分

1. **项目特定逻辑**：
   - Reusable Workflows：需要在 YAML 中配置构建命令
   - 自定义 Actions：需要通过参数传递构建命令
   - **当前项目**：可以在派生类中实现复杂逻辑

2. **类型安全**：
   - Reusable Workflows：YAML 验证有限
   - 自定义 Actions：✅ TypeScript 类型安全
   - **当前项目**：❌ Python 弱类型

3. **自动生成 YAML**：
   - Reusable Workflows：❌ 需要手动写
   - 自定义 Actions：❌ 需要手动写
   - **当前项目**：✅ 自动生成

## 混合方案建议

### 最佳实践：组合使用

1. **用 Reusable Workflows 定义标准流程**
   ```yaml
   # .github/workflows/reusable-build.yml
   # 定义标准的构建流程（触发、产物、发布）
   ```

2. **用自定义 Actions 封装复杂逻辑**
   ```typescript
   // 封装复杂的构建逻辑（Flutter、Node.js 等）
   ```

3. **在各个项目中调用**
   ```yaml
   # 项目特定的 YAML（简化版）
   jobs:
     build:
       uses: ./.github/workflows/reusable-build.yml
       with:
         build-action: your-org/flutter-build-action@v1
   ```

### 对比当前项目

**当前项目的优势**：
- ✅ 自动生成 YAML（不需要手动写）
- ✅ 项目特定逻辑在代码中（不是 YAML）
- ✅ 统一的接口和流程

**当前项目的劣势**：
- ❌ Python 弱类型
- ❌ 需要 Python 环境
- ❌ 跨仓库复用需要复制代码

## 结论

### Reusable Workflows + 自定义 Actions 可以解决你的痛点，但：

1. **每个项目仍需要写 YAML**（虽然简化了）
2. **项目特定逻辑需要在 YAML 中配置**（或通过参数传递）
3. **无法自动生成 YAML**（需要手动写）

### 当前项目的优势：

1. **自动生成 YAML**：不需要手动写
2. **项目特定逻辑在代码中**：可以在派生类中实现复杂逻辑
3. **统一的接口**：所有项目使用相同的基类

### 建议

**如果迁移到 Go**，当前项目可能是最佳方案：
- ✅ 类型安全（Go）
- ✅ 自动生成 YAML
- ✅ 项目特定逻辑在代码中
- ✅ 统一的接口和流程

**如果不想迁移到 Go**，可以考虑：
- Reusable Workflows + 自定义 Actions（TypeScript）
- 但需要接受每个项目仍需要写 YAML


