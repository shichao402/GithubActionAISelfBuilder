# 测试指南

## 快速测试

### 前置要求

1. **Go 环境**: Go 1.21+
2. **GitHub CLI**: 已安装并登录
3. **Git 仓库**: 在一个 GitHub 仓库中运行

### 构建和安装

```bash
cd core/tools/go

# 构建
make build

# 或者直接安装到本地
make install
```

### 测试可用命令

#### 1. 列出工作流

```bash
# 使用构建的二进制文件
./dist/gh-action-debug workflow list

# 或使用已安装的
gh-action-debug workflow list

# 预期输出：
# 📋 列出所有工作流...
# 
# 找到 X 个工作流:
# 
# 1. Build and Test
#    路径: .github/workflows/build.yml
# ...
```

#### 2. 触发工作流

```bash
# 基本触发
gh-action-debug workflow trigger .github/workflows/build.yml main

# 带参数触发
gh-action-debug workflow trigger .github/workflows/release.yml main \
  --input version=1.0.0 \
  --input prerelease=false

# 预期输出：
# 🚀 触发工作流: .github/workflows/build.yml (ref: main)
# ✅ Workflow triggered successfully, run ID: 123456789
# 🔗 URL: https://github.com/owner/repo/actions/runs/123456789
# 🆔 Run ID: 123456789
```

#### 3. 显示版本

```bash
gh-action-debug version

# 预期输出：
# gh-action-debug version dev
```

#### 4. 查看帮助

```bash
gh-action-debug --help
gh-action-debug workflow --help
gh-action-debug workflow trigger --help
```

### 运行单元测试

```bash
# 运行所有测试
make test

# 运行特定包的测试
go test ./internal/config/...
go test ./internal/github/...

# 运行测试并查看覆盖率
make test-coverage
# 然后在浏览器中打开 coverage.html
```

## 完整测试流程

### 场景 1: 列出工作流

```bash
# 1. 确保在 git 仓库中
git remote -v

# 2. 确保 gh 已登录
gh auth status

# 3. 列出工作流
gh-action-debug workflow list -v

# 预期：
# ✅ 配置加载成功
#    仓库: owner/repo
#    输出格式: human
# 📋 列出所有工作流...
# ...
```

### 场景 2: 触发并监控工作流

```bash
# 1. 触发工作流
gh-action-debug workflow trigger .github/workflows/build.yml main -v

# 2. 记下 Run ID
# Run ID: 123456789

# 3. 在浏览器中查看运行状态
# 打开输出的 URL

# 4. 或使用 gh CLI 查看
gh run view 123456789
gh run view 123456789 --log
```

### 场景 3: 使用配置文件

```bash
# 1. 创建配置文件
cat > ~/.gh-action-debug.yaml << EOF
github:
  owner: your-username
  repo: your-repo

output:
  format: human

debug:
  timeout: 1800
  poll_interval: 3
EOF

# 2. 使用配置文件
gh-action-debug workflow list -v

# 预期：配置文件的值会被使用
```

### 场景 4: 测试错误处理

```bash
# 1. 测试无效的 workflow 文件
gh-action-debug workflow trigger .github/workflows/invalid.yml main

# 预期：
# Error: failed to trigger workflow: ...

# 2. 测试没有 token
unset GITHUB_TOKEN
unset GH_TOKEN
gh auth logout
gh-action-debug workflow list

# 预期：
# Error: failed to load config: GitHub token is required. Set it via:
#   1. GITHUB_TOKEN environment variable
#   2. config file (github.token)
#   3. gh auth login (GitHub CLI)

# 3. 重新登录
gh auth login
```

## 调试技巧

### 1. 详细输出

```bash
# 使用 --verbose 标志查看详细信息
gh-action-debug workflow list --verbose
gh-action-debug workflow trigger .github/workflows/build.yml main -v
```

### 2. 检查配置

```bash
# 查看 gh 的配置
gh auth status
gh config list

# 查看 git 配置
git config --get remote.origin.url
```

### 3. 手动测试 gh CLI

```bash
# 列出 workflows
gh api /repos/OWNER/REPO/actions/workflows

# 触发 workflow
gh workflow run build.yml --ref main

# 查看 runs
gh run list --limit 5

# 查看具体的 run
gh run view RUN_ID
```

### 4. 查看日志

```bash
# Go 测试输出
go test -v ./internal/config/...
go test -v ./internal/github/...

# 构建输出
make build VERBOSE=1
```

## 常见问题

### 问题 1: "GitHub token is required"

**原因**: 未找到 GitHub Token

**解决方案**:
```bash
# 方式 1: 使用 gh CLI 登录（推荐）
gh auth login

# 方式 2: 设置环境变量
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 方式 3: 配置文件
echo "github:
  token: ghp_xxxxxxxxxxxx" > ~/.gh-action-debug.yaml
```

### 问题 2: "repository owner and name are required"

**原因**: 未检测到仓库信息

**解决方案**:
```bash
# 方式 1: 在 git 仓库中运行
cd /path/to/your/git/repo
gh-action-debug workflow list

# 方式 2: 设置环境变量
export GITHUB_REPOSITORY=owner/repo

# 方式 3: 配置文件
echo "github:
  owner: your-username
  repo: your-repo" > ~/.gh-action-debug.yaml
```

### 问题 3: "gh command not found"

**原因**: GitHub CLI 未安装

**解决方案**:
```bash
# macOS
brew install gh

# Windows
choco install gh

# Linux
sudo apt install gh
```

### 问题 4: 构建失败

**原因**: 依赖未下载

**解决方案**:
```bash
# 下载依赖
go mod download
go mod tidy

# 重新构建
make clean
make build
```

## 性能测试

### 测试启动速度

```bash
# 测试命令执行时间
time gh-action-debug workflow list

# 预期：< 1 秒
```

### 测试并发

```bash
# 同时触发多个 workflow（谨慎使用）
for i in {1..3}; do
  gh-action-debug workflow trigger .github/workflows/build.yml main &
done
wait
```

## 下一步

完成基础测试后，继续实现：

1. **workflow debug** - 完整的自动调试流程
2. **workflow watch** - 状态监控
3. **workflow logs** - 日志收集
4. **workflow analyze** - 错误分析

---

**提示**: 测试时建议先在一个测试仓库中进行，避免在生产仓库中触发过多的 workflow 运行。

