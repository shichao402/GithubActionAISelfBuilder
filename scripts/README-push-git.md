# 一键推送 Git 脚本使用说明

为了方便持续测试 GitHub Actions，项目提供了多个一键推送 Git 的脚本。

## 📋 可用脚本

### 1. TypeScript 脚本（推荐，跨平台）

**文件：** `scripts/push-git.ts`

**使用方法：**
```bash
# 使用默认提交信息
npm run push

# 使用自定义提交信息
npm run push "fix: update test workflow"

# 或直接使用 ts-node
ts-node scripts/push-git.ts "feat: add new feature"
```

### 2. PowerShell 脚本（Windows）

**文件：** `scripts/push-git.ps1`

**使用方法：**
```powershell
# 使用默认提交信息
.\scripts\push-git.ps1

# 使用自定义提交信息
.\scripts\push-git.ps1 "fix: update test workflow"
```

### 3. Shell 脚本（Linux/Mac）

**文件：** `scripts/push-git.sh`

**使用方法：**
```bash
# 确保脚本有执行权限（首次使用）
chmod +x scripts/push-git.sh

# 使用默认提交信息
./scripts/push-git.sh

# 使用自定义提交信息
./scripts/push-git.sh "fix: update test workflow"
```

## 🚀 功能特性

- ✅ **自动检测更改**：如果没有未提交的更改，会提示并退出
- ✅ **显示状态**：推送前会显示当前的 Git 状态
- ✅ **智能提交信息**：如果不提供提交信息，会自动生成带时间戳的默认信息
- ✅ **错误处理**：如果推送失败，会提供有用的提示信息
- ✅ **安全检查**：检查远程仓库配置，避免不必要的错误

## 📝 默认提交信息格式

如果不提供提交信息，脚本会自动生成：

```
chore: update for testing GitHub Actions [2024-01-15 14:30:25]
```

## ⚠️ 注意事项

1. **首次推送新分支**：如果当前分支在远程不存在，推送可能会失败。此时可以运行：
   ```bash
   git push -u origin <分支名>
   ```

2. **权限问题**（Shell 脚本）：
   - Linux/Mac: 确保脚本有执行权限：`chmod +x scripts/push-git.sh`
   - Windows: 如果使用 Git Bash，也需要设置执行权限

3. **PowerShell 执行策略**（Windows）：
   如果遇到执行策略限制，可以运行：
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## 💡 使用场景

### 场景 1：快速测试 GitHub Actions

```bash
# 修改代码后，一键推送测试
npm run push "test: trigger workflow"
```

### 场景 2：持续集成测试

```bash
# 在 CI 脚本中使用
npm run push "ci: auto update"
```

### 场景 3：开发过程中的快速提交

```bash
# 使用默认提交信息
npm run push
```

## 🔧 自定义配置

如果需要修改默认行为，可以编辑对应的脚本文件：

- **TypeScript**: `scripts/push-git.ts`
- **PowerShell**: `scripts/push-git.ps1`
- **Shell**: `scripts/push-git.sh`

## 📊 脚本执行流程

```
1. 检查是否有未提交的更改
   ↓
2. 显示当前 Git 状态
   ↓
3. 获取提交信息（使用提供的或生成默认的）
   ↓
4. 添加所有更改 (git add -A)
   ↓
5. 提交更改 (git commit)
   ↓
6. 检查远程仓库配置
   ↓
7. 推送到远程仓库 (git push)
   ↓
8. 完成！
```

## 🐛 故障排除

### 问题 1：推送失败，提示远程分支不存在

**解决方案：**
```bash
git push -u origin <当前分支名>
```

### 问题 2：PowerShell 脚本无法执行

**解决方案：**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 问题 3：Shell 脚本提示权限不足

**解决方案：**
```bash
chmod +x scripts/push-git.sh
```

### 问题 4：没有配置远程仓库

**解决方案：**
```bash
git remote add origin <远程仓库URL>
```

## 📚 相关文档

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

