# Cursor 规则管理方案

## 问题背景

本项目既要自己维护开发，又要作为子模块被其他项目使用。这就产生了规则冲突：

1. **本项目维护时**：需要启用所有规则（包括项目特有的规则）
2. **父项目使用时**：只需要共享规则，不应该启用项目特有的规则

## 解决方案

我们采用**多层次方案**来解决这个问题：

### 方案 1: 使用 `.cursorignore` 文件（推荐）

**适用场景**：父项目手动管理规则

**步骤**：

1. 在父项目根目录创建 `.cursorignore` 文件
2. 添加以下内容（根据实际路径调整）：

```gitignore
# 排除本项目特有的规则文件（ProjectOnly 目录）
# 将 <本项目路径> 替换为实际路径
<本项目路径>/.cursor/rules/ProjectOnly/
```

**示例**：
- 如果本项目作为 Git Submodule 在 `Tools/GithubActionAISelfBuilder` 目录下：
  ```gitignore
  Tools/GithubActionAISelfBuilder/.cursor/rules/ProjectOnly/
  ```

**优点**：
- ✅ 简单直接
- ✅ 父项目完全控制
- ✅ 不需要额外脚本

**缺点**：
- ⚠️ 需要手动创建和维护
- ⚠️ 路径需要手动调整

### 方案 2: 使用注入脚本（自动化）

**适用场景**：希望自动化处理规则文件

**步骤**：

1. 运行注入脚本：
   ```bash
   cd <本项目路径>
   ts-node scripts/inject-to-parent.ts <父项目路径>
   ```

2. 脚本会自动：
   - 复制共享规则文件到父项目的 `.cursor/rules/<本项目路径>/` 目录
   - 创建或更新父项目的 `.cursorignore` 文件，排除 `ProjectOnly/` 目录
   - 创建使用说明文件

**优点**：
- ✅ 自动化处理
- ✅ 减少手动错误
- ✅ 可以重复运行更新规则

**缺点**：
- ⚠️ 需要运行脚本
- ⚠️ 规则文件会复制到父项目（可能增加维护成本）

### 方案 3: 规则文件命名约定（备选）

**适用场景**：希望规则文件直接在本项目目录中生效

**步骤**：

1. 共享规则使用标准命名：`rules.mdc`, `scripts-usage.mdc`
2. 项目特有规则使用特殊前缀：`project-*.mdc` 或放在 `ProjectOnly/` 目录
3. 父项目通过 `.cursorignore` 排除 `ProjectOnly/` 目录

**优点**：
- ✅ 规则文件保持在本项目目录
- ✅ 不需要复制文件

**缺点**：
- ⚠️ 需要父项目配置 `.cursorignore`
- ⚠️ 路径可能较深

## 推荐方案

**推荐使用方案 1（.cursorignore）+ 方案 3（规则文件命名约定）的组合**：

1. **规则文件结构**：
   ```
   .cursor/rules/
   ├── rules.mdc                    # 共享：核心规则
   ├── scripts-usage.mdc            # 共享：脚本使用规则
   ├── README.md                    # 说明文件
   └── ProjectOnly/                 # 不共享：项目特定规则
       ├── project-development-rules.mdc
       ├── testing-core-rules.mdc
       └── git-push-rule.mdc
   ```

2. **父项目配置**：
   - 在父项目根目录创建 `.cursorignore` 文件
   - 添加排除规则：`<本项目路径>/.cursor/rules/ProjectOnly/`

3. **使用注入脚本（可选）**：
   - 首次设置时可以使用注入脚本自动配置
   - 后续可以手动维护

## 实施步骤

### 对于本项目（维护时）

1. 所有规则文件正常使用，包括 `ProjectOnly/` 目录下的规则
2. 不需要特殊配置

### 对于父项目（使用时）

#### 方式 A: 手动配置（推荐）

1. 在父项目根目录创建 `.cursorignore` 文件：
   ```bash
   touch .cursorignore
   ```

2. 添加排除规则（根据实际路径调整）：
   ```gitignore
   # 排除本项目特有的规则文件
   Tools/GithubActionAISelfBuilder/.cursor/rules/ProjectOnly/
   ```

3. 重启 Cursor 使配置生效

#### 方式 B: 使用注入脚本

1. 运行注入脚本：
   ```bash
   cd Tools/GithubActionAISelfBuilder
   ts-node scripts/inject-to-parent.ts ..
   ```

2. 检查生成的 `.cursorignore` 文件

3. 重启 Cursor 使配置生效

## 验证规则是否正确应用

1. **检查规则是否加载**：
   - 在 Cursor 中查看规则列表
   - 应该能看到共享规则（`rules.mdc`, `scripts-usage.mdc`）
   - 不应该看到 `ProjectOnly/` 目录下的规则

2. **测试规则是否生效**：
   - 尝试使用共享规则中的功能（如创建 Pipeline）
   - 验证项目特有规则不会干扰（如 Git 推送规范）

## 常见问题

### Q1: Cursor 仍然加载了 ProjectOnly 目录下的规则

**解决方案**：
1. 检查 `.cursorignore` 文件路径是否正确
2. 确保路径使用正斜杠 `/`（跨平台兼容）
3. 重启 Cursor
4. 检查 Cursor 的规则加载日志

### Q2: 规则文件路径太深，不方便管理

**解决方案**：
1. 使用注入脚本将规则文件复制到父项目的 `.cursor/rules/` 目录
2. 在父项目的 `.cursorignore` 中排除子项目的 `ProjectOnly/` 目录

### Q3: 如何更新规则文件？

**解决方案**：
1. **如果使用方案 1**：手动更新子项目中的规则文件，父项目的 `.cursorignore` 会自动排除 `ProjectOnly/`
2. **如果使用方案 2**：重新运行注入脚本更新规则文件

## 相关文件

- `.cursorignore.example` - `.cursorignore` 文件模板
- `scripts/inject-to-parent.ts` - 注入脚本
- `.cursor/rules/README.md` - 规则文件说明


