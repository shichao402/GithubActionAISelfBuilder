# Scripts 目录说明

本目录包含两类脚本：

## 📦 共享脚本（提供给其他项目使用）

这些脚本可以作为子项目提供给其他项目使用：

- **`push-git.ts`**, **`push-git.ps1`**, **`push-git.sh`** - 一键 Git 推送脚本（跨平台）
- **`README-push-git.md`** - Git 推送脚本使用文档
- **`install-nodejs.ps1`** - Node.js 安装脚本（Windows）

## 🧪 测试脚本（仅本项目使用）

这些脚本仅用于测试本项目，位于 `scripts/test/` 目录：

- **`test-flutter-pipeline.ts`** - 本地测试 Flutter 构建流水线
- **`ai-debug-workflow.ts`** - AI 自我调试 GitHub Actions 工作流

### 使用方法

```bash
# 测试 Flutter Pipeline
npm run test:flutter

# AI 调试工作流
npm run ai-debug -- .github/workflows/flutter-build.yml main
```

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

