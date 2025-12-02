# 文档目录

欢迎来到 GitHub Action Toolset 文档。

## 📚 快速导航

### 入门

- [安装指南](INSTALL.md) - 如何安装工具集
- [使用指南](USAGE.md) - 如何使用工具集
- [快速开始](guides/quickstart.md) - 5分钟快速上手

### 指南

- [AI 自我调试](guides/ai-self-debug.md) - AI 如何自动调试工作流
- [测试最佳实践](guides/testing-best-practices.md) - 测试相关的最佳实践
- [本地 CI 一致性](guides/local-ci-consistency.md) - 保持本地和 CI 环境一致

### 参考

- [工具脚本参考](reference/scripts.md) - 所有工具脚本的详细说明
- [模板参考](reference/templates.md) - 所有模板的详细说明
- [规则参考](reference/rules.md) - AI 规则的详细说明

### 示例

- [Node.js 项目](examples/nodejs.md) - Node.js 项目示例
- [Python 项目](examples/python.md) - Python 项目示例
- [多语言项目](examples/multilang.md) - 多语言项目示例

## 🎯 按场景查找

### 我想...

- **创建构建工作流** → [使用指南](USAGE.md#创建构建工作流)
- **调试失败的工作流** → [使用指南](USAGE.md#调试失败的工作流)
- **优化构建速度** → [指南：性能优化](guides/performance.md)
- **发布新版本** → [使用指南](USAGE.md#发布新版本)
- **自定义模板** → [使用指南](USAGE.md#自定义模板)

## 📖 文档结构

```
docs/
├── INSTALL.md              # 安装指南
├── USAGE.md                # 使用指南
├── guides/                 # 使用指南
│   ├── quickstart.md
│   ├── ai-self-debug.md
│   ├── testing-best-practices.md
│   └── local-ci-consistency.md
├── reference/              # 参考文档
│   ├── scripts.md
│   ├── templates.md
│   └── rules.md
└── examples/               # 示例
    ├── nodejs.md
    ├── python.md
    └── multilang.md
```

## 🔗 外部资源

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [GitHub CLI 文档](https://cli.github.com/manual/)
- [YAML 语法](https://yaml.org/)
- [工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## 💬 获取帮助

- 查看 [故障排除](INSTALL.md#故障排除)
- 提交 [Issue](https://github.com/firoyang/github-action-toolset/issues)
- 查看 [讨论区](https://github.com/firoyang/github-action-toolset/discussions)

## 🤝 贡献

欢迎贡献文档：

1. Fork 项目
2. 创建文档分支
3. 编写或改进文档
4. 提交 Pull Request

文档编写指南：
- 使用简洁明了的语言
- 提供实际可运行的示例
- 包含截图或动图（如果适用）
- 保持一致的格式和风格

