package debugger

import (
	"fmt"

	"github.com/firoyang/github-action-toolset/internal/analyzer"
	"github.com/firoyang/github-action-toolset/internal/config"
	"github.com/firoyang/github-action-toolset/internal/github"
	"github.com/firoyang/github-action-toolset/pkg/types"
)

// Debugger 调试器
type Debugger struct {
	client   github.Client
	monitor  *Monitor
	analyzer *analyzer.Analyzer
	verbose  bool
}

// NewDebugger 创建新的调试器
func NewDebugger(client github.Client, cfg *config.Config, verbose bool) *Debugger {
	return &Debugger{
		client:   client,
		monitor:  NewMonitor(client, cfg, verbose),
		analyzer: analyzer.NewAnalyzer(verbose),
		verbose:  verbose,
	}
}

// Debug 执行完整的调试流程
func (d *Debugger) Debug(workflowFile, ref string, inputs map[string]string) (*types.DebugResult, error) {
	// 1. 触发 workflow
	if d.verbose {
		fmt.Printf("🚀 触发工作流: %s (ref: %s)\n", workflowFile, ref)
		if len(inputs) > 0 {
			fmt.Println("📝 输入参数:")
			for key, value := range inputs {
				fmt.Printf("   %s = %s\n", key, value)
			}
		}
	}

	result, err := d.client.TriggerWorkflow(workflowFile, ref, inputs)
	if err != nil {
		return nil, fmt.Errorf("failed to trigger workflow: %w", err)
	}

	if d.verbose {
		fmt.Printf("✅ 工作流已触发\n")
		fmt.Printf("🆔 Run ID: %d\n", result.RunID)
		fmt.Printf("🔗 URL: %s\n\n", result.RunURL)
	}

	// 2. 监控执行状态
	run, err := d.monitor.WatchRun(result.RunID)
	if err != nil {
		return nil, fmt.Errorf("failed to monitor workflow: %w", err)
	}

	// 3. 构建基础结果
	debugResult := &types.DebugResult{
		Success:  run.Conclusion == "success",
		RunID:    run.ID,
		RunURL:   run.URL,
		Status:   run.Conclusion,
		Duration: int(run.UpdatedAt.Sub(run.CreatedAt).Seconds()),
		Jobs:     convertJobs(run.Jobs),
	}

	// 4. 如果失败，收集日志并分析错误
	if run.Conclusion != "success" {
		if d.verbose {
			fmt.Println("\n📋 收集失败日志...")
		}

		// 获取详细日志
		jobs, err := d.client.GetRunLogs(run.ID)
		if err != nil {
			// 获取日志失败不应该导致整个调试失败
			if d.verbose {
				fmt.Printf("⚠️  警告: 无法获取详细日志: %v\n", err)
			}
		} else {
			// 更新 run 的 jobs 信息（包含日志）
			run.Jobs = jobs
		}

		// 分析错误
		if d.verbose {
			fmt.Println("🔍 分析错误...")
		}

		errors := d.analyzer.AnalyzeRun(run)
		debugResult.Errors = errors

		// 提取所有建议
		suggestions := make([]string, 0)
		seen := make(map[string]bool)
		for _, err := range errors {
			for _, suggestion := range err.Suggestions {
				if !seen[suggestion] {
					suggestions = append(suggestions, suggestion)
					seen[suggestion] = true
				}
			}
		}
		debugResult.Suggestions = suggestions

		// 显示错误摘要
		if d.verbose && len(errors) > 0 {
			fmt.Println("\n❌ 错误详情:")
			for _, err := range errors {
				fmt.Printf("\n任务: %s\n", err.Job)
				fmt.Printf("步骤: %s\n", err.Step)
				fmt.Printf("类型: %s\n", err.ErrorType)
				fmt.Printf("消息: %s\n", err.Message)
				
				if len(err.Suggestions) > 0 {
					fmt.Println("建议:")
					for _, suggestion := range err.Suggestions {
						fmt.Printf("  • %s\n", suggestion)
					}
				}
			}
		}
	}

	return debugResult, nil
}

// convertJobs 转换 Job 为 JobResult
func convertJobs(jobs []types.Job) []types.JobResult {
	results := make([]types.JobResult, len(jobs))
	for i, job := range jobs {
		results[i] = types.JobResult{
			Name:       job.Name,
			Status:     job.Status,
			Conclusion: job.Conclusion,
			Duration:   int(job.CompletedAt.Sub(job.StartedAt).Seconds()),
			Steps:      convertSteps(job.Steps),
		}
	}
	return results
}

// convertSteps 转换 Step 为 StepResult
func convertSteps(steps []types.Step) []types.StepResult {
	results := make([]types.StepResult, len(steps))
	for i, step := range steps {
		results[i] = types.StepResult{
			Name:       step.Name,
			Status:     step.Status,
			Conclusion: step.Conclusion,
			Duration:   int(step.CompletedAt.Sub(step.StartedAt).Seconds()),
			Logs:       step.Logs,
		}
	}
	return results
}

