package github

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"github.com/firoyang/github-action-toolset/internal/config"
	"github.com/firoyang/github-action-toolset/pkg/types"
)

// Client GitHub API 客户端接口
// 使用接口便于 mock 和测试
type Client interface {
	// TriggerWorkflow 触发 workflow
	TriggerWorkflow(workflowFile, ref string, inputs map[string]string) (*types.TriggerResult, error)

	// GetRun 获取 run 信息
	GetRun(runID int64) (*types.WorkflowRun, error)

	// GetRunLogs 获取 run 日志
	GetRunLogs(runID int64) ([]types.Job, error)

	// ListWorkflows 列出所有 workflows
	ListWorkflows() ([]types.WorkflowFile, error)

	// GetLatestRun 获取最新的 run
	GetLatestRun(workflowFile string) (*types.WorkflowRun, error)
}

// client 实现 Client 接口
// 这是唯一的 GitHub API 调用入口
type client struct {
	config *config.Config
	ctx    context.Context
}

// NewClient 创建新的 GitHub 客户端
// 这是创建客户端的唯一方式，确保配置统一
func NewClient(cfg *config.Config) (Client, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config is required")
	}

	return &client{
		config: cfg,
		ctx:    context.Background(),
	}, nil
}

// TriggerWorkflow 触发 workflow
func (c *client) TriggerWorkflow(workflowFile, ref string, inputs map[string]string) (*types.TriggerResult, error) {
	// 构建 gh workflow run 命令
	args := []string{
		"workflow", "run",
		workflowFile,
		"--ref", ref,
	}

	// 添加输入参数
	for key, value := range inputs {
		args = append(args, "-f", fmt.Sprintf("%s=%s", key, value))
	}

	// 执行命令
	if err := c.executeGHCommand(args...); err != nil {
		return nil, fmt.Errorf("failed to trigger workflow: %w", err)
	}

	// 等待一小段时间，让 workflow 开始执行
	time.Sleep(2 * time.Second)

	// 获取最新的 run
	run, err := c.GetLatestRun(workflowFile)
	if err != nil {
		return nil, fmt.Errorf("workflow triggered but failed to get run info: %w", err)
	}

	return &types.TriggerResult{
		Success: true,
		RunID:   run.ID,
		RunURL:  run.URL,
		Message: fmt.Sprintf("Workflow triggered successfully, run ID: %d", run.ID),
	}, nil
}

// GetRun 获取 run 信息
func (c *client) GetRun(runID int64) (*types.WorkflowRun, error) {
	// 调用 gh api 获取 run 信息
	endpoint := fmt.Sprintf("/repos/%s/%s/actions/runs/%d",
		c.config.GitHub.Owner,
		c.config.GitHub.Repo,
		runID)

	output, err := c.callGHAPI(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to get run: %w", err)
	}

	var run types.WorkflowRun
	if err := json.Unmarshal([]byte(output), &run); err != nil {
		return nil, fmt.Errorf("failed to parse run response: %w", err)
	}

	// 获取 jobs 信息
	jobs, err := c.getRunJobs(runID)
	if err != nil {
		// 不要因为获取 jobs 失败而失败整个请求
		// 只记录错误
		fmt.Printf("Warning: failed to get jobs: %v\n", err)
	} else {
		run.Jobs = jobs
	}

	return &run, nil
}

// GetRunLogs 获取 run 日志
func (c *client) GetRunLogs(runID int64) ([]types.Job, error) {
	jobs, err := c.getRunJobs(runID)
	if err != nil {
		return nil, err
	}

	// 为每个失败的步骤获取日志
	for i := range jobs {
		for j := range jobs[i].Steps {
			if jobs[i].Steps[j].Conclusion == "failure" {
				logs, err := c.getStepLogs(runID, jobs[i].ID, jobs[i].Steps[j].Number)
				if err != nil {
					// 记录错误但继续
					fmt.Printf("Warning: failed to get logs for step %s: %v\n", jobs[i].Steps[j].Name, err)
					continue
				}
				jobs[i].Steps[j].Logs = logs
			}
		}
	}

	return jobs, nil
}

// ListWorkflows 列出所有 workflows
func (c *client) ListWorkflows() ([]types.WorkflowFile, error) {
	endpoint := fmt.Sprintf("/repos/%s/%s/actions/workflows",
		c.config.GitHub.Owner,
		c.config.GitHub.Repo)

	output, err := c.callGHAPI(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to list workflows: %w", err)
	}

	var response struct {
		Workflows []struct {
			ID   int64  `json:"id"`
			Name string `json:"name"`
			Path string `json:"path"`
		} `json:"workflows"`
	}

	if err := json.Unmarshal([]byte(output), &response); err != nil {
		return nil, fmt.Errorf("failed to parse workflows response: %w", err)
	}

	workflows := make([]types.WorkflowFile, len(response.Workflows))
	for i, wf := range response.Workflows {
		workflows[i] = types.WorkflowFile{
			Path: wf.Path,
			Name: wf.Name,
		}
	}

	return workflows, nil
}

// GetLatestRun 获取最新的 run
func (c *client) GetLatestRun(workflowFile string) (*types.WorkflowRun, error) {
	// 列出最近的 runs
	endpoint := fmt.Sprintf("/repos/%s/%s/actions/runs?per_page=1",
		c.config.GitHub.Owner,
		c.config.GitHub.Repo)

	output, err := c.callGHAPI(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to get latest run: %w", err)
	}

	var response struct {
		WorkflowRuns []types.WorkflowRun `json:"workflow_runs"`
	}

	if err := json.Unmarshal([]byte(output), &response); err != nil {
		return nil, fmt.Errorf("failed to parse runs response: %w", err)
	}

	if len(response.WorkflowRuns) == 0 {
		return nil, fmt.Errorf("no runs found")
	}

	return &response.WorkflowRuns[0], nil
}

// getRunJobs 获取 run 的所有 jobs
func (c *client) getRunJobs(runID int64) ([]types.Job, error) {
	endpoint := fmt.Sprintf("/repos/%s/%s/actions/runs/%d/jobs",
		c.config.GitHub.Owner,
		c.config.GitHub.Repo,
		runID)

	output, err := c.callGHAPI(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to get jobs: %w", err)
	}

	var response struct {
		Jobs []types.Job `json:"jobs"`
	}

	if err := json.Unmarshal([]byte(output), &response); err != nil {
		return nil, fmt.Errorf("failed to parse jobs response: %w", err)
	}

	return response.Jobs, nil
}

// getStepLogs 获取步骤日志
func (c *client) getStepLogs(runID, jobID int64, stepNumber int) (string, error) {
	// gh CLI 不直接支持获取单个步骤的日志
	// 我们获取整个 job 的日志，然后提取对应步骤的内容
	args := []string{
		"run", "view",
		fmt.Sprintf("%d", runID),
		"--log-failed",
		"--job", fmt.Sprintf("%d", jobID),
	}

	output, err := c.executeGHCommandWithOutput(args...)
	if err != nil {
		return "", err
	}

	// TODO: 解析输出，提取特定步骤的日志
	// 目前返回完整日志
	return output, nil
}

// callGHAPI 调用 GitHub API
// 这是调用 GitHub API 的唯一入口，确保使用统一的认证和配置
func (c *client) callGHAPI(endpoint string) (string, error) {
	args := []string{
		"api",
		endpoint,
		"-H", "Accept: application/vnd.github+json",
	}

	return c.executeGHCommandWithOutput(args...)
}

// executeGHCommand 执行 gh 命令（不需要输出）
func (c *client) executeGHCommand(args ...string) error {
	cmd := exec.CommandContext(c.ctx, "gh", args...)

	// 设置环境变量
	cmd.Env = append(cmd.Env, fmt.Sprintf("GITHUB_TOKEN=%s", c.config.GitHub.Token))

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("gh command failed: %w", err)
	}

	return nil
}

// executeGHCommandWithOutput 执行 gh 命令并返回输出
// 这是执行外部命令的唯一入口，确保统一的错误处理和日志记录
func (c *client) executeGHCommandWithOutput(args ...string) (string, error) {
	cmd := exec.CommandContext(c.ctx, "gh", args...)

	// 设置环境变量
	cmd.Env = append(cmd.Env, fmt.Sprintf("GITHUB_TOKEN=%s", c.config.GitHub.Token))

	output, err := cmd.Output()
	if err != nil {
		// 尝试获取错误输出
		if exitErr, ok := err.(*exec.ExitError); ok {
			stderr := string(exitErr.Stderr)
			return "", fmt.Errorf("gh command failed: %s", stderr)
		}
		return "", fmt.Errorf("gh command failed: %w", err)
	}

	return strings.TrimSpace(string(output)), nil
}


