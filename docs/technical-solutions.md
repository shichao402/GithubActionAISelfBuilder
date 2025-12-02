# Pipeline 技术方案优化

## 问题分析

当前方案存在以下问题：

### 1. 父项目需要 Node.js 环境
- 需要安装 Node.js 依赖
- 需要创建 `package.json`
- 需要创建 `tsconfig.json`
- 需要编译 TypeScript

### 2. 父项目需要写 TypeScript 代码
- 需要导入 `BasePipeline`
- 需要知道子模块路径
- 需要管理依赖关系

### 3. GitHub Actions 中需要编译步骤
- 需要运行 `npm ci`
- 需要运行 `npm run build`
- 增加了执行时间

## 技术方案对比

### 方案 1：使用 ts-node 运行时编译 ⭐ 推荐

**优点**：
- ✅ 不需要编译步骤
- ✅ 直接运行 TypeScript 文件
- ✅ 减少 GitHub Actions 执行时间
- ✅ 保持类型安全

**缺点**：
- ⚠️ 需要安装 ts-node 和 TypeScript 依赖
- ⚠️ 如果 Pipeline 在父项目中，父项目仍需要依赖

**实现**：
```yaml
# 生成的 workflow
steps:
  - name: Install dependencies
    run: npm ci  # 需要包含 ts-node 和 TypeScript
  - name: Run Pipeline
    run: npx ts-node -e "const { MyPipeline } = require('./src/pipelines/my-pipeline'); ..."
```

### 方案 2：将 Pipeline 放在子模块中 ⭐⭐⭐ 最推荐

**优点**：
- ✅ 父项目不需要 Node.js 依赖
- ✅ 父项目不需要写代码
- ✅ 父项目只需要配置
- ✅ Pipeline 代码集中在子模块

**缺点**：
- ⚠️ 灵活性可能降低（但可以通过配置参数化解决）

**实现**：
```yaml
# config.yaml（父项目）
pipelines:
  scripts_dir: "Tools/GithubActionAISelfBuilder/src/pipelines"  # 子模块路径
  pipeline_class: "FlutterBuildPipeline"  # 选择 Pipeline
  inputs:
    build-command: "flutter build"
```

### 方案 3：组合方案 ⭐⭐ 推荐

**结合方案 1 和方案 2**：
- 使用 ts-node 运行时编译（避免编译步骤）
- 支持将 Pipeline 放在子模块中（父项目只需配置）
- 也支持将 Pipeline 放在父项目中（保持灵活性）

**实现**：
- 如果 Pipeline 在子模块中：使用子模块的 ts-node 和依赖
- 如果 Pipeline 在父项目中：父项目需要安装依赖，但可以使用 ts-node

## 推荐方案

### 最佳实践：方案 2 + 方案 1

1. **将 Pipeline 文件放在子模块中**
   - 子模块提供预定义的 Pipeline
   - 父项目通过配置选择 Pipeline

2. **使用 ts-node 运行时编译**
   - 不需要编译步骤
   - 减少执行时间

3. **父项目只需要配置**
   ```yaml
   # config.yaml
   pipelines:
     scripts_dir: "Tools/GithubActionAISelfBuilder/src/pipelines"
     pipeline_class: "FlutterBuildPipeline"
     inputs:
       build-command: "flutter build apk"
   ```

### 实现步骤

1. **修改脚手架生成器**
   - 检测 Pipeline 是否在子模块中
   - 如果是在子模块中，使用子模块的依赖和配置
   - 使用 ts-node 运行时编译

2. **支持配置化 Pipeline**
   - 父项目通过 `config.yaml` 选择 Pipeline
   - 支持参数化配置

3. **更新文档**
   - 说明如何将 Pipeline 放在子模块中
   - 说明配置方式

## 当前实现状态

✅ **已实现**：
- 使用 ts-node 运行时编译（避免编译步骤）
- 支持检测 Pipeline 是否在子模块中
- 支持使用子模块的依赖和配置

🔄 **待优化**：
- 支持配置化 Pipeline（父项目只需配置）
- 提供更多预定义 Pipeline
- 优化文档说明

## 使用示例

### 方式 1：Pipeline 在子模块中（推荐）

```yaml
# config.yaml（父项目）
pipelines:
  scripts_dir: "Tools/GithubActionAISelfBuilder/src/pipelines"
```

```typescript
// Tools/GithubActionAISelfBuilder/src/pipelines/my-pipeline.ts
import { BasePipeline } from '../../base-pipeline';
// ... 实现代码
```

生成的 workflow 会自动：
- 使用子模块的依赖
- 使用 ts-node 运行时编译
- 不需要编译步骤

### 方式 2：Pipeline 在父项目中（保持灵活性）

```yaml
# config.yaml（父项目）
pipelines:
  scripts_dir: "src/pipelines"
```

父项目需要：
- 安装 Node.js 依赖（包括 ts-node）
- 创建 `package.json` 和 `tsconfig.json`

生成的 workflow 会：
- 使用父项目的依赖
- 使用 ts-node 运行时编译
- 不需要编译步骤

