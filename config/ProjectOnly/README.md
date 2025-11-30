# ProjectOnly 配置目录

本目录包含本项目特定的配置文件。

## 配置文件

### config.yaml

**用途**: 指定本项目维护时需要的配置

**关键配置**:
- `pipelines.include_project_only: true` - 允许脚手架工具扫描 ProjectOnly 目录下的 Pipeline

**使用场景**:
- 本项目维护时使用此配置
- 生成测试用的 workflow 文件
- 使用测试用的 Pipeline（如 `FlutterBuildPipeline`, `ReleasePipeline`, `VersionBumpPipeline`）

## 配置加载机制

脚手架工具会按以下优先级加载配置：

1. **如果指定了配置文件路径**：直接使用指定的配置文件
2. **如果是本项目**（存在 `config/ProjectOnly/config.yaml`）：优先使用 `config/ProjectOnly/config.yaml`
3. **如果是父项目**（不存在 `config/ProjectOnly/config.yaml`）：使用根目录的 `config.yaml`

**注意**：对于本项目，会直接使用 `config/ProjectOnly/config.yaml`，不会加载根目录的 `config.yaml`。

## 父项目使用

**重要**: 父项目**不需要**此配置文件。

- 父项目在根目录创建 `config.yaml`（参考 `config/config.example.yaml`）
- `include_project_only` 默认为 `false` 或不设置
- ProjectOnly 目录会被自动排除

## 相关文档

- **配置方案说明**: `docs/config-projectonly.md`
- **Pipeline 组织**: `src/pipelines/README.md`
- **ProjectOnly Pipeline**: `src/pipelines/ProjectOnly/README.md`

