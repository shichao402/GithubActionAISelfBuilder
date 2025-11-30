# Config 目录

本目录包含配置文件模板和项目特定配置。

## 目录结构

```
config/
├── config.example.yaml      # 配置文件模板（供父项目使用）
└── ProjectOnly/             # 本项目特定配置
    ├── config.yaml          # 本项目维护配置
    └── README.md            # 配置说明
```

## 配置文件说明

### config.example.yaml

**用途**: 配置文件模板，供父项目使用

**使用方式**:
1. 父项目将此文件复制到项目根目录，命名为 `config.yaml`
2. 根据实际需求修改配置项
3. `config.yaml` 会被 `.gitignore` 忽略，不会提交到仓库

**注意**:
- 此文件用于父项目，不是本项目
- 如果本项目作为子项目（Git Submodule），在父项目根目录创建 `config.yaml`
- 脚手架工具会自动检测项目类型并加载相应的配置

### ProjectOnly/config.yaml

**用途**: 本项目特定的配置文件

**使用场景**:
- 本项目维护时使用此配置
- 指定包含 `ProjectOnly/` 目录下的 Pipeline
- 生成测试用的 workflow 文件

**关键配置**:
- `pipelines.include_project_only: true` - 允许脚手架工具扫描 ProjectOnly 目录

## 配置加载机制

脚手架工具会按以下优先级加载配置：

1. **如果指定了配置文件路径**：直接使用指定的配置文件
2. **如果是本项目**（存在 `config/ProjectOnly/config.yaml`）：优先使用 `config/ProjectOnly/config.yaml`
3. **如果是父项目**（不存在 `config/ProjectOnly/config.yaml`）：使用根目录的 `config.yaml`

**注意**：
- 对于本项目，会直接使用 `config/ProjectOnly/config.yaml`，不会加载根目录的 `config.yaml`
- 对于父项目，需要在根目录创建 `config.yaml`（参考 `config/config.example.yaml`）

## 相关文档

- **配置方案说明**: `docs/config-projectonly.md`
- **ProjectOnly 配置**: `config/ProjectOnly/README.md`
- **Pipeline 组织**: `src/pipelines/README.md`

