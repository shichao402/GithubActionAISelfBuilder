# Cursor Rules 目录说明

## 文件分类

### 共享规则（适用于父项目）

- **`rules.mdc`**: 核心规则，说明如何使用本项目创建 Pipeline 和生成工作流
- **`scripts-usage.mdc`**: 脚本使用规则，说明如何在父项目中使用共享脚本
- **`PARENT_PROJECT_USAGE.md`**: 父项目使用指南

### 项目特定规则（仅适用于本项目）

位于 `ProjectOnly/` 目录：
- **`project-development-rules.mdc`**: 项目开发规范
- **`testing-core-rules.mdc`**: 测试核心规则
- **`git-push-rule.mdc`**: Git 推送规范

## 规则冲突解决方案

由于本项目既要自己维护，又要作为子模块被父项目使用，存在规则冲突问题。

**解决方案**：父项目需要在 `.cursorignore` 文件中排除 `ProjectOnly/` 目录。

### 在父项目中使用

#### 方式 1: 手动配置（推荐）

1. 在父项目根目录创建 `.cursorignore` 文件
2. 添加以下内容（根据实际路径调整）：
   ```gitignore
   # 排除本项目特有的规则文件（ProjectOnly 目录）
   <本项目路径>/.cursor/rules/ProjectOnly/
   ```
3. 重启 Cursor 使配置生效

**示例**：
- 如果本项目作为 Git Submodule 在 `Tools/GithubActionAISelfBuilder` 目录下：
  ```gitignore
  Tools/GithubActionAISelfBuilder/.cursor/rules/ProjectOnly/
  ```

#### 方式 2: 使用注入脚本（自动化）

运行注入脚本自动配置：

```bash
cd <本项目路径>
ts-node scripts/inject-to-parent.ts <父项目路径>
```

脚本会自动：
- 复制共享规则文件到父项目
- 创建或更新父项目的 `.cursorignore` 文件
- 排除 `ProjectOnly/` 目录

### 路径调整

当本项目作为 Git Submodule 或依赖项被父项目使用时：

1. **导入路径**: 需要根据实际的项目结构调整
   ```typescript
   // 示例：如果作为 Git Submodule
   import { BasePipeline } from './GithubActionAISelfBuilder/src/base-pipeline';
   ```

2. **命令路径**: 需要指定本项目的路径
   ```bash
   cd GithubActionAISelfBuilder
   npm run scaffold -- --pipeline YourPipeline --output ../.github/workflows/your-pipeline.yml
   ```

3. **脚本路径**: 复制脚本后需要调整导入路径

### ProjectOnly 文件

- `ProjectOnly/` 目录下的所有文件**仅适用于本项目开发**
- 在父项目中使用时，通过 `.cursorignore` 排除这些文件
- 共享规则文件不得引用 ProjectOnly 的内容

## 规则文件结构

```
.cursor/rules/
├── rules.mdc                    # 共享：核心规则
├── scripts-usage.mdc            # 共享：脚本使用规则
├── README.md                    # 本文件
├── PARENT_PROJECT_USAGE.md      # 父项目使用指南
└── ProjectOnly/                 # 不共享：项目特定规则
    ├── project-development-rules.mdc
    ├── testing-core-rules.mdc
    └── git-push-rule.mdc
```

## 详细文档

更多信息请参考：
- **规则管理方案**: `docs/cursor-rules-management.md`
- **父项目使用指南**: `PARENT_PROJECT_USAGE.md`
- **注入脚本**: `scripts/inject-to-parent.ts`
- **Pipeline 验证脚本**: `scripts/test-pipelines.ts`（见 `scripts-usage.mdc`）

