# Cursor 规则快速配置指南

## 问题

本项目既要自己维护，又要作为子模块被父项目使用。规则冲突：
- ✅ **本项目开发时**：需要所有规则（包括 ProjectOnly）
- ❌ **父项目使用时**：只需要共享规则，不需要 ProjectOnly

## 解决方案（3 步）

### 步骤 1: 在父项目根目录创建 `.cursorignore` 文件

```bash
touch .cursorignore
```

### 步骤 2: 添加排除规则

根据实际路径调整（将 `<本项目路径>` 替换为实际路径）：

```gitignore
# 排除本项目特有的规则文件（ProjectOnly 目录）
<本项目路径>/.cursor/rules/ProjectOnly/
```

**示例**：
- 如果本项目在 `Tools/GithubActionAISelfBuilder`：
  ```gitignore
  Tools/GithubActionAISelfBuilder/.cursor/rules/ProjectOnly/
  ```

### 步骤 3: 重启 Cursor

重启 Cursor 使配置生效。

## 自动化方式（可选）

使用注入脚本自动配置：

```bash
cd <本项目路径>
npm run inject <父项目路径>
```

脚本会自动：
- 复制共享规则文件
- 创建/更新 `.cursorignore` 文件
- 排除 ProjectOnly 目录

## 验证

1. 在 Cursor 中查看规则列表
2. 应该看到共享规则（`rules.mdc`, `scripts-usage.mdc`）
3. 不应该看到 `ProjectOnly/` 目录下的规则

## 更多信息

- 详细文档：`docs/cursor-rules-management.md`
- 规则说明：`.cursor/rules/README.md`


