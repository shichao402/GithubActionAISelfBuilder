# GitHub 客户端模块

这个模块提供了与 GitHub API 交互的统一接口。

## 🎯 设计原则

### 1. 唯一调用渠道

所有 GitHub API 调用都通过 `Client` 接口进行，确保：
- ✅ 统一的认证管理
- ✅ 统一的错误处理
- ✅ 统一的日志记录
- ✅ 便于 mock 和测试

### 2. 接口抽象

使用接口而不是具体实现，便于：
- ✅ 单元测试（可以 mock）
- ✅ 替换实现（gh CLI、go-github SDK 等）
- ✅ 依赖注入

### 3. 配置统一

通过 `config.Config` 统一管理所有配置，包括：
- Token 认证
- 仓库信息
- 超时设置
- 轮询间隔

## 📦 使用方式

### 创建客户端

```go
// 加载配置
cfg, err := config.Load("")
if err != nil {
    log.Fatal(err)
}

// 创建客户端（唯一方式）
client, err := github.NewClient(cfg)
if err != nil {
    log.Fatal(err)
}
```

### 触发工作流

```go
result, err := client.TriggerWorkflow(
    ".github/workflows/build.yml",
    "main",
    map[string]string{
        "version": "1.0.0",
    },
)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Run ID: %d\n", result.RunID)
fmt.Printf("URL: %s\n", result.RunURL)
```

### 获取运行状态

```go
run, err := client.GetRun(runID)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Status: %s\n", run.Status)
fmt.Printf("Conclusion: %s\n", run.Conclusion)
```

### 获取日志

```go
jobs, err := client.GetRunLogs(runID)
if err != nil {
    log.Fatal(err)
}

for _, job := range jobs {
    for _, step := range job.Steps {
        if step.Conclusion == "failure" {
            fmt.Printf("失败步骤: %s\n", step.Name)
            fmt.Printf("日志:\n%s\n", step.Logs)
        }
    }
}
```

## 🔧 实现细节

### 使用 gh CLI

客户端内部使用 `gh` CLI 调用 GitHub API，而不是直接使用 HTTP 请求或 SDK。

**优势**：
- ✅ 利用 `gh` 的认证机制
- ✅ 无需管理 HTTP 客户端
- ✅ 自动处理分页、重试等
- ✅ 用户已经熟悉 `gh` 工具

**示例**：

```go
// 内部实现：调用 gh api
func (c *client) callGHAPI(endpoint string) (string, error) {
    cmd := exec.Command("gh", "api", endpoint)
    cmd.Env = append(cmd.Env, fmt.Sprintf("GITHUB_TOKEN=%s", c.config.GitHub.Token))
    output, err := cmd.Output()
    return string(output), err
}
```

### 错误处理

```go
// 统一的错误处理
if err != nil {
    if exitErr, ok := err.(*exec.ExitError); ok {
        stderr := string(exitErr.Stderr)
        return fmt.Errorf("gh command failed: %s", stderr)
    }
    return fmt.Errorf("gh command failed: %w", err)
}
```

## 🧪 测试

### Mock 客户端

```go
type mockClient struct {
    TriggerWorkflowFunc func(string, string, map[string]string) (*types.TriggerResult, error)
    GetRunFunc          func(int64) (*types.WorkflowRun, error)
}

func (m *mockClient) TriggerWorkflow(workflowFile, ref string, inputs map[string]string) (*types.TriggerResult, error) {
    if m.TriggerWorkflowFunc != nil {
        return m.TriggerWorkflowFunc(workflowFile, ref, inputs)
    }
    return nil, nil
}

// 使用 mock
client := &mockClient{
    TriggerWorkflowFunc: func(wf, ref string, inputs map[string]string) (*types.TriggerResult, error) {
        return &types.TriggerResult{
            Success: true,
            RunID:   123,
        }, nil
    },
}
```

## 🔒 安全性

### Token 管理

- ✅ Token 不会打印到日志
- ✅ Token 通过环境变量传递给子进程
- ✅ 支持多种 Token 来源（环境变量、配置文件、gh CLI）

### 权限检查

客户端会验证 Token 的权限：
- `repo` - 访问仓库
- `workflow` - 触发工作流

## 📝 扩展

### 添加新的 API 调用

1. 在 `Client` 接口添加方法
2. 在 `client` 结构体实现方法
3. 使用 `callGHAPI` 调用 API
4. 添加单元测试

示例：

```go
// 接口
type Client interface {
    // ...
    GetWorkflowRuns(workflowFile string, limit int) ([]types.WorkflowRun, error)
}

// 实现
func (c *client) GetWorkflowRuns(workflowFile string, limit int) ([]types.WorkflowRun, error) {
    endpoint := fmt.Sprintf("/repos/%s/%s/actions/workflows/%s/runs?per_page=%d",
        c.config.GitHub.Owner,
        c.config.GitHub.Repo,
        workflowFile,
        limit)
    
    output, err := c.callGHAPI(endpoint)
    if err != nil {
        return nil, err
    }
    
    var response struct {
        WorkflowRuns []types.WorkflowRun `json:"workflow_runs"`
    }
    
    if err := json.Unmarshal([]byte(output), &response); err != nil {
        return nil, err
    }
    
    return response.WorkflowRuns, nil
}
```

## 🔗 相关模块

- `internal/config` - 配置管理
- `pkg/types` - 类型定义
- `internal/debugger` - 使用客户端进行调试

