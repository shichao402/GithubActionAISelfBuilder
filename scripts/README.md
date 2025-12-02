# Scripts 目录

此目录包含项目使用的各种脚本工具。

## 目录结构

```
scripts/
├── env/                    # 环境相关脚本
│   ├── install/           # 环境安装脚本
│   │   ├── install.sh     # Bash 安装脚本（Linux/macOS）
│   │   └── install.ps1    # PowerShell 安装脚本（Windows）
│   └── README.md          # 环境脚本说明文档
│
├── tools/                 # Python 工具脚本
│   ├── run_pipeline.py    # 本地运行 Pipeline
│   ├── test_pipelines.py  # Pipeline 验证和调试
│   ├── ai_debug_workflow.py  # AI 调试工作流
│   └── README.md          # 工具脚本说明文档
│
├── ProjectOnly/            # 项目特有的脚本（不共享）
│   ├── push-git.sh        # Git 推送脚本（Bash）
│   ├── push-git.ps1       # Git 推送脚本（PowerShell）
│   └── README-push-git.md # Git 推送脚本说明
│
└── README.md              # 本文件
```

## 环境安装脚本

### 位置
`scripts/env/install/`

### 使用方式

**Linux/macOS**:
```bash
bash scripts/env/install/install.sh
# 或
./scripts/env/install/install.sh
```

**Windows**:
```powershell
.\scripts\env\install\install.ps1
```

### 功能
- 检查 Conda 是否安装
- 使用 `python/environment.yml` 创建/更新 Conda 环境
- 环境名称：`github-action-builder`

详细说明请参考：`scripts/env/README.md`

## Python 工具脚本

### 位置
`scripts/tools/`

### 主要脚本

1. **run_pipeline.py** - 本地运行 Pipeline
   ```bash
   python scripts/tools/run_pipeline.py BuildPipeline
   ```

2. **test_pipelines.py** - Pipeline 验证和调试
   ```bash
   python scripts/tools/test_pipelines.py --all --verify
   ```

3. **ai_debug_workflow.py** - AI 调试工作流
   ```bash
   python scripts/tools/ai_debug_workflow.py .github/workflows/build.yml main
   ```

详细说明请参考：`scripts/tools/README.md`

## 项目特有脚本

### Git 推送脚本

**位置**: `scripts/ProjectOnly/`

**说明**: 这些脚本是项目特有的，用于自动化 Git 推送流程。

详细说明请参考：`scripts/ProjectOnly/README-push-git.md`

## 注意事项

1. **环境脚本**: 环境安装脚本位于 `scripts/env/install/` 目录
2. **工具脚本**: Python 工具脚本位于 `scripts/tools/` 目录，支持从项目根目录运行
3. **项目特有脚本**: `ProjectOnly/` 目录下的脚本仅用于本项目开发，不会共享给父项目
4. **路径**: 所有脚本都支持从项目根目录运行，会自动检测路径

## 相关文档

- **环境脚本**: `scripts/env/README.md`
- **工具脚本**: `scripts/tools/README.md`
- **Git 推送脚本**: `scripts/ProjectOnly/README-push-git.md`
- **脚本使用规则**: `.cursor/rules/scripts-usage.mdc`
