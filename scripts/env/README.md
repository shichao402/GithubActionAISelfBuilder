# 环境脚本目录

此目录包含环境相关的脚本，主要用于 Python 环境的安装和管理。

## 目录结构

```
scripts/env/
└── install/
    ├── install.sh      # Bash 环境安装脚本（Linux/macOS）
    └── install.ps1     # PowerShell 环境安装脚本（Windows）
```

## 使用方式

### Linux/macOS

```bash
# 从项目根目录运行
bash scripts/env/install/install.sh
# 或
./scripts/env/install/install.sh
```

### Windows

```powershell
# 从项目根目录运行
.\scripts\env\install\install.ps1
```

## 功能说明

### install.sh / install.ps1

**功能**：
- 检查 Conda 是否安装
- 使用 `python/environment.yml` 创建/更新 Conda 环境
- 环境名称：`github-action-builder`

**要求**：
- 必须安装 Conda（Miniconda 或 Anaconda）
- 需要 `python/environment.yml` 文件存在

**使用场景**：
- 首次安装项目环境
- 更新环境依赖
- 重新创建环境

## 注意事项

1. **Conda 要求**：本项目严格要求使用 Conda 进行环境管理，确保一致性
2. **路径自动检测**：脚本会自动检测项目根目录和 `python/environment.yml` 文件
3. **环境名称**：固定为 `github-action-builder`，与 `python/environment.yml` 中定义的一致

## 相关文件

- `python/environment.yml` - Conda 环境配置文件
- `python/INSTALL.md` - 详细安装文档

