# GitHub Action AI 工具集

> 一套 GitHub Actions 规则 + 工具集合，让 AI 自动遵循最佳实践

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/firoyang/github-action-toolset)

## 🎯 这是什么

**这不是框架，是规则 + 工具的集合。**

当你厌倦了重复教 AI 如何构建和调试 GitHub Actions 时：
- ✅ AI 自动遵循 GitHub Actions 最佳实践
- ✅ 提供开箱即用的 Workflow 模板
- ✅ 一键调试失败的工作流
- ✅ 本地构建和 CI 保持一致

## ✨ 核心特性

### 1. AI 规则文件 (`.mdc`)

三个规则文件教会 AI 如何处理 GitHub Actions：

- `github-actions.mdc` - 基础规则和最佳实践
- `debugging.mdc` - 工作流调试标准流程
- `best-practices.mdc` - 性能优化和安全实践

**效果**：安装后，AI 会自动正确处理 GitHub Actions，无需重复提醒。

### 2. 调试工具 (`gh-action-debug`)

Go 编写的 GitHub Actions 调试工具：

- **单一可执行文件** - 无需依赖，跨平台
- **一个命令完成所有** - 触发 + 监控 + 日志 + 分析 + 建议
- **JSON 输出** - AI 友好
- **智能错误分析** - 12+ 种常见错误模式
- **性能优异** - 比 Python 快 10-100x

**效果**：AI 只需一个命令，立即得到结构化的错误和修复建议。

### 3. Workflow 模板库

常用的 GitHub Actions 工作流模板：

- **构建** - Node.js, Python, Flutter
- **测试** - pytest
- **发布** - GitHub Release, npm
- **部署** - Docker

### 4. 本地构建脚本

与 CI 保持一致的本地构建脚本：

- `flutter-build.sh` - Flutter 多平台构建

## 🚀 快速开始

### 安装

```bash
# 克隆工具集到你的项目
git submodule add https://github.com/firoyang/github-action-toolset .toolsets/github-actions

# 安装（会复制规则、模板，构建 Go 工具）
bash .toolsets/github-actions/core/scripts/install.sh
```

安装后你会得到：
- ✅ AI 规则文件 → `core/rules/*.mdc`
- ✅ Go 调试工具 → `scripts/toolsets/github-actions/gh-action-debug`
- ✅ Workflow 模板 → `core/templates/`

### 使用

#### 1. 创建工作流

```bash
# 复制模板
cp core/templates/build/flutter-build.yml .github/workflows/build.yml

# 根据需求自定义
vim .github/workflows/build.yml
```

#### 2. 推送并调试

```bash
# 推送代码
git add .github/workflows/build.yml
git commit -m "Add build workflow"
git push

# 自动调试（推荐 JSON 输出）
gh-action-debug workflow debug .github/workflows/build.yml main --output json

# 带参数触发
gh-action-debug workflow debug .github/workflows/build.yml main \
  --input platform=android \
  --output json
```

#### 3. 让 AI 帮你

安装后，直接告诉 AI：

```
"帮我创建一个 Flutter 构建工作流"
"调试失败的 build.yml"
"优化构建速度"
```

AI 会自动：
1. 使用模板
2. 遵循最佳实践
3. 使用 gh-action-debug 调试
4. 提供修复建议

## 📁 项目结构

```
.
├── core/                      # 核心可复用资源
│   ├── rules/                 # AI 规则文件 (*.mdc)
│   │   ├── github-actions.mdc
│   │   ├── debugging.mdc
│   │   └── best-practices.mdc
│   ├── templates/             # Workflow 模板
│   │   ├── build/
│   │   ├── test/
│   │   ├── release/
│   │   └── deployment/
│   ├── scripts/               # 安装脚本
│   │   └── install.sh
│   └── tools/                 # 工具源码
│       └── go/                # gh-action-debug 源码
├── scripts/                   # 本地构建脚本
│   └── flutter-build.sh
├── docs/                      # 文档
│   ├── INSTALL.md
│   ├── USAGE.md
│   └── guides/
└── README.md
```

## 🔧 工具命令

### gh-action-debug

```bash
# 完整调试（触发 + 监控 + 分析 + 建议）
gh-action-debug workflow debug <workflow-file> <ref> --output json

# 列出所有工作流
gh-action-debug workflow list

# 手动触发
gh-action-debug workflow trigger <workflow-file> <ref>

# 带输入参数
gh-action-debug workflow debug <workflow-file> <ref> \
  --input key=value \
  --output json

# 查看版本
gh-action-debug version
```

### 本地构建

```bash
# Flutter 构建
bash scripts/flutter-build.sh --platform android --mode release

# 查看帮助
bash scripts/flutter-build.sh --help
```

## 📚 文档

- [安装指南](docs/INSTALL.md) - 详细安装说明
- [使用指南](docs/USAGE.md) - 完整使用文档
- [快速开始](docs/guides/quickstart.md) - 5 分钟上手
- [AI 自我调试](docs/guides/ai-self-debug.md) - AI 调试流程
- [Go 工具文档](core/tools/go/README.md) - gh-action-debug 详细说明

## 💡 AI 集成示例

安装后，AI 会自动遵循规则：

**你说**：
```
"帮我创建一个 Flutter 构建工作流，支持 Android 和 iOS"
```

**AI 会**：
1. ✅ 复制 `core/templates/build/flutter-build.yml`
2. ✅ 自定义配置（平台、版本等）
3. ✅ 推送代码到远程
4. ✅ 运行 `gh-action-debug workflow debug ...`
5. ✅ 分析结果，如有错误则修复
6. ✅ 重新测试直到通过

**AI 不会**：
- ❌ 从头编写工作流
- ❌ 手动运行 `gh workflow run`
- ❌ 不推送代码就测试
- ❌ 猜测错误而不查看日志

## 🛠 开发与贡献

### 构建 Go 工具

```bash
cd core/tools/go

# 构建当前平台
make build

# 构建所有平台
make build-all

# 运行测试
make test

# 安装到 GOPATH
make install
```

### 添加新模板

```bash
# 1. 在 core/templates/ 下创建模板
vim core/templates/build/my-template.yml

# 2. 更新 core/templates/README.md
vim core/templates/README.md

# 3. 测试模板
cp core/templates/build/my-template.yml .github/workflows/test.yml
gh-action-debug workflow debug .github/workflows/test.yml main --output json
```

### 添加新规则

```bash
# 1. 在 core/rules/ 下创建规则文件
vim core/rules/my-rule.mdc

# 2. 更新 core/rules/README.md
vim core/rules/README.md
```

## 🌟 最佳实践

1. **从模板开始** - 不要从头编写工作流
2. **本地先测** - 本地构建通过后再推送
3. **使用工具** - 用 gh-action-debug 而不是手动命令
4. **增量优化** - 先跑通，再优化

## 📊 工具对比

| 特性 | gh-action-debug (Go) | 手动 gh CLI |
|------|---------------------|-------------|
| 一键完成 | ✅ | ❌ |
| JSON 输出 | ✅ | ❌ |
| 错误分析 | ✅ 12+ 模式 | ❌ |
| 修复建议 | ✅ | ❌ |
| AI 友好 | ✅ | ❌ |
| 性能 | ✅ 快 | ⚠️ 慢 |

## 📝 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 🙏 致谢

- [GitHub Actions](https://github.com/features/actions)
- [GitHub CLI](https://cli.github.com/)
- [Cobra](https://github.com/spf13/cobra) - Go CLI 框架
- [Viper](https://github.com/spf13/viper) - Go 配置管理

## 🔗 相关链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub CLI 文档](https://cli.github.com/manual/)
- [Workflow 语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

---

**享受 AI 自动化调试的便利！** 🎉
