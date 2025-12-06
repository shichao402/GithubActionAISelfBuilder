# gh-action-debug - GitHub Actions 调试工具

一个用 Go 编写的 GitHub Actions 自动调试工具，专为 AI 助手设计。

## 🎯 特性

- ✅ **单一可执行文件** - 无需依赖，跨平台运行
- ✅ **标准化输出** - JSON 格式，AI 友好
- ✅ **完整的调试流程** - 触发、监控、分析一站式
- ✅ **智能错误分析** - 自动识别常见问题并提供修复建议
- ✅ **快速高效** - Go 语言实现，性能优异

## 🚀 快速开始

### 安装

#### 从二进制文件安装（推荐）

```bash
# macOS (Intel)
curl -L https://github.com/shichao402/GithubActionAISelfBuilder/releases/download/v1.0.0/gh-action-debug-darwin-amd64 -o gh-action-debug
chmod +x gh-action-debug
sudo mv gh-action-debug /usr/local/bin/

# macOS (M1/M2)
curl -L https://github.com/shichao402/GithubActionAISelfBuilder/releases/download/v1.0.0/gh-action-debug-darwin-arm64 -o gh-action-debug
chmod +x gh-action-debug
sudo mv gh-action-debug /usr/local/bin/

# Linux
curl -L https://github.com/shichao402/GithubActionAISelfBuilder/releases/download/v1.0.0/gh-action-debug-linux-amd64 -o gh-action-debug
chmod +x gh-action-debug
sudo mv gh-action-debug /usr/local/bin/

# Windows (PowerShell)
Invoke-WebRequest -Uri "https://github.com/shichao402/GithubActionAISelfBuilder/releases/download/v1.0.0/gh-action-debug-windows-amd64.exe" -OutFile "gh-action-debug.exe"
```

#### 使用 go install

```bash
go install github.com/shichao402/GithubActionAISelfBuilder/core/tools/go/cmd/gh-action-debug@latest
```

#### 从源码构建

```bash
git clone https://github.com/shichao402/GithubActionAISelfBuilder.git
cd GithubActionAISelfBuilder/core/tools/go
make install
```

### 使用

#### 完整的自动调试

```bash
# 基本用法
gh-action-debug workflow debug .github/workflows/build.yml main

# JSON 输出（供 AI 使用）
gh-action-debug workflow debug .github/workflows/build.yml main --output json

# 带参数触发
gh-action-debug workflow debug .github/workflows/release.yml main --input version=1.0.0
```

#### 其他命令

```bash
# 触发工作流
gh-action-debug workflow trigger .github/workflows/build.yml main

# 监控运行状态
gh-action-debug workflow watch 123456789

# 获取日志
gh-action-debug workflow logs 123456789 --failed-only

# 分析错误
gh-action-debug workflow analyze 123456789

# 批量测试
gh-action-debug workflow test --all

# 列出所有工作流
gh-action-debug workflow list
```

## 📋 命令参考

### 全局选项

```
--output, -o     输出格式 (json|human) [默认: human]
--verbose, -v    详细输出
--quiet, -q      静默模式
--config, -c     配置文件路径
```

### workflow 子命令

- `debug` - 自动调试工作流（完整流程）
- `trigger` - 触发工作流
- `watch` - 监控工作流执行
- `logs` - 获取工作流日志
- `analyze` - 分析工作流错误
- `test` - 批量测试工作流
- `list` - 列出所有工作流

### rules 子命令

- `export` - 导出 AI 规则文件到指定项目
- `list` - 列出可用的规则文件

#### 导出规则到项目

```bash
# 导出到当前目录
gh-action-debug rules export

# 导出到指定项目
gh-action-debug rules export /path/to/project

# 强制覆盖已存在的文件
gh-action-debug rules export --force

# 预览模式（不实际写入）
gh-action-debug rules export --dry-run

# 列出可用的规则文件
gh-action-debug rules list
```

导出后，规则文件会被复制到项目的 `.cursor/rules/github-actions/` 目录，Cursor IDE 会自动加载这些规则。

## 📊 输出格式

### JSON 输出示例

```json
{
  "success": false,
  "run_id": 123456789,
  "run_url": "https://github.com/user/repo/actions/runs/123456789",
  "status": "failure",
  "duration": 120,
  "jobs": [
    {
      "name": "build",
      "status": "failure",
      "conclusion": "failure",
      "duration": 120,
      "steps": [
        {
          "name": "Install dependencies",
          "status": "failure",
          "logs": "Error: Cannot find module 'express'\n..."
        }
      ]
    }
  ],
  "errors": [
    {
      "job": "build",
      "step": "Install dependencies",
      "error_type": "missing_dependency",
      "message": "Cannot find module 'express'",
      "suggestions": [
        "Add 'express' to package.json dependencies",
        "Run 'npm install express --save'",
        "Check if package-lock.json is committed"
      ]
    }
  ],
  "suggestions": [
    "Add 'express' to package.json",
    "Run: npm install express --save"
  ]
}
```

### Human 输出示例

```
🚀 触发工作流: .github/workflows/build.yml
✅ 工作流已触发，运行 ID: 123456789
🔗 URL: https://github.com/user/repo/actions/runs/123456789

⏳ 监控工作流执行状态...
  ❌ build: failure (2m 0s)

❌ 工作流执行失败

📋 错误日志:
  任务 build:
    步骤 Install dependencies:
      Error: Cannot find module 'express'

🔍 修复建议:
  - Add 'express' to package.json dependencies
  - Run 'npm install express --save'
  - Check if package-lock.json is committed
```

## 🔧 配置

创建配置文件 `~/.config/gh-action-debug/config.yaml`:

```yaml
github:
  token: ghp_xxx  # 可选，默认使用 gh CLI 的认证

output:
  format: json  # json | human

debug:
  timeout: 3600  # 最长等待时间（秒）
  poll_interval: 5  # 轮询间隔（秒）
```

## 🤖 AI 集成

此工具专为 AI 助手设计，提供标准化的 JSON 输出：

```bash
# AI 只需要运行一个命令
gh-action-debug workflow debug .github/workflows/build.yml main --output json
```

AI 可以：
1. 解析 JSON 输出
2. 识别错误（`errors` 数组）
3. 应用修复建议（`suggestions` 数组）
4. 重新运行验证

## 🛠️ 开发

### 构建

```bash
# 构建当前平台
make build

# 构建所有平台
make build-all

# 安装到本地
make install
```

### 测试

```bash
# 运行测试
make test

# 测试覆盖率
make test-coverage
```

### 运行

```bash
# 开发模式运行
make run ARGS="workflow debug .github/workflows/build.yml main"
```

## 📝 依赖

- [cobra](https://github.com/spf13/cobra) - CLI 框架
- [go-github](https://github.com/google/go-github) - GitHub API 客户端
- [viper](https://github.com/spf13/viper) - 配置管理

## 📄 许可证

MIT License

## 🔗 相关链接

- [设计文档](DESIGN.md)
- [项目主页](https://github.com/shichao402/GithubActionAISelfBuilder)
- [问题追踪](https://github.com/shichao402/GithubActionAISelfBuilder/issues)


