# GitHub Action Builder - 使用指南

## 📦 项目信息

**GitHub 仓库**: https://github.com/shichao402/GithubActionAISelfBuilder.git

本项目是一个通用的 GitHub Action 从零构建脚手架工具。通过标准化的流水线脚本基类和脚手架工具，配合 AI 协助，为任意 GitHub 项目快速生成构建、测试、发布等功能的 GitHub Action 工作流。

## 🚀 快速开始

### 方式 1: 作为 Git Submodule（推荐）

#### 步骤 1: 添加 Git Submodule

在您的父项目根目录下执行：

```bash
# 添加子模块（可以使用自定义名称）
git submodule add https://github.com/shichao402/GithubActionAISelfBuilder.git Tools/GithubActionAISelfBuilder

# 初始化子模块
git submodule update --init --recursive
```

#### 步骤 2: 设置 Python 环境

```bash
# 进入子模块目录
cd Tools/GithubActionAISelfBuilder/python

# 创建 Conda 环境
conda env create -f environment.yml

# 激活环境
conda activate github-action-builder
```

#### 步骤 3: 在父项目中创建 Pipeline

在父项目中创建 Pipeline 目录（默认：`src/pipelines/`）：

```bash
# 在父项目根目录
mkdir -p src/pipelines
```

创建您的第一个 Pipeline 文件 `src/pipelines/my_build_pipeline.py`：

```python
# 根据实际路径调整导入（假设子模块在 Tools/GithubActionAISelfBuilder）
import sys
from pathlib import Path

# 添加子模块路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "Tools" / "GithubActionAISelfBuilder" / "python"))

from src.base_pipeline import BasePipeline, PipelineResult
from src.workflow_config import create_workflow_config

class MyBuildPipeline(BasePipeline):
    """构建 Pipeline"""
    
    @staticmethod
    def get_workflow_inputs():
        """定义工作流输入参数"""
        config = create_workflow_config()
        config.add_input("build-command", "构建命令", False, "npm run build")
        return config.to_dict().get("inputs", {})
    
    @staticmethod
    def get_workflow_setup():
        """定义准备阶段配置"""
        config = create_workflow_config()
        config.setup_node("18", "npm")
        return config.to_dict().get("setup", {})
    
    @staticmethod
    def get_workflow_triggers():
        """定义触发条件"""
        config = create_workflow_config()
        config.on_push(["main", "develop"])
        config.on_pull_request(["main"])
        return config.to_dict().get("triggers", {})
    
    @staticmethod
    def get_workflow_runs_on():
        """定义运行环境"""
        return "ubuntu-latest"
    
    def execute(self) -> PipelineResult:
        """实现执行逻辑"""
        try:
            build_command = self.get_input("build-command", "npm run build")
            
            self.log("info", f"开始执行构建: {build_command}")
            
            success = self.run_command(build_command)
            
            if not success:
                return PipelineResult(
                    success=False,
                    message="构建失败",
                    exit_code=1
                )
            
            return PipelineResult(
                success=True,
                message="构建成功",
                exit_code=0
            )
        except Exception as e:
            return PipelineResult(
                success=False,
                message=f"执行过程中发生错误: {str(e)}",
                exit_code=1
            )
```

#### 步骤 4: 生成 GitHub Action Workflow

```bash
# 在父项目根目录执行
cd Tools/GithubActionAISelfBuilder/python
python -m src.scaffold --pipeline MyBuildPipeline --output ../../.github/workflows/my-build.yml
```

#### 步骤 5: 提交并推送

```bash
# 回到父项目根目录
cd ../..

# 提交生成的文件
git add .github/workflows/my-build.yml src/pipelines/my_build_pipeline.py
git commit -m "feat: 添加构建 Pipeline 和工作流"
git push
```

### 方式 2: 直接克隆（用于测试）

如果您想先测试项目功能，可以直接克隆：

```bash
git clone https://github.com/shichao402/GithubActionAISelfBuilder.git
cd GithubActionAISelfBuilder/python
conda env create -f environment.yml
conda activate github-action-builder
```

## 🎯 最佳实践

### 使用 Python Pipeline（推荐）⭐⭐⭐

**核心思想**：使用 Python + Conda 管理环境，享受类型注解（mypy）和简单直接的使用方式。

#### 工作流程

1. **在父项目中创建 Pipeline**（Python，类型注解）
   ```python
   # src/pipelines/my_pipeline.py
   from src.base_pipeline import BasePipeline, PipelineResult
   # ... 实现代码（享受类型注解）
   ```

2. **使用 Conda 管理环境**（固化运行环境）
   ```bash
   conda env create -f Tools/GithubActionAISelfBuilder/python/environment.yml
   conda activate github-action-builder
   ```

3. **生成的 workflow 直接使用 Python**（不需要编译步骤）

**优势**：
- ✅ **类型安全**：使用 Python 类型注解 + mypy 进行类型检查
- ✅ **简单使用**：Python 直接运行，不需要编译步骤
- ✅ **环境管理**：Conda 固化运行环境，确保一致性
- ✅ **快速执行**：workflow 中不需要编译步骤，执行更快

### 使用临时目录（备选方案）

如果需要在父项目中自定义 Pipeline，可以使用临时目录：

1. **创建临时目录**：
   ```bash
   mkdir -p .github-action-builder/pipelines
   ```

2. **配置 `config.yaml`**：
   ```yaml
   pipelines:
     scripts_dir: ".github-action-builder/pipelines"
   ```

3. **添加到 `.gitignore`**（可选）：
   ```
   .github-action-builder/
   ```

**注意**：使用临时目录时，父项目需要安装 Node.js 依赖（包括 ts-node）。

## 📝 详细使用说明

### 1. Pipeline 存放位置

**默认位置**: `src/pipelines/`

**推荐：使用临时目录（避免污染父项目）**

如果父项目不需要 Node.js 环境，推荐将 Pipeline 文件放在临时目录：

```yaml
# config.yaml（在父项目根目录）
pipelines:
  scripts_dir: ".github-action-builder/pipelines"  # 临时目录
  dist_dir: ".github-action-builder/dist"           # 编译输出也放在临时目录
```

**优势**：
- ✅ 不需要在父项目中安装 Node.js 依赖
- ✅ 不需要在父项目中创建 `package.json` 和 `tsconfig.json`
- ✅ 所有 Pipeline 相关文件集中在临时目录
- ✅ 可以添加到 `.gitignore`，不污染父项目仓库

**自定义位置**: 在父项目根目录创建 `config.yaml`：

```yaml
pipelines:
  scripts_dir: "workflows/pipelines"  # 自定义 Pipeline 目录
  dist_dir: "dist"                     # 编译输出目录（默认 dist）
```

### 2. 导入路径调整

根据子模块的实际位置调整导入路径：

```typescript
// 如果子模块在 Tools/GithubActionAISelfBuilder
import { BasePipeline } from '../../Tools/GithubActionAISelfBuilder/src/base-pipeline';
import { createWorkflowConfig } from '../../Tools/GithubActionAISelfBuilder/src/workflow-config';

// 如果子模块在根目录的 GithubActionAISelfBuilder
import { BasePipeline } from '../GithubActionAISelfBuilder/src/base-pipeline';
import { createWorkflowConfig } from '../GithubActionAISelfBuilder/src/workflow-config';
```

### 3. 使用基类 Pipeline

项目提供了两个基类，可以继承使用：

#### BuildPipeline（构建基类）

```typescript
import { BuildPipeline } from '../../Tools/GithubActionAISelfBuilder/src/pipelines/base/build-pipeline';

export class MyBuildPipeline extends BuildPipeline {
  // 只需实现 performBuild() 方法
  protected async performBuild(): Promise<boolean> {
    return await this.runCommand('npm run build');
  }
}
```

#### ReleaseBasePipeline（发布基类）

```typescript
import { ReleaseBasePipeline } from '../../Tools/GithubActionAISelfBuilder/src/pipelines/base/release-base-pipeline';

export class MyReleasePipeline extends ReleaseBasePipeline {
  // 继承父类的发布流程，可以覆盖特定方法
  protected async createRelease(
    version: string,
    releaseNotes: string,
    artifactPath: string | null
  ): Promise<boolean> {
    // 自定义发布逻辑
    return await super.createRelease(version, releaseNotes, artifactPath);
  }
}
```

### 4. 生成 Workflow 文件

#### 基本用法

```bash
# 在子模块目录中执行
cd Tools/GithubActionAISelfBuilder
npm run scaffold -- --pipeline MyBuildPipeline --output ../../.github/workflows/my-build.yml
```

#### 更新已存在的 Workflow

```bash
npm run scaffold -- --pipeline MyBuildPipeline --output ../../.github/workflows/my-build.yml --update
```

### 5. 测试和调试

#### 本地测试 Pipeline

```bash
# 在父项目根目录
cd Tools/GithubActionAISelfBuilder
npm run pipeline -- MyBuildPipeline --build-command "npm run build"
```

#### 在线测试 Workflow

**重要**: 测试在线 workflow 之前，必须先推送代码！

```bash
# 1. 先推送代码
git add .
git commit -m "test: 添加 workflow"
git push

# 2. 使用 AI 调试脚本测试
cd Tools/GithubActionAISelfBuilder
npm run ai-debug -- ../../.github/workflows/my-build.yml main

# 如果需要传递 inputs
npm run ai-debug -- ../../.github/workflows/my-release.yml main -f version=1.0.0 -f release-notes="Release notes"
```

## 📚 完整示例

### 示例 1: 简单的构建 Pipeline

**文件**: `src/pipelines/simple-build-pipeline.ts`

```typescript
import { BasePipeline, PipelineResult } from '../../Tools/GithubActionAISelfBuilder/src/base-pipeline';
import { createWorkflowConfig } from '../../Tools/GithubActionAISelfBuilder/src/workflow-config';

export class SimpleBuildPipeline extends BasePipeline {
  static getWorkflowInputs() {
    const config = createWorkflowConfig();
    config.addInput('build-command', '构建命令', false, 'npm run build');
    return config.toDict().inputs || {};
  }

  static getWorkflowSetup() {
    const config = createWorkflowConfig();
    config.setupNode('18', 'npm');
    return config.toDict().setup || {};
  }

  static getWorkflowTriggers() {
    const config = createWorkflowConfig();
    config.onPush(['main']);
    config.onPullRequest(['main']);
    return config.toDict().triggers || {};
  }

  static getWorkflowRunsOn(): string {
    return 'ubuntu-latest';
  }

  async execute(): Promise<PipelineResult> {
    const buildCommand = this.getInput('build-command') || 'npm run build';
    const success = await this.runCommand(buildCommand);
    
    return {
      success,
      message: success ? '构建成功' : '构建失败',
      exitCode: success ? 0 : 1,
    };
  }
}
```

**生成 workflow**:

```bash
cd Tools/GithubActionAISelfBuilder
npm run scaffold -- --pipeline SimpleBuildPipeline --output ../../.github/workflows/simple-build.yml
```

### 示例 2: 继承 BuildPipeline 基类

**文件**: `src/pipelines/npm-build-pipeline.ts`

```typescript
import { BuildPipeline } from '../../Tools/GithubActionAISelfBuilder/src/pipelines/base/build-pipeline';

export class NpmBuildPipeline extends BuildPipeline {
  protected async performBuild(): Promise<boolean> {
    // 安装依赖
    await this.runCommand('npm ci');
    
    // 执行构建
    return await this.runCommand('npm run build');
  }
}
```

### 示例 3: 发布 Pipeline

**文件**: `src/pipelines/release-pipeline.ts`

```typescript
import { ReleaseBasePipeline } from '../../Tools/GithubActionAISelfBuilder/src/pipelines/base/release-base-pipeline';

export class MyReleasePipeline extends ReleaseBasePipeline {
  // 继承父类的发布流程
  // 可以覆盖特定方法来自定义行为
}
```

**生成 workflow**:

```bash
cd Tools/GithubActionAISelfBuilder
npm run scaffold -- --pipeline MyReleasePipeline --output ../../.github/workflows/release.yml
```

**注意**: Release Pipeline 需要在 workflow 文件中设置权限：

```yaml
jobs:
  release:
    permissions:
      contents: write  # 需要写权限来创建 Release
      actions: read    # 需要读权限来查询工作流运行
```

## 🔧 配置说明

### config.yaml 配置

在父项目根目录创建 `config.yaml`（可选）：

```yaml
pipelines:
  scripts_dir: "src/pipelines"  # Pipeline 文件目录
  include_test_pipelines: false # 是否包含 test 目录下的 Pipeline
```

### Workflow 权限配置

如果 Pipeline 需要创建 Release 或其他写操作，需要在 workflow 文件中添加权限：

```yaml
jobs:
  your_job:
    permissions:
      contents: write  # 创建 Release、推送代码等
      actions: read     # 查询工作流运行
```

## 🛠️ 工具脚本

### AI 调试脚本

用于调试 GitHub Actions workflow：

```bash
# 在子模块目录中执行
cd Tools/GithubActionAISelfBuilder

# 基本用法
npm run ai-debug -- ../../.github/workflows/my-build.yml main

# 带 inputs 的用法
npm run ai-debug -- ../../.github/workflows/release.yml main -f version=1.0.0 -f release-notes="Release notes"
```

### Pipeline 验证脚本

用于验证和测试 Pipeline：

```bash
cd Tools/GithubActionAISelfBuilder

# 测试单个 Pipeline
npm run test:pipelines -- --pipeline MyBuildPipeline --trigger --watch

# 测试所有 Pipeline
npm run test:pipelines -- --all --trigger --watch
```

## 📋 最佳实践

### 1. 目录组织

```
your-project/
├── .github/
│   └── workflows/          # 生成的 workflow 文件
├── src/
│   └── pipelines/          # Pipeline 类文件
├── Tools/
│   └── GithubActionAISelfBuilder/  # 子模块
├── config.yaml             # 配置文件（可选）
└── package.json
```

### 2. 命名规范

- **Pipeline 类**: 使用 PascalCase，以 `Pipeline` 结尾（如 `MyBuildPipeline`）
- **文件名**: 使用 kebab-case（如 `my-build-pipeline.ts`）
- **Workflow 文件**: 使用 kebab-case（如 `my-build.yml`）

### 3. 版本管理

- 子模块使用固定版本（推荐）：
  ```bash
  cd Tools/GithubActionAISelfBuilder
  git checkout <tag或commit>
  ```

- 或使用最新版本：
  ```bash
  git submodule update --remote
  ```

### 4. 测试流程

1. **本地测试**: 使用 `npm run pipeline` 测试 Pipeline 逻辑
2. **生成 Workflow**: 使用 `npm run scaffold` 生成 workflow 文件
3. **推送代码**: 推送 Pipeline 和 workflow 文件
4. **在线测试**: 使用 `npm run ai-debug` 测试在线 workflow

## ❓ 常见问题

### Q: 如何更新子模块？

```bash
cd Tools/GithubActionAISelfBuilder
git pull origin main
cd ../..
git add Tools/GithubActionAISelfBuilder
git commit -m "chore: 更新子模块"
```

### Q: Pipeline 找不到怎么办？

1. 检查 Pipeline 文件是否在正确的目录（默认：`src/pipelines/`）
2. 检查 `config.yaml` 中的 `scripts_dir` 配置
3. 检查导入路径是否正确

### Q: Workflow 执行失败怎么办？

1. 使用 AI 调试脚本收集日志：
   ```bash
   npm run ai-debug -- .github/workflows/your-workflow.yml main
   ```
2. 查看生成的错误日志文件
3. 根据错误信息修复问题

### Q: 如何自定义 Pipeline 目录？

在父项目根目录创建 `config.yaml`：

```yaml
pipelines:
  scripts_dir: "custom/pipelines"  # 自定义目录
```

## 🔗 相关文档

- **核心规则**: `.cursor/rules/rules.mdc`（在子模块中）
- **脚本使用**: `.cursor/rules/scripts-usage.mdc`（在子模块中）
- **父项目 Pipeline 指南**: `docs/parent-project-pipelines.md`（在子模块中）

## 📞 支持

如有问题，请提交 Issue: https://github.com/shichao402/GithubActionAISelfBuilder/issues


