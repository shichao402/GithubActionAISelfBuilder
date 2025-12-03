# 安装指南

## 快速安装

### 方式 1: Git Submodule（推荐）

```bash
# 1. 添加子模块
git submodule add https://github.com/shichao402/GithubActionAISelfBuilder.git .toolsets/github-actions

# 2. 手动安装：复制规则文件和工具
# 复制规则文件
mkdir -p .cursor/rules/github-actions
cp .toolsets/github-actions/core/rules/*.mdc .cursor/rules/github-actions/

# 复制 Go 工具（自动检测平台）
mkdir -p scripts/toolsets/github-actions
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    ARCH="arm64"
fi
cp .toolsets/github-actions/core/tools/go/dist/gh-action-debug-${PLATFORM}-${ARCH} \
   scripts/toolsets/github-actions/gh-action-debug
chmod +x scripts/toolsets/github-actions/gh-action-debug
```

### 方式 2: 手动克隆

```bash
# 1. 克隆仓库
git clone https://github.com/shichao402/GithubActionAISelfBuilder.git /tmp/gh-toolset

# 2. 复制规则文件
mkdir -p .cursor/rules/github-actions
cp /tmp/gh-toolset/core/rules/*.mdc .cursor/rules/github-actions/

# 3. 复制 Go 工具
mkdir -p scripts/toolsets/github-actions
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    ARCH="arm64"
fi
cp /tmp/gh-toolset/core/tools/go/dist/gh-action-debug-${PLATFORM}-${ARCH} \
   scripts/toolsets/github-actions/gh-action-debug
chmod +x scripts/toolsets/github-actions/gh-action-debug

# 4. 清理临时文件
rm -rf /tmp/gh-toolset
```

## 安装内容

手动安装需要复制以下内容：

1. **AI 规则文件** → `.cursor/rules/github-actions/`
   - `github-actions.mdc`
   - `debugging.mdc`
   - `best-practices.mdc`

2. **Go 调试工具** → `scripts/toolsets/github-actions/gh-action-debug`
   - 从 `core/tools/go/dist/` 复制对应平台的二进制文件
   - 平台格式：`gh-action-debug-{platform}-{arch}`
   - 例如：`gh-action-debug-darwin-amd64`, `gh-action-debug-linux-arm64`

## 验证安装

```bash
# 检查规则文件
ls -la .cursor/rules/github-actions/
# 应该看到：github-actions.mdc, debugging.mdc, best-practices.mdc

# 检查工具
./scripts/toolsets/github-actions/gh-action-debug version
# 或（如果已安装到系统）
gh-action-debug version

# 列出工作流（测试工具）
./scripts/toolsets/github-actions/gh-action-debug workflow list
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
  - 工具集包含预编译版本

## Go 工具安装

### 使用工具集中的预编译版本（推荐）

工具集包含常见平台的预编译版本，直接复制即可：

```bash
# 检测平台并复制
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    ARCH="arm64"
fi

mkdir -p scripts/toolsets/github-actions
cp .toolsets/github-actions/core/tools/go/dist/gh-action-debug-${PLATFORM}-${ARCH} \
   scripts/toolsets/github-actions/gh-action-debug
chmod +x scripts/toolsets/github-actions/gh-action-debug
```

### 安装到系统 PATH

如果需要将 Go 工具安装到系统 PATH：

```bash
# 进入工具集目录
cd .toolsets/github-actions/core/tools/go

# 运行安装脚本
bash install.sh
```

### 从源码构建

如果没有预编译版本或需要自定义构建：

```bash
cd .toolsets/github-actions/core/tools/go

# 构建当前平台
make build

# 构建所有平台
make build-all

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

# 删除 Git Submodule（如果使用）
git submodule deinit -f .toolsets/github-actions
git rm -f .toolsets/github-actions
rm -rf .git/modules/.toolsets/github-actions

# 删除 Go 工具（如果安装到系统）
sudo rm -f /usr/local/bin/gh-action-debug
```

## 更新

```bash
# 如果使用 Git Submodule
cd .toolsets/github-actions
git pull origin main
cd ../..

# 重新复制文件
mkdir -p .cursor/rules/github-actions
cp .toolsets/github-actions/core/rules/*.mdc .cursor/rules/github-actions/

# 重新复制 Go 工具
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    ARCH="arm64"
fi
cp .toolsets/github-actions/core/tools/go/dist/gh-action-debug-${PLATFORM}-${ARCH} \
   scripts/toolsets/github-actions/gh-action-debug
chmod +x scripts/toolsets/github-actions/gh-action-debug
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

### 问题 3: Go 工具未找到

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
make build
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
