# Go 工具设计文档

## 🎯 设计目标

创建一个**单一的 Go CLI 工具**，将 GitHub Actions 调试的所有步骤集成在一起，提供标准化的输入输出，让 AI 更容易使用。

## 📦 工具命名

```
gh-action-debug
```

简洁、清晰、符合 GitHub 生态习惯。

## 🔧 核心功能

### 1. 自动调试工作流（主要功能）

```bash
# 完整的自动调试流程
gh-action-debug workflow debug <workflow-file> [ref]

# 示例
gh-action-debug workflow debug .github/workflows/build.yml main
gh-action-debug workflow debug .github/workflows/release.yml main --input version=1.0.0
```

**执行流程**：
1. 触发 workflow
2. 监控执行状态
3. 如果失败，收集错误日志
4. 分析错误原因
5. 输出标准化的 JSON 结果

**输出格式**（JSON）：
```json
{
  "success": true,
  "run_id": "123456789",
  "run_url": "https://github.com/...",
  "status": "success",
  "duration": 120,
  "jobs": [
    {
      "name": "build",
      "status": "success",
      "steps": [...]
    }
  ],
  "errors": [],
  "suggestions": []
}
```

### 2. 子命令（可组合使用）

#### 2.1 触发工作流

```bash
gh-action-debug workflow trigger <workflow-file> [ref] [--input key=value]
```

输出：
```json
{
  "success": true,
  "run_id": "123456789",
  "run_url": "https://github.com/..."
}
```

#### 2.2 监控状态

```bash
gh-action-debug workflow watch <run-id>
```

输出：
```json
{
  "run_id": "123456789",
  "status": "in_progress",
  "jobs": [
    {
      "name": "build",
      "status": "in_progress",
      "started_at": "2025-12-02T10:00:00Z"
    }
  ]
}
```

#### 2.3 收集日志

```bash
gh-action-debug workflow logs <run-id> [--failed-only]
```

输出：
```json
{
  "run_id": "123456789",
  "jobs": [
    {
      "name": "build",
      "steps": [
        {
          "name": "Install dependencies",
          "status": "failure",
          "logs": "Error: Cannot find module 'express'\n..."
        }
      ]
    }
  ]
}
```

#### 2.4 分析错误

```bash
gh-action-debug workflow analyze <run-id>
```

输出：
```json
{
  "run_id": "123456789",
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
  ]
}
```

### 3. 批量测试

```bash
gh-action-debug workflow test --all
gh-action-debug workflow test --file build.yml --file test.yml
```

## 🏗️ Go 项目结构

```
core/tools/go/
├── cmd/
│   └── gh-action-debug/
│       └── main.go              # 主入口
│
├── internal/
│   ├── github/                  # GitHub API 客户端
│   │   ├── client.go           # API 客户端
│   │   ├── workflow.go         # Workflow 操作
│   │   ├── runs.go             # Run 操作
│   │   └── logs.go             # 日志操作
│   │
│   ├── analyzer/                # 错误分析器
│   │   ├── analyzer.go         # 主分析器
│   │   ├── patterns.go         # 错误模式匹配
│   │   └── suggestions.go      # 修复建议
│   │
│   ├── debugger/                # 调试器（组合所有功能）
│   │   ├── debugger.go         # 主调试逻辑
│   │   └── monitor.go          # 状态监控
│   │
│   └── output/                  # 输出格式化
│       ├── json.go             # JSON 输出
│       └── human.go            # 人类可读输出
│
├── pkg/
│   └── types/                   # 公共类型定义
│       ├── workflow.go
│       ├── run.go
│       └── result.go
│
├── go.mod
├── go.sum
├── README.md
└── Makefile                     # 构建脚本
```

## 📝 命令行接口设计

### 主命令

```bash
gh-action-debug [global-options] <command> [command-options]
```

### 全局选项

```bash
--output, -o     输出格式 (json|human) [默认: human]
--verbose, -v    详细输出
--quiet, -q      静默模式
--config, -c     配置文件路径
```

### 命令列表

```
workflow           工作流操作
  debug            自动调试工作流（核心功能）
  trigger          触发工作流
  watch            监控工作流执行
  logs             获取工作流日志
  analyze          分析工作流错误
  test             批量测试工作流
  list             列出所有工作流

version            显示版本信息
help               显示帮助信息
```

## 🎨 使用示例

### 场景 1：完整的自动调试

```bash
# AI 只需要调用一个命令
gh-action-debug workflow debug .github/workflows/build.yml main --output json
```

**AI 得到的输出**：
```json
{
  "success": false,
  "run_id": "123456789",
  "status": "failure",
  "errors": [
    {
      "job": "build",
      "step": "Install dependencies",
      "message": "Cannot find module 'express'",
      "suggestions": [
        "Add 'express' to package.json",
        "Run: npm install express --save"
      ]
    }
  ]
}
```

**AI 的行为**：
1. 解析 JSON 输出
2. 看到 `success: false`
3. 读取 `errors` 和 `suggestions`
4. 自动应用修复建议
5. 重新运行调试命令

### 场景 2：带参数的工作流

```bash
gh-action-debug workflow debug .github/workflows/release.yml main \
  --input version=1.0.0 \
  --input prerelease=false \
  --output json
```

### 场景 3：批量测试

```bash
gh-action-debug workflow test --all --output json
```

输出：
```json
{
  "total": 3,
  "passed": 2,
  "failed": 1,
  "results": [
    {
      "workflow": "build.yml",
      "status": "success",
      "duration": 120
    },
    {
      "workflow": "test.yml",
      "status": "success",
      "duration": 90
    },
    {
      "workflow": "release.yml",
      "status": "failure",
      "errors": [...]
    }
  ]
}
```

## 🔌 GitHub API 集成

### 使用 GitHub CLI 的 API

Go 工具可以直接调用 `gh api` 或使用 Go GitHub SDK：

```go
// 方式 1: 使用 gh CLI（推荐，利用现有认证）
cmd := exec.Command("gh", "api", "/repos/OWNER/REPO/actions/workflows")
output, err := cmd.Output()

// 方式 2: 使用 Go GitHub SDK
import "github.com/google/go-github/v57/github"

client := github.NewClient(nil).WithAuthToken(token)
```

## 📊 输出格式标准

### JSON 输出（给 AI 用）

```json
{
  "success": boolean,
  "run_id": string,
  "run_url": string,
  "status": "success" | "failure" | "cancelled" | "in_progress",
  "duration": number,
  "jobs": [...],
  "errors": [...],
  "suggestions": [...]
}
```

### Human 输出（给人类用）

```
🚀 触发工作流: .github/workflows/build.yml
✅ 工作流已触发，运行 ID: 123456789
🔗 URL: https://github.com/...

⏳ 监控工作流执行状态...
  ✅ build: success (2m 30s)
  ✅ test: success (1m 15s)

✅ 工作流执行成功！
总耗时: 3m 45s
```

## 🚀 构建和分发

### Makefile

```makefile
.PHONY: build install test clean

# 构建所有平台
build:
	GOOS=linux GOARCH=amd64 go build -o dist/gh-action-debug-linux-amd64 ./cmd/gh-action-debug
	GOOS=darwin GOARCH=amd64 go build -o dist/gh-action-debug-darwin-amd64 ./cmd/gh-action-debug
	GOOS=darwin GOARCH=arm64 go build -o dist/gh-action-debug-darwin-arm64 ./cmd/gh-action-debug
	GOOS=windows GOARCH=amd64 go build -o dist/gh-action-debug-windows-amd64.exe ./cmd/gh-action-debug

# 本地安装
install:
	go install ./cmd/gh-action-debug

# 测试
test:
	go test ./...

# 清理
clean:
	rm -rf dist/
```

### 安装方式

```bash
# 方式 1: 直接下载二进制文件
curl -L https://github.com/firoyang/github-action-toolset/releases/download/v1.0.0/gh-action-debug-$(uname -s)-$(uname -m) -o gh-action-debug
chmod +x gh-action-debug
sudo mv gh-action-debug /usr/local/bin/

# 方式 2: 使用 go install
go install github.com/firoyang/github-action-toolset/cmd/gh-action-debug@latest

# 方式 3: 从源码构建
git clone https://github.com/firoyang/github-action-toolset
cd github-action-toolset/core/tools/go
make install
```

## 🎯 AI 规则更新

更新 `core/rules/debugging.mdc`，让 AI 使用新工具：

```markdown
## 🔧 调试工具使用

### 使用 Go 工具（推荐）

```bash
# 完整的自动调试流程
gh-action-debug workflow debug .github/workflows/build.yml main --output json
```

**输出**：标准 JSON 格式，包含所有错误和修复建议

**AI 行为**：
1. 运行调试命令
2. 解析 JSON 输出
3. 根据 suggestions 自动修复
4. 重新运行验证
```

## 📦 依赖管理

```go
// go.mod
module github.com/firoyang/github-action-toolset

go 1.21

require (
	github.com/google/go-github/v57 v57.0.0  // GitHub API
	github.com/spf13/cobra v1.8.0            // CLI 框架
	github.com/spf13/viper v1.18.0           // 配置管理
	gopkg.in/yaml.v3 v3.0.1                  // YAML 解析
)
```

## 🎨 配置文件支持

```yaml
# ~/.config/gh-action-debug/config.yaml
github:
  token: ghp_xxx  # 可选，默认使用 gh CLI 的认证
  
output:
  format: json  # json | human
  
debug:
  timeout: 3600  # 最长等待时间（秒）
  poll_interval: 5  # 轮询间隔（秒）
```

## 🔥 核心优势

### 对比 Python 脚本

| 特性 | Python 脚本 | Go 工具 |
|------|------------|---------|
| **依赖** | 需要 Python + pip | 单一可执行文件 |
| **安装** | 复杂 | 简单（一个文件） |
| **跨平台** | 需要各自安装 | 预编译多平台 |
| **性能** | 较慢 | 快速 |
| **输出** | 不统一 | 标准 JSON |
| **AI 使用** | 需要组合多个脚本 | 一个命令搞定 |

## 🚀 实现计划

### Phase 1: 基础框架

- [ ] 初始化 Go 项目
- [ ] 设置 CLI 框架（cobra）
- [ ] 实现基本命令结构

### Phase 2: GitHub API 集成

- [ ] GitHub 客户端封装
- [ ] Workflow 触发
- [ ] Run 状态查询
- [ ] 日志收集

### Phase 3: 核心调试功能

- [ ] 实现 `workflow debug` 命令
- [ ] 状态监控循环
- [ ] 错误日志收集
- [ ] 错误分析和建议

### Phase 4: 输出和文档

- [ ] JSON 输出格式化
- [ ] Human 输出美化
- [ ] 编写文档
- [ ] 更新 AI 规则

### Phase 5: 测试和发布

- [ ] 单元测试
- [ ] 集成测试
- [ ] 跨平台构建
- [ ] GitHub Release

## 📝 后续扩展

### 可能的新功能

1. **缓存管理**
   ```bash
   gh-action-debug cache list
   gh-action-debug cache clear
   ```

2. **Workflow 生成**
   ```bash
   gh-action-debug generate --template nodejs --output .github/workflows/build.yml
   ```

3. **性能分析**
   ```bash
   gh-action-debug workflow profile <run-id>
   ```

4. **成本估算**
   ```bash
   gh-action-debug workflow cost <run-id>
   ```

---

**核心理念**: 将复杂的调试流程封装成一个简单的命令，让 AI 和人类都能轻松使用。


