# Scripts 目录说明

本目录包含两类脚本：

## 📦 共享脚本（提供给其他项目使用）

这些脚本可以作为子项目提供给其他项目使用：

- **`push-git.ts`**, **`push-git.ps1`**, **`push-git.sh`** - 一键 Git 推送脚本（跨平台）
- **`README-push-git.md`** - Git 推送脚本使用文档
- **`install-nodejs.ps1`** - Node.js 安装脚本（Windows）

## 🧪 测试脚本目录

位于 `scripts/test/` 目录：

- **`test-flutter-pipeline.ts`** - 本地测试 Flutter 构建流水线（仅本项目使用）
- **`ai-debug-workflow.ts`** - AI 自我调试 GitHub Actions 工作流（**可共享给其他项目使用**）

### 使用方法

```bash
# 测试 Flutter Pipeline（仅本项目）
npm run test:flutter

# AI 调试工作流（可共享）
npm run ai-debug -- .github/workflows/flutter-build.yml main
```

### AI 调试脚本（共享工具）

`ai-debug-workflow.ts` 虽然位于 `test/` 目录，但它是一个通用的调试工具，**可以共享给其他项目使用**。

**在父项目中使用**:
```bash
# 作为子模块使用
ts-node GithubActionAISelfBuilder/scripts/test/ai-debug-workflow.ts .github/workflows/build.yml main

# 或创建 npm 脚本
npm run ai-debug -- .github/workflows/build.yml main
```

**详细使用规则**: 请参考 `scripts/.cursor/rules/scripts-usage.mdc`

## 📁 目录结构

```
scripts/
├── README.md                    # 本文件
├── push-git.ts                 # Git 推送脚本（TypeScript，跨平台）
├── push-git.ps1                # Git 推送脚本（PowerShell，Windows）
├── push-git.sh                  # Git 推送脚本（Shell，Linux/Mac）
├── README-push-git.md          # Git 推送脚本文档
├── install-nodejs.ps1          # Node.js 安装脚本
└── test/                       # 测试脚本目录（仅本项目使用）
    ├── test-flutter-pipeline.ts
    └── ai-debug-workflow.ts
```

