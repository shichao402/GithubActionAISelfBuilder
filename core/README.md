# Core - 核心可复用内容

这个目录包含工具集的核心内容，是可以复用到其他项目的部分。

## 📁 目录结构

```
core/
├── rules/          # AI 规则文件（.mdc）
├── scripts/        # 工具脚本（.py, .sh, .ps1）
└── templates/      # GitHub Actions 模板（.yml）
    ├── build/      # 构建相关模板
    ├── test/       # 测试相关模板
    ├── release/    # 发布相关模板
    └── deployment/ # 部署相关模板
```

## 🎯 用途

当用户将此工具集安装到新项目时，`core/` 目录下的内容会被复制到目标项目的相应位置：

- `core/rules/*.mdc` → `.cursor/rules/github-actions/`
- `core/scripts/*` → `scripts/toolsets/github-actions/`
- `core/templates/**/*.yml` → `.github/templates/`

## 📝 注意事项

- 只在此目录放置可以直接复用的内容
- 避免包含项目特定的配置
- 保持文件的通用性和可配置性


