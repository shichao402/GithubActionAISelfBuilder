# 工具脚本目录

此目录包含 Python 工具脚本，用于 Pipeline 开发、测试和调试。

## 目录结构

```
scripts/tools/
├── run_pipeline.py          # 本地运行 Pipeline
├── test_pipelines.py        # Pipeline 验证和调试
├── ai_debug_workflow.py     # AI 调试工作流
└── README.md                # 本文件
```

## 脚本说明

### 1. run_pipeline.py

**功能**: 在本地运行 Pipeline，用于测试和调试。

**使用方式**:
```bash
# 从项目根目录运行
python scripts/tools/run_pipeline.py BuildPipeline

# 带输入参数
python scripts/tools/run_pipeline.py BuildPipeline --input-name "value"
```

**示例**:
```bash
python scripts/tools/run_pipeline.py FlutterBuildPipeline
```

### 2. test_pipelines.py

**功能**: 验证和调试 Pipeline，包括生成 workflow、验证、触发测试和监控执行。

**使用方式**:
```bash
# 测试单个 Pipeline 并触发在线测试
python scripts/tools/test_pipelines.py --pipeline FlutterBuildPipeline --trigger --watch

# 测试所有 Pipeline 并触发在线测试
python scripts/tools/test_pipelines.py --all --trigger --watch

# 仅验证生成的 workflow 文件
python scripts/tools/test_pipelines.py --all --verify

# 清理并重新生成所有 workflow
python scripts/tools/test_pipelines.py --all --clean --verify
```

**选项**:
- `--pipeline <name>`: 指定要测试的 Pipeline 类名（可多次指定）
- `--all`: 测试所有 Pipeline
- `--trigger`: 触发 workflow 进行在线测试
- `--watch`: 监控 workflow 执行状态
- `--clean`: 删除旧的 workflow 文件
- `--verify`: 仅验证生成的 workflow 文件，不触发测试

### 3. ai_debug_workflow.py

**功能**: AI 自我调试 GitHub Actions 工作流，自动触发、监控、收集日志并分析错误。

**使用方式**:
```bash
# 基本用法（无 inputs）
python scripts/tools/ai_debug_workflow.py .github/workflows/build.yml main

# 带 inputs 的用法
python scripts/tools/ai_debug_workflow.py .github/workflows/release.yml main -f version=1.0.0 -f release-notes="Release notes"
```

**功能**:
- 自动触发 GitHub Action 工作流
- 实时监控工作流执行状态
- 失败时自动收集详细错误日志
- 分析日志并提供修正建议

## 路径说明

所有脚本都支持从项目根目录运行，会自动检测路径：
- 脚本位置: `scripts/tools/`
- 项目根目录: `scripts/tools/` 的父目录的父目录
- Python 源码: `python/src/`

## 依赖要求

- Python 3.11+
- Conda 环境: `github-action-builder`
- GitHub CLI (用于 `ai_debug_workflow.py` 和 `test_pipelines.py`)

## 注意事项

1. **环境激活**: 运行前需要激活 Conda 环境
   ```bash
   conda activate github-action-builder
   ```

2. **GitHub CLI**: `ai_debug_workflow.py` 和 `test_pipelines.py` 需要 GitHub CLI 已安装并登录
   ```bash
   gh auth login
   ```

3. **在线测试**: 在线 workflow 测试需要先推送代码到远程仓库

## 相关文档

- **项目文档**: `README.md`（项目根目录）
- **使用指南**: `docs/USAGE_GUIDE.md`
- **脚本使用规则**: `.cursor/rules/scripts-usage.mdc`


