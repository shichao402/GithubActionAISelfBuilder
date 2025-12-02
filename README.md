# GitHub Action Builder

一个通用的 GitHub Action 构建脚手架工具。支持通过 Pipeline 类定义配置和逻辑，自动生成 GitHub Action 工作流文件。

## 🚀 核心特性

1. ✅ **完全 Python**：Pipeline 类、脚手架工具、Actions 全部使用 Python
2. ✅ **类型安全**：使用 Python 类型注解 + mypy 进行类型检查
3. ✅ **以派生类为单位生成 YAML**：每个 Pipeline 类对应一个 workflow 文件
4. ✅ **可复用 Actions**：可以在多个项目中使用
5. ✅ **跨平台构建**：使用 GitHub Actions 的真实 runner
6. ✅ **AI 自我调试**：自动触发、监控和收集日志
7. ✅ **环境管理简单**：使用 Conda 固化运行环境

## 技术栈

- **语言**: Python 3.11+
- **环境管理**: Conda
- **类型检查**: mypy
- **测试框架**: pytest

## 快速开始

### 1. 创建 Conda 环境

```bash
cd python
conda env create -f environment.yml
conda activate github-action-builder
```

### 2. 创建 Pipeline 类

```python
# src/pipelines/my_pipeline.py
from src.base_pipeline import BasePipeline, PipelineResult
from src.workflow_config import create_workflow_config

class MyPipeline(BasePipeline):
    @staticmethod
    def get_workflow_inputs():
        config = create_workflow_config()
        config.add_input("input-name", "输入参数描述", False, "default-value")
        return config.to_dict().get("inputs", {})
    
    def execute(self) -> PipelineResult:
        # 实现逻辑
        return PipelineResult(success=True, message="成功", exit_code=0)
```

### 3. 生成 Workflow

```bash
# 在项目根目录
python -m src.scaffold --pipeline MyPipeline --output .github/workflows/my-pipeline.yml
```

### 4. 本地测试

```bash
# 运行 Pipeline
python scripts/run_pipeline.py MyPipeline --input-name "value"

# 验证 Workflow
python scripts/test_pipelines.py --pipeline MyPipeline --verify
```

## 项目结构

```
github-action-builder/
├── python/                      # Python 版本（主要代码）
│   ├── src/
│   │   ├── base_pipeline.py     # Pipeline 基类
│   │   ├── workflow_config.py   # 工作流配置构建器
│   │   ├── scaffold.py          # 脚手架工具
│   │   └── pipelines/
│   │       ├── base/            # 基类 Pipeline
│   │       ├── build/            # 构建相关 Pipeline
│   │       └── test/             # 测试相关 Pipeline
│   ├── scripts/                 # 工具脚本
│   ├── tests/                   # 测试文件
│   ├── environment.yml          # Conda 环境配置
│   └── README.md                # Python 版本文档
├── .github/workflows/           # 生成的 YAML 文件
├── config/                      # 配置文件
└── README.md                    # 本文件
```

## 使用方式

### 1. 创建 Pipeline 类

继承 `BasePipeline` 并实现 `execute()` 方法：

```python
from src.base_pipeline import BasePipeline, PipelineResult
from src.workflow_config import create_workflow_config

class MyBuildPipeline(BasePipeline):
    @staticmethod
    def get_workflow_inputs():
        config = create_workflow_config()
        config.add_input("build-command", "构建命令", False, "npm run build")
        return config.to_dict().get("inputs", {})
    
    @staticmethod
    def get_workflow_setup():
        config = create_workflow_config()
        config.setup_node("18", "npm")
        return config.to_dict().get("setup", {})
    
    @staticmethod
    def get_workflow_triggers():
        config = create_workflow_config()
        config.on_push(["main", "develop"])
        config.on_pull_request(["main"])
        return config.to_dict().get("triggers", {})
    
    def execute(self) -> PipelineResult:
        build_command = self.get_input("build-command", "npm run build")
        success = self.run_command(build_command)
        
        return PipelineResult(
            success=success,
            message="构建成功" if success else "构建失败",
            exit_code=0 if success else 1
        )
```

### 2. 生成 Workflow

```bash
python -m src.scaffold --pipeline MyBuildPipeline --output .github/workflows/my-build.yml
```

### 3. 运行 Pipeline（本地测试）

```bash
python scripts/run_pipeline.py MyBuildPipeline --build-command "npm run build"
```

### 4. AI 调试 Workflow

```bash
python scripts/ai_debug_workflow.py .github/workflows/my-build.yml main
```

## 核心概念

### Pipeline 类

Pipeline 类继承自 `BasePipeline`，负责定义工作流的配置和执行逻辑。

**必需方法**:
- `execute()`: 执行 Pipeline 逻辑

**可选静态方法**（用于定义工作流配置）:
- `get_workflow_inputs()`: 定义输入参数
- `get_workflow_setup()`: 定义环境设置
- `get_workflow_triggers()`: 定义触发条件
- `get_workflow_runs_on()`: 定义运行环境
- `get_workflow_env()`: 定义环境变量

### WorkflowConfig

使用 `WorkflowConfig` 构建器来定义工作流配置：

```python
config = create_workflow_config()
config.add_input("input-name", "描述", False, "default")
config.setup_node("18", "npm")
config.on_push(["main"])
config.on_pull_request(["main"])
```

## 示例 Pipeline

### 构建 Pipeline

```python
from src.pipelines.base.build_pipeline import BuildPipeline

class MyBuildPipeline(BuildPipeline):
    def perform_build(self) -> bool:
        build_command = self.get_input("build-command", "npm run build")
        return self.run_command(build_command)
```

### 发布 Pipeline

```python
from src.pipelines.base.release_base_pipeline import ReleaseBasePipeline

class MyReleasePipeline(ReleaseBasePipeline):
    def create_release(self, version: str, release_notes: str, artifact_path: str) -> bool:
        # 实现发布逻辑
        return True
```

## 工具脚本

### run_pipeline.py

本地运行 Pipeline：

```bash
python scripts/run_pipeline.py MyPipeline --input-name "value"
```

### test_pipelines.py

验证和测试 Pipeline：

```bash
# 验证生成的 workflow
python scripts/test_pipelines.py --pipeline MyPipeline --verify

# 测试所有 Pipeline
python scripts/test_pipelines.py --all --clean --verify
```

### ai_debug_workflow.py

AI 调试工作流：

```bash
python scripts/ai_debug_workflow.py .github/workflows/my-pipeline.yml main
```

## 类型检查

```bash
# 安装 mypy
conda install -c conda-forge mypy

# 类型检查
mypy python/src/ --strict --ignore-missing-imports
```

## 测试

```bash
# 运行测试
cd python
pytest tests/
```

## 文档

- [快速开始指南](python/QUICK_START.md)
- [迁移完成报告](python/MIGRATION_COMPLETE.md)
- [使用指南](docs/USAGE_GUIDE.md)
- [父项目 Pipeline 指南](docs/parent-project-pipelines.md)

## 许可证

MIT License
