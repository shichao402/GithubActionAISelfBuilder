package debugger

import (
	"fmt"
	"time"

	"github.com/firoyang/github-action-toolset/internal/config"
	"github.com/firoyang/github-action-toolset/internal/github"
	"github.com/firoyang/github-action-toolset/pkg/types"
)

// Monitor 状态监控器
type Monitor struct {
	client       github.Client
	pollInterval time.Duration
	timeout      time.Duration
	verbose      bool
}

// NewMonitor 创建新的监控器
func NewMonitor(client github.Client, cfg *config.Config, verbose bool) *Monitor {
	return &Monitor{
		client:       client,
		pollInterval: time.Duration(cfg.Debug.PollInterval) * time.Second,
		timeout:      time.Duration(cfg.Debug.Timeout) * time.Second,
		verbose:      verbose,
	}
}

// WatchRun 监控 run 直到完成或超时
func (m *Monitor) WatchRun(runID int64) (*types.WorkflowRun, error) {
	if m.verbose {
		fmt.Printf("⏳ 监控工作流执行状态 (Run ID: %d)...\n", runID)
	}

	startTime := time.Now()
	lastStatus := ""

	for {
		// 检查超时
		if time.Since(startTime) > m.timeout {
			return nil, fmt.Errorf("监控超时 (%v)", m.timeout)
		}

		// 获取 run 状态
		run, err := m.client.GetRun(runID)
		if err != nil {
			return nil, fmt.Errorf("failed to get run status: %w", err)
		}

		// 如果状态改变，显示进度
		if m.verbose && run.Status != lastStatus {
			m.displayProgress(run)
			lastStatus = run.Status
		}

		// 检查是否完成
		if run.Status == "completed" {
			if m.verbose {
				fmt.Printf("\n")
				m.displayFinalStatus(run)
			}
			return run, nil
		}

		// 等待后继续轮询
		time.Sleep(m.pollInterval)
	}
}

// displayProgress 显示进度信息
func (m *Monitor) displayProgress(run *types.WorkflowRun) {
	fmt.Printf("  状态: %s\n", run.Status)

	if len(run.Jobs) > 0 {
		for _, job := range run.Jobs {
			status := m.getStatusEmoji(job.Status, job.Conclusion)
			fmt.Printf("    %s %s: %s\n", status, job.Name, job.Status)
		}
	}
}

// displayFinalStatus 显示最终状态
func (m *Monitor) displayFinalStatus(run *types.WorkflowRun) {
	duration := run.UpdatedAt.Sub(run.CreatedAt)

	if run.Conclusion == "success" {
		fmt.Printf("✅ 工作流执行成功！\n")
	} else if run.Conclusion == "failure" {
		fmt.Printf("❌ 工作流执行失败\n")
	} else if run.Conclusion == "cancelled" {
		fmt.Printf("⚠️  工作流已取消\n")
	} else {
		fmt.Printf("⚠️  工作流结束: %s\n", run.Conclusion)
	}

	fmt.Printf("总耗时: %s\n", formatDuration(duration))

	// 显示每个 job 的状态
	if len(run.Jobs) > 0 {
		fmt.Printf("\n任务状态:\n")
		for _, job := range run.Jobs {
			status := m.getStatusEmoji(job.Status, job.Conclusion)
			jobDuration := job.CompletedAt.Sub(job.StartedAt)
			fmt.Printf("  %s %s (%s)\n", status, job.Name, formatDuration(jobDuration))
		}
	}
}

// getStatusEmoji 根据状态获取 emoji
func (m *Monitor) getStatusEmoji(status, conclusion string) string {
	if status == "completed" {
		switch conclusion {
		case "success":
			return "✅"
		case "failure":
			return "❌"
		case "cancelled":
			return "⚠️"
		case "skipped":
			return "⏭️"
		default:
			return "❓"
		}
	}

	switch status {
	case "queued":
		return "⏸️"
	case "in_progress":
		return "🔄"
	default:
		return "❓"
	}
}

// formatDuration 格式化持续时间
func formatDuration(d time.Duration) string {
	if d < time.Second {
		return "< 1s"
	}

	minutes := int(d.Minutes())
	seconds := int(d.Seconds()) % 60

	if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	}
	return fmt.Sprintf("%ds", seconds)
}


