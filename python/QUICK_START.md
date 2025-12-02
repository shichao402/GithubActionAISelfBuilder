# Python 版本快速开始

## 🚀 快速开始

### 1. 创建 Conda 环境

```bash
cd python
conda env create -f environment.yml
conda activate github-action-builder
```

### 2. 创建 Pipeline

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

### 4. 运行 Pipeline（本地测试）

```bash
python scripts/run_pipeline.py MyPipeline --input-name "value"
```

### 5. 验证 Workflow

```bash
python scripts/test_pipelines.py --pipeline MyPipeline --verify
```

### 6. AI 调试 Workflow

```bash
python scripts/ai_debug_workflow.py .github/workflows/my-pipeline.yml main
```

## 📋 完整示例

### 创建构建 Pipeline

```python
# src/pipelines/my_build_pipeline.py
from src.pipelines.base.build_pipeline import BuildPipeline
from src.base_pipeline import PipelineResult

class MyBuildPipeline(BuildPipeline):
    def perform_build(self) -> bool:
        build_command = self.get_input("build-command", "npm run build")
        return self.run_command(build_command)
```

### 生成 Workflow

```bash
python -m src.scaffold --pipeline MyBuildPipeline --output .github/workflows/my-build.yml
```

### 生成的 Workflow 示例

```yaml
name: My Build
on:
  push:
    branches: [main, develop]
jobs:
  my_build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Set up Conda
        uses: conda-incubator/setup-miniconda@v2
        with:
          environment-file: Tools/GithubActionAISelfBuilder/python/environment.yml
          activate-environment: github-action-builder
      - name: Run MyBuildPipeline
        run: |
          python -c "
          import sys
          sys.path.insert(0, '.')
          from src.pipelines.my_build_pipeline import MyBuildPipeline
          pipeline = MyBuildPipeline()
          result = pipeline.run()
          if not result.success:
              sys.exit(result.exit_code)
          "
        env:
          INPUT_BUILD_COMMAND: ${{ inputs.build-command || 'npm run build' }}
```

## 🔍 类型检查

```bash
# 安装 mypy
conda install -c conda-forge mypy

# 类型检查
mypy src/ --strict --ignore-missing-imports
```

## 🧪 测试

```bash
# 运行测试
pytest tests/
```

## 📚 更多信息

- [迁移状态](MIGRATION_STATUS.md)
- [迁移完成报告](MIGRATION_COMPLETE.md)
- [Python 迁移计划](../docs/python-migration-plan.md)

