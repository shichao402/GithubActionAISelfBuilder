# Scripts 目录说明

## 📁 目录结构

```
scripts/
├── README.md                    # 本文件
├── README-push-git.md          # Git 推送脚本文档
├── install-nodejs.ps1          # Node.js 安装脚本（可共享）
└── ProjectOnly/                # 本项目特有的脚本（不共享）
    ├── push-git.ts             # Git 推送脚本（TypeScript，跨平台）
    ├── push-git.ps1            # Git 推送脚本（PowerShell，Windows）
    ├── push-git.sh             # Git 推送脚本（Shell，Linux/Mac）
    └── test-flutter-pipeline.ts # 测试 Flutter Pipeline（仅本项目）
├── ai-debug-workflow.ts        # AI 调试工作流（可共享）
```

## 🚨 重要说明：ProjectOnly 目录

**`ProjectOnly/` 目录下的所有文件都是本项目特有的**，不会自动共享给父项目。

### 为什么使用 ProjectOnly？

- **明确区分**: 清楚标识哪些是本项目特有的，哪些可以共享
- **避免混淆**: 防止父项目误用本项目特有的脚本
- **灵活共享**: 需要共享的脚本可以复制到父项目，而不是直接引用

## 📦 脚本分类

### 1. 本项目特有脚本（ProjectOnly）

位于 `scripts/ProjectOnly/` 目录：

- **`push-git.ts`**, **`push-git.ps1`**, **`push-git.sh`** - Git 推送脚本（本项目使用）
- **`test-flutter-pipeline.ts`** - 测试 Flutter Pipeline（仅本项目）

### 2. 可共享脚本

位于 `scripts/` 根目录：

- **`install-nodejs.ps1`** - Node.js 安装脚本（可共享）
- **`ai-debug-workflow.ts`** - AI 调试工作流（可共享）
- **`test-pipelines.ts`** - Pipeline 验证和调试脚本（可共享）

**在父项目中使用**:
```bash
# 方式 1: 直接使用（如果作为 Git Submodule）
npm run ai-debug -- .github/workflows/build.yml main
npm run test:pipelines -- --pipeline YourPipeline --trigger

# 方式 2: 复制到父项目
cp GithubActionAISelfBuilder/scripts/ai-debug-workflow.ts scripts/
cp GithubActionAISelfBuilder/scripts/test-pipelines.ts scripts/
```

## 🧪 使用方法

```bash
# Pipeline 验证和调试（可共享）
npm run test:pipelines -- --pipeline YourPipeline --trigger --watch
npm run test:pipelines -- --all --clean --verify

# AI 调试工作流（可共享）
npm run ai-debug -- .github/workflows/flutter-build.yml main

# 测试 Flutter Pipeline（仅本项目）
npm run test:flutter

# Git 推送（本项目）
npm run push "提交信息"
```

## 📚 详细使用规则

**共享脚本使用规则**: 请参考 `.cursor/rules/scripts-usage.mdc`（共享给父项目）

**本项目特有规则**: 请参考 `.cursor/rules/ProjectOnly/` 目录下的规则文件

