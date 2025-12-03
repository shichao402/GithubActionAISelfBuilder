# Core - 核心可复用内容

这个目录包含工具集的核心内容，是可以复用到其他项目的部分。

## 📁 目录结构

```
core/
├── rules/          # AI 规则文件（.mdc）
└── tools/          # 工具源码
    └── go/         # Go 调试工具源码
```

## 🎯 用途

当用户将此工具集安装到新项目时，需要手动复制 `core/` 目录下的内容到目标项目的相应位置：

- `core/rules/*.mdc` → `.cursor/rules/github-actions/`
- `core/tools/go/dist/gh-action-debug-*` → `scripts/toolsets/github-actions/gh-action-debug`

详细安装步骤请参考 `docs/INSTALL.md`。

## 📝 注意事项

- 只在此目录放置可以直接复用的内容
- 避免包含项目特定的配置
- 保持文件的通用性和可配置性


