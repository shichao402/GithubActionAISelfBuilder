# Actions 目录

本目录原本用于存放可复用的 GitHub Actions，但现在已经**不再使用**。

## 历史说明

**注意**：所有 Action 都已被移除或替代：

- **`build-action`** 和 **`release-action`**：已被移除，现在使用 **Pipeline 继承**方案实现可复用逻辑
  - 构建逻辑：使用 `BuildPipeline` 基类和继承它的 Pipeline（如 `FlutterBuildPipeline`）
  - 发布逻辑：使用 `ReleaseBasePipeline` 基类和继承它的 Pipeline（如 `ReleasePipeline`）

- **`debug-action`**：已被移除，功能由 `scripts/ai-debug-workflow.ts` 脚本替代
  - 使用方式：`npm run ai-debug -- <workflow-file> [ref]`
  - 详细说明：参考 `docs/ai-self-debug.md` 和 `.cursor/rules/scripts-usage.mdc`

## 当前状态

**此目录已清空，保留仅用于历史记录。**

如果需要创建新的 Action，建议：
1. 使用 Pipeline 继承方案（推荐）
2. 或创建独立的脚本（如 `scripts/` 目录下的脚本）

