# ProjectOnly 配置方案

## 概述

本项目使用基于配置文件的方案来管理 ProjectOnly 目录，而不是硬编码排除逻辑。

## 配置结构

### 本项目配置

**位置**: `config/ProjectOnly/config.yaml`

```yaml
pipelines:
  scripts_dir: "src/pipelines"
  include_project_only: true  # 本项目需要包含 ProjectOnly
```

**注意**：对于本项目，会直接使用此配置文件，不会加载根目录的 `config.yaml`。

### 父项目配置

**位置**: `config.yaml`（父项目根目录，参考 `config/config.example.yaml`）

```yaml
pipelines:
  scripts_dir: "src/pipelines"
  include_project_only: false  # 默认 false，父项目不需要
```

## 工作原理

1. **配置加载优先级**:
   - **如果指定了配置文件路径**：直接使用指定的配置文件
   - **如果是本项目**（存在 `config/ProjectOnly/config.yaml`）：优先使用 `config/ProjectOnly/config.yaml`
   - **如果是父项目**（不存在 `config/ProjectOnly/config.yaml`）：使用根目录的 `config.yaml`

2. **脚手架工具行为**:
   - 从配置读取 `pipelines.include_project_only`
   - 如果为 `true`，扫描 Pipeline 时会包含 `ProjectOnly/` 目录
   - 如果为 `false` 或未设置，排除 `ProjectOnly/` 目录

3. **父项目使用**:
   - 父项目在根目录创建 `config.yaml`（参考 `config/config.example.yaml`）
   - 不需要 `config/ProjectOnly/config.yaml`
   - 使用默认配置（`include_project_only: false`）
   - ProjectOnly 目录会被自动排除

## 使用场景

### 场景 1: 本项目维护

**配置文件**: `config/ProjectOnly/config.yaml`

```yaml
pipelines:
  include_project_only: true
```

**效果**:
- ✅ 脚手架工具会扫描 `ProjectOnly/` 目录
- ✅ 可以使用测试用的 Pipeline（如 `FlutterBuildPipeline`, `ReleasePipeline`, `VersionBumpPipeline`）
- ✅ 生成的 workflow 路径正确指向 `ProjectOnly/` 目录

### 场景 2: 父项目使用

**配置文件**: `config.yaml`（或使用默认配置）

```yaml
pipelines:
  scripts_dir: "src/pipelines"
  include_project_only: false  # 或不设置（默认 false）
```

**效果**:
- ❌ 脚手架工具不会扫描 `ProjectOnly/` 目录
- ❌ 父项目看不到测试用的 Pipeline
- ✅ 只看到共享的 Pipeline（如 `src/pipelines/build/flutter-build-pipeline.ts`）

## 配置示例

### 本项目配置（config/ProjectOnly/config.yaml）

```yaml
project:
  root: "../.."
  name: "GitHub Action AI Self Builder"

scaffold:
  workflows_dir: ".github/workflows"

pipelines:
  scripts_dir: "src/pipelines"
  include_project_only: true  # 关键配置
```

### 父项目配置（config.yaml）

```yaml
project:
  root: "."
  name: "My Project"

scaffold:
  workflows_dir: ".github/workflows"

pipelines:
  scripts_dir: "src/pipelines"
  # include_project_only 不设置或设置为 false
```

## 优势

1. **灵活性**: 通过配置文件控制，不需要修改代码
2. **清晰性**: 配置明确，易于理解
3. **可维护性**: 配置与代码分离，便于管理
4. **向后兼容**: 默认行为保持不变（排除 ProjectOnly）

## 相关文件

- **主配置**: `config.yaml`
- **项目特定配置**: `config/ProjectOnly/config.yaml`
- **脚手架工具**: `src/scaffold.ts`
- **Pipeline 目录**: `src/pipelines/ProjectOnly/`

