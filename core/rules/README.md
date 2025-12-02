# AI 规则文件

这个目录包含教导 AI 助手如何处理 GitHub Actions 的规则文件。

## 📋 文件说明

### github-actions.mdc
GitHub Actions 工作流的基础规则和规范：
- 工作流文件管理
- 命名规范
- 最佳实践
- 常用 Actions
- 权限管理
- AI 助手行为要求

### debugging.mdc
GitHub Actions 调试规则和流程：
- 核心调试规则
- 标准调试流程
- 调试工具使用
- 常见问题排查
- 日志分析技巧
- 禁止的调试方式

### best-practices.mdc
GitHub Actions 最佳实践：
- 工作流组织
- 性能优化
- 安全实践
- 日志和调试
- 本地与 CI 一致性
- 文档和注释

## 🎯 使用方式

这些规则文件会被安装到目标项目的 `.cursor/rules/github-actions/` 目录：

```
目标项目/
└── .cursor/
    └── rules/
        └── github-actions/          # 工具集的规则文件
            ├── github-actions.mdc
            ├── debugging.mdc
            └── best-practices.mdc
```

## 📝 规则更新

当修改规则文件时：
1. 确保内容通用，不包含项目特定的配置
2. 保持简洁，删除过度复杂的内容
3. 提供清晰的示例和说明
4. 更新版本号（在 toolset.json）

