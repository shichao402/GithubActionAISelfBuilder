# Windows 安装 Node.js/npm 指南

## 方法 1: 官方安装包（推荐）

### 步骤

1. **下载 Node.js**
   - 访问：https://nodejs.org/
   - 下载 LTS 版本（推荐 18.x 或 20.x）
   - 选择 Windows Installer (.msi)

2. **安装**
   - 运行下载的 .msi 文件
   - 按照安装向导完成安装
   - 确保勾选 "Add to PATH" 选项

3. **验证安装**
   ```powershell
   node --version
   npm --version
   ```

## 方法 2: 使用 Chocolatey（如果已安装）

```powershell
# 以管理员身份运行 PowerShell
choco install nodejs-lts
```

## 方法 3: 使用 Scoop（如果已安装）

```powershell
scoop install nodejs-lts
```

## 方法 4: 使用 nvm-windows（推荐用于多版本管理）

### 安装 nvm-windows

1. **下载 nvm-windows**
   - 访问：https://github.com/coreybutler/nvm-windows/releases
   - 下载 `nvm-setup.exe`

2. **安装 nvm-windows**
   - 运行 `nvm-setup.exe`
   - 按照安装向导完成安装

3. **安装 Node.js**
   ```powershell
   # 以管理员身份运行 PowerShell
   nvm install 18
   nvm use 18
   ```

4. **验证安装**
   ```powershell
   node --version
   npm --version
   ```

## 推荐方案

**对于你的情况，推荐使用方法 1（官方安装包）**：
- ✅ 最简单直接
- ✅ 不需要额外工具
- ✅ 自动配置 PATH

## 安装后验证

```powershell
# 检查 Node.js 版本（需要 18+）
node --version

# 检查 npm 版本
npm --version

# 检查 npm 配置
npm config list
```

## 如果遇到问题

### PATH 未配置

如果安装后仍然无法识别 `node` 命令：

1. **手动添加到 PATH**：
   - 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
   - 在"系统变量"中找到 `Path`，点击"编辑"
   - 添加 Node.js 安装路径（通常是 `C:\Program Files\nodejs\`）

2. **重启终端**：
   - 关闭所有 PowerShell/CMD 窗口
   - 重新打开终端

### 权限问题

如果遇到权限问题：

1. **以管理员身份运行 PowerShell**
2. **或使用用户目录安装**：
   ```powershell
   npm config set prefix "$env:APPDATA\npm"
   ```

## 下一步

安装完成后：

```powershell
# 1. 验证安装
node --version
npm --version

# 2. 安装项目依赖
npm install

# 3. 构建 Actions
npm run build
```


