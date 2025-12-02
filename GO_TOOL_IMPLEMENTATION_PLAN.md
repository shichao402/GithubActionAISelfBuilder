# Go 工具实现计划

## 📋 概述

使用 Go 重写 GitHub Actions 调试工具，将多个功能集成到一个单一的、标准化的 CLI 工具中。

## 🎯 核心设计理念

### 为什么选择 Go？

1. **单一可执行文件** - 无需 Python 环境，零依赖
2. **跨平台编译** - 一次编译，多平台运行
3. **性能优异** - 启动快，执行效率高
4. **标准化输出** - JSON 格式，AI 友好
5. **易于分发** - 直接下载二进制文件即可使用

### AI 友好的设计

**核心原则**: 一个命令完成所有步骤，AI 不需要手动组合多个工具。

**传统方式**（AI 需要组合多步）：
```bash
# 1. AI: 触发 workflow
gh workflow run build.yml

# 2. AI: 等待一段时间
sleep 10

# 3. AI: 查询 run ID
gh run list --limit 1

# 4. AI: 监控状态
gh run view <run-id>

# 5. AI: 如果失败，获取日志
gh run view <run-id> --log-failed

# 6. AI: 手动分析错误...
```

**新方式**（一个命令搞定）：
```bash
# AI 只需要一个命令
gh-action-debug workflow debug .github/workflows/build.yml main --output json
```

**AI 得到的输出**：
```json
{
  "success": false,
  "errors": [...],
  "suggestions": [
    "Add 'express' to package.json",
    "Run: npm install express --save"
  ]
}
```

**AI 的行为**：
1. 解析 JSON
2. 应用建议
3. 重新测试
4. 完成

## 🏗️ 项目结构

```
core/tools/go/
├── cmd/
│   └── gh-action-debug/
│       └── main.go              # CLI 入口（✅ 已创建）
│
├── internal/
│   ├── github/                  # GitHub API 客户端
│   │   ├── client.go           # 基础客户端（TODO）
│   │   ├── workflow.go         # Workflow 操作（TODO）
│   │   ├── runs.go             # Run 操作（TODO）
│   │   └── logs.go             # 日志操作（TODO）
│   │
│   ├── analyzer/                # 错误分析器
│   │   ├── analyzer.go         # 主分析器（TODO）
│   │   ├── patterns.go         # 错误模式匹配（TODO）
│   │   └── suggestions.go      # 修复建议生成（TODO）
│   │
│   ├── debugger/                # 调试器（组合所有功能）
│   │   ├── debugger.go         # 主调试逻辑（TODO）
│   │   └── monitor.go          # 状态监控（TODO）
│   │
│   └── output/                  # 输出格式化
│       ├── json.go             # JSON 输出（TODO）
│       └── human.go            # 人类可读输出（TODO）
│
├── pkg/
│   └── types/                   # 公共类型定义
│       ├── workflow.go         # ✅ 已创建
│       └── result.go           # ✅ 已创建
│
├── go.mod                       # ✅ 已创建
├── Makefile                     # ✅ 已创建
├── README.md                    # ✅ 已创建
└── DESIGN.md                    # ✅ 已创建
```

## 🚀 实现计划

### Phase 1: 基础框架（✅ 完成）

- [x] 项目结构设计
- [x] CLI 框架搭建（cobra）
- [x] 基本命令结构
- [x] 类型定义
- [x] Makefile 构建脚本
- [x] 文档框架

### Phase 2: GitHub API 集成（TODO）

**目标**: 封装 GitHub API，提供简单的接口

**文件**: `internal/github/*.go`

**功能**:
```go
// 触发 workflow
func TriggerWorkflow(workflowFile, ref string, inputs map[string]string) (*TriggerResult, error)

// 获取 run 状态
func GetRunStatus(runID int64) (*WorkflowRun, error)

// 获取 run 日志
func GetRunLogs(runID int64) ([]Job, error)

// 列出所有 workflows
func ListWorkflows() ([]WorkflowFile, error)
```

**实现方式**:
1. 方式A: 直接调用 `gh api` 命令（推荐，利用现有认证）
2. 方式B: 使用 `go-github` SDK

### Phase 3: 错误分析器（TODO）

**目标**: 自动识别常见错误并提供修复建议

**文件**: `internal/analyzer/*.go`

**功能**:
```go
// 分析错误日志
func AnalyzeErrors(jobs []Job) []ErrorInfo

// 匹配错误模式
func MatchPattern(log string) (errorType string, message string)

// 生成修复建议
func GenerateSuggestions(errorType, message string) []string
```

**常见错误模式**:
```go
var errorPatterns = []ErrorPattern{
    {
        Pattern:     regexp.MustCompile(`Cannot find module '(.+)'`),
        Type:        "missing_dependency",
        Suggestions: []string{
            "Add '%s' to package.json dependencies",
            "Run 'npm install %s --save'",
        },
    },
    {
        Pattern:     regexp.MustCompile(`permission denied`),
        Type:        "permission_error",
        Suggestions: []string{
            "Add 'contents: write' to workflow permissions",
            "Check GITHUB_TOKEN permissions",
        },
    },
    // ... 更多模式
}
```

### Phase 4: 核心调试器（TODO）

**目标**: 实现完整的自动调试流程

**文件**: `internal/debugger/*.go`

**功能**:
```go
// 完整的调试流程
func Debug(workflowFile, ref string, inputs map[string]string) (*DebugResult, error) {
    // 1. 触发 workflow
    result, err := github.TriggerWorkflow(workflowFile, ref, inputs)
    if err != nil {
        return nil, err
    }
    
    // 2. 监控执行状态
    run, err := monitor.Watch(result.RunID)
    if err != nil {
        return nil, err
    }
    
    // 3. 如果失败，收集日志
    if run.Conclusion != "success" {
        logs, err := github.GetRunLogs(run.ID)
        if err != nil {
            return nil, err
        }
        
        // 4. 分析错误
        errors := analyzer.AnalyzeErrors(logs)
        
        // 5. 返回结果
        return &DebugResult{
            Success: false,
            RunID:   run.ID,
            Errors:  errors,
            Suggestions: extractSuggestions(errors),
        }, nil
    }
    
    return &DebugResult{
        Success: true,
        RunID:   run.ID,
    }, nil
}
```

### Phase 5: 输出格式化（TODO）

**目标**: 提供 JSON 和 Human 两种输出格式

**文件**: `internal/output/*.go`

**JSON 输出**:
```go
func FormatJSON(result *DebugResult) string {
    data, _ := json.MarshalIndent(result, "", "  ")
    return string(data)
}
```

**Human 输出**:
```go
func FormatHuman(result *DebugResult) string {
    var buf bytes.Buffer
    
    if result.Success {
        buf.WriteString("✅ 工作流执行成功！\n")
    } else {
        buf.WriteString("❌ 工作流执行失败\n\n")
        buf.WriteString("📋 错误列表:\n")
        for _, err := range result.Errors {
            buf.WriteString(fmt.Sprintf("  • %s: %s\n", err.Step, err.Message))
        }
        buf.WriteString("\n🔍 修复建议:\n")
        for _, suggestion := range result.Suggestions {
            buf.WriteString(fmt.Sprintf("  • %s\n", suggestion))
        }
    }
    
    return buf.String()
}
```

### Phase 6: 测试和文档（TODO）

- [ ] 单元测试（每个模块）
- [ ] 集成测试（完整流程）
- [ ] 性能测试
- [ ] 文档完善
- [ ] 使用示例

### Phase 7: 构建和发布（TODO）

- [ ] 跨平台构建
- [ ] GitHub Actions CI/CD
- [ ] GitHub Release
- [ ] 安装脚本更新
- [ ] 版本管理

## 📝 开发顺序

### 第一步：GitHub API 客户端

```bash
# 1. 实现基础客户端
vim internal/github/client.go

# 2. 实现 workflow 操作
vim internal/github/workflow.go

# 3. 测试
go test ./internal/github/...

# 4. 手动测试
go run ./cmd/gh-action-debug workflow trigger .github/workflows/build.yml main
```

### 第二步：状态监控

```bash
# 1. 实现 runs 操作
vim internal/github/runs.go

# 2. 实现监控器
vim internal/debugger/monitor.go

# 3. 测试
go run ./cmd/gh-action-debug workflow watch <run-id>
```

### 第三步：日志收集

```bash
# 1. 实现日志操作
vim internal/github/logs.go

# 2. 测试
go run ./cmd/gh-action-debug workflow logs <run-id>
```

### 第四步：错误分析

```bash
# 1. 实现错误模式
vim internal/analyzer/patterns.go

# 2. 实现分析器
vim internal/analyzer/analyzer.go

# 3. 实现建议生成
vim internal/analyzer/suggestions.go

# 4. 测试
go run ./cmd/gh-action-debug workflow analyze <run-id>
```

### 第五步：集成调试器

```bash
# 1. 实现完整调试流程
vim internal/debugger/debugger.go

# 2. 连接所有模块

# 3. 测试
go run ./cmd/gh-action-debug workflow debug .github/workflows/build.yml main
```

### 第六步：输出格式化

```bash
# 1. 实现 JSON 输出
vim internal/output/json.go

# 2. 实现 Human 输出
vim internal/output/human.go

# 3. 测试
go run ./cmd/gh-action-debug workflow debug .github/workflows/build.yml main --output json
go run ./cmd/gh-action-debug workflow debug .github/workflows/build.yml main --output human
```

## 🔧 快速开发指南

### 构建和运行

```bash
# 构建
cd core/tools/go
make build

# 运行
./dist/gh-action-debug workflow debug .github/workflows/build.yml main

# 或直接运行（无需构建）
make run ARGS="workflow debug .github/workflows/build.yml main"
```

### 测试

```bash
# 运行测试
make test

# 测试覆盖率
make test-coverage
```

### 安装到本地

```bash
make install

# 然后可以直接使用
gh-action-debug workflow debug .github/workflows/build.yml main
```

## 📦 发布流程

### 1. 更新版本号

```bash
# 更新 VERSION
vim Makefile  # 修改 VERSION

# 构建所有平台
make build-all
```

### 2. 创建 GitHub Release

```bash
# 推送标签
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions 自动构建和发布
# 或手动上传 dist/ 目录下的所有二进制文件
```

### 3. 更新安装脚本

更新 `core/scripts/install.sh`，添加 Go 工具的安装选项。

### 4. 更新文档

- 更新 README.md
- 更新 docs/USAGE.md
- 更新 core/rules/ 中的规则，教 AI 使用新工具

## 🎯 里程碑

### Milestone 1: MVP（最小可用产品）
- [x] 基础框架
- [ ] GitHub API 集成
- [ ] workflow debug 命令（基础版）
- [ ] JSON 输出

**目标**: AI 可以用一个命令触发和监控 workflow

### Milestone 2: 完整功能
- [ ] 日志收集
- [ ] 错误分析
- [ ] 修复建议
- [ ] Human 输出
- [ ] 所有子命令

**目标**: 完整的自动调试流程

### Milestone 3: 生产就绪
- [ ] 完整测试
- [ ] 文档完善
- [ ] 跨平台构建
- [ ] CI/CD 流程
- [ ] 第一个 Release

**目标**: 可以正式发布和使用

## 💡 技术细节

### GitHub API 认证

使用 `gh CLI` 的认证（推荐）：

```go
// 方式 1: 调用 gh api
cmd := exec.Command("gh", "api", "/repos/OWNER/REPO/actions/workflows")
output, err := cmd.Output()

// 方式 2: 获取 gh 的 token
cmd := exec.Command("gh", "auth", "token")
token, err := cmd.Output()

// 使用 token 初始化 go-github 客户端
client := github.NewClient(nil).WithAuthToken(string(token))
```

### 错误模式匹配

使用正则表达式匹配常见错误：

```go
type ErrorPattern struct {
    Pattern     *regexp.Regexp
    Type        string
    Suggestions func(match []string) []string
}

var patterns = []ErrorPattern{
    {
        Pattern: regexp.MustCompile(`Cannot find module '(.+)'`),
        Type:    "missing_dependency",
        Suggestions: func(match []string) []string {
            module := match[1]
            return []string{
                fmt.Sprintf("Add '%s' to package.json", module),
                fmt.Sprintf("Run: npm install %s --save", module),
            }
        },
    },
}
```

### 状态监控

使用轮询方式监控状态：

```go
func Watch(runID int64, pollInterval time.Duration) (*WorkflowRun, error) {
    for {
        run, err := GetRunStatus(runID)
        if err != nil {
            return nil, err
        }
        
        // 如果完成，返回结果
        if run.Status == "completed" {
            return run, nil
        }
        
        // 等待后重试
        time.Sleep(pollInterval)
    }
}
```

## 🎉 预期效果

### 对 AI 的影响

**之前**：AI 需要手动组合 5-10 个命令

**之后**：AI 只需要一个命令，得到结构化的结果

### 对用户的影响

**之前**：需要安装 Python、pip、依赖包

**之后**：下载一个二进制文件即可

### 性能提升

- **启动速度**: 10-100x 更快（Go vs Python）
- **执行效率**: 2-5x 更快
- **内存占用**: 50% 更少

## 📚 参考资源

- [Cobra 文档](https://github.com/spf13/cobra)
- [go-github 文档](https://github.com/google/go-github)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [GitHub CLI 文档](https://cli.github.com/manual/)

---

**下一步**: 开始实现 `internal/github/client.go`！

