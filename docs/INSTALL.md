# 安装指南

## 快速安装

### 方式 1: 一键安装（推荐）

```bash
curl -sL https://raw.githubusercontent.com/firoyang/github-action-toolset/main/core/scripts/install.sh | bash
```

### 方式 2: Git Submodule

```bash
# 添加子模块
git submodule add https://github.com/firoyang/github-action-toolset .toolsets/github-actions

# 运行安装脚本
bash .toolsets/github-actions/core/scripts/install.sh
```

### 方式 3: 手动安装

```bash
# 克隆仓库
git clone https://github.com/firoyang/github-action-toolset /tmp/gh-toolset

# 运行安装脚本
bash /tmp/gh-toolset/core/scripts/install.sh

# 清理临时文件
rm -rf /tmp/gh-toolset
```

## 安装内容

安装脚本会自动：

1. **检查依赖**
   - GitHub CLI (gh) - 必需
   - Python 3.8+ - 可选

2. **复制规则文件**
   - 复制到 `.cursor/rules/github-actions/`
   - 包含：github-actions.mdc, debugging.mdc, best-practices.mdc

3. **安装 Go 调试工具**
   - 复制到 `scripts/toolsets/github-actions/`
   - 包含：
     - `gh-action-debug` - Go 调试工具（单一可执行文件）

4. **复制模板文件**
   - 复制到 `.github/templates/`
   - 包含：构建、测试、发布、部署模板

5. **配置 npm scripts**（如果有 package.json）
   - 添加便捷的 npm 命令

## 验证安装

```bash
# 检查规则文件
ls -la .cursor/rules/github-actions/

# 检查工具脚本
ls -la scripts/toolsets/github-actions/

# 检查 Go 工具
./scripts/toolsets/github-actions/gh-action-debug version
# 或（如果已安装到系统）
gh-action-debug version

# 检查模板
ls -la .github/templates/

# 列出工作流（测试工具）
gh-action-debug workflow list
```

## 依赖要求

### 必需

- **Git**: 用于版本控制
- **GitHub CLI (gh)**: 用于触发和监控工作流
  - 安装：https://cli.github.com/
  - 登录：`gh auth login`

### 可选但推荐

- **gh-action-debug (Go 工具)**: 自动化调试工具（强烈推荐）
  - 单一可执行文件，无需额外依赖
  - 性能优异，AI 友好
  - 会自动安装（如果工具集包含预编译版本）

### 可选

- **Node.js**: 用于 npm scripts（如果项目使用 Node.js）

## Go 工具安装

### 自动安装（推荐）

安装脚本会自动检测系统并安装对应的 Go 工具二进制文件。

### 手动安装到系统

如果需要将 Go 工具安装到系统 PATH：

```bash
# 进入工具集目录
cd .toolsets/github-actions/core/tools/go

# 运行安装脚本
bash install.sh
```

### 从源码构建

如果没有预编译版本：

```bash
cd .toolsets/github-action-toolset/core/tools/go

# 下载依赖并构建
bash build-verify.sh

# 构建所有平台
bash build-all.sh

# 安装到系统
bash install.sh
```

## 权限配置

### GitHub Token

工具需要 GitHub Token 才能访问 API：

```bash
# 方式 1: 使用 GitHub CLI 登录（推荐）
gh auth login

# 方式 2: 设置环境变量
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 方式 3: 配置文件
cat > ~/.gh-action-debug.yaml << EOF
github:
  token: ghp_xxxxxxxxxxxx
EOF
```

**Token 权限要求**：
- `repo` - 访问仓库
- `workflow` - 触发工作流

### 配置优先级

Go 工具会按以下顺序查找配置：

1. 环境变量（`GITHUB_TOKEN`, `GITHUB_REPOSITORY`）
2. 配置文件（`~/.gh-action-debug.yaml`）
3. GitHub CLI（`gh auth token`）
4. Git 仓库信息（自动检测 owner/repo）

## 卸载

```bash
# 手动删除安装的文件
rm -rf .cursor/rules/github-actions
rm -rf scripts/toolsets/github-actions
rm -rf .github/templates

# 删除 Go 工具（如果安装到系统）
sudo rm -f /usr/local/bin/gh-action-debug
```

## 更新

```bash
# 如果使用 Git Submodule
cd .toolsets/github-actions
git pull origin main
cd ../..
bash .toolsets/github-actions/core/scripts/install.sh

# 如果手动安装
curl -sL https://raw.githubusercontent.com/firoyang/github-action-toolset/main/core/scripts/install.sh | bash
```

## 故障排除

### 问题 1: GitHub CLI 未安装

**错误信息**：
```
Error: gh command not found
```

**解决方案**：
```bash
# macOS
brew install gh

# Windows
choco install gh

# Linux
sudo apt install gh  # Debian/Ubuntu
```

### 问题 2: GitHub Token 未配置

**错误信息**：
```
Error: GITHUB_TOKEN is not set
```

**解决方案**：
```bash
gh auth login
# 或
export GITHUB_TOKEN=your_token_here
```

### 问题 3: Go 工具未安装

**错误信息**：
```
gh-action-debug: command not found
```

**解决方案**：
```bash
# 使用项目中的版本
./scripts/toolsets/github-actions/gh-action-debug version

# 或安装到系统
cd .toolsets/github-actions/core/tools/go
bash install.sh

# 或从源码构建
cd .toolsets/github-actions/core/tools/go
bash build-verify.sh
bash install.sh
```

### 问题 4: 仓库信息未检测

**错误信息**：
```
Error: repository owner and name are required
```

**解决方案**：
```bash
# 确保在 git 仓库中运行
git remote -v

# 或设置环境变量
export GITHUB_REPOSITORY=owner/repo

# 或配置文件
cat > ~/.gh-action-debug.yaml << EOF
github:
  owner: your-username
  repo: your-repo
EOF
```

## 下一步

安装完成后，查看：

- [使用指南](USAGE.md) - 如何使用工具集
- [快速开始](guides/quickstart.md) - 快速上手
- [Go 工具文档](../core/tools/go/README.md) - Go 工具详细说明
- [示例](examples/) - 实际示例
