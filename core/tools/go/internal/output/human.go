package output

import (
	"fmt"
	"strings"

	"github.com/shichao402/GithubActionAISelfBuilder/core/tools/go/pkg/types"
)

// FormatHuman 格式化为人类可读的输出
func FormatHuman(result *types.DebugResult) string {
	var buf strings.Builder

	// 标题
	buf.WriteString("==============================================\n")
	buf.WriteString("  GitHub Actions 调试结果\n")
	buf.WriteString("==============================================\n\n")

	// 基本信息
	buf.WriteString(fmt.Sprintf("🆔 Run ID: %d\n", result.RunID))
	buf.WriteString(fmt.Sprintf("🔗 URL: %s\n", result.RunURL))
	buf.WriteString(fmt.Sprintf("⏱️  Duration: %s\n", formatDuration(result.Duration)))
	buf.WriteString("\n")

	// 状态
	if result.Success {
		buf.WriteString("✅ 状态: 成功\n")
	} else {
		buf.WriteString("❌ 状态: 失败\n")
	}
	buf.WriteString("\n")

	// Jobs 状态
	if len(result.Jobs) > 0 {
		buf.WriteString("📋 任务状态:\n")
		for _, job := range result.Jobs {
			status := getStatusIcon(job.Conclusion)
			buf.WriteString(fmt.Sprintf("  %s %s (%s)\n",
				status, job.Name, formatDuration(job.Duration)))
		}
		buf.WriteString("\n")
	}

	// 错误信息
	if len(result.Errors) > 0 {
		buf.WriteString("❌ 错误详情:\n\n")
		for i, err := range result.Errors {
			buf.WriteString(fmt.Sprintf("%d. 任务: %s / 步骤: %s\n", i+1, err.Job, err.Step))
			buf.WriteString(fmt.Sprintf("   类型: %s\n", err.ErrorType))
			buf.WriteString(fmt.Sprintf("   消息: %s\n", err.Message))
			
			if len(err.Suggestions) > 0 {
				buf.WriteString("   建议:\n")
				for _, suggestion := range err.Suggestions {
					buf.WriteString(fmt.Sprintf("     • %s\n", suggestion))
				}
			}
			
			if i < len(result.Errors)-1 {
				buf.WriteString("\n")
			}
		}
		buf.WriteString("\n")
	}

	// 总体建议
	if len(result.Suggestions) > 0 {
		buf.WriteString("💡 修复建议:\n")
		for _, suggestion := range result.Suggestions {
			buf.WriteString(fmt.Sprintf("  • %s\n", suggestion))
		}
		buf.WriteString("\n")
	}

	buf.WriteString("==============================================\n")

	return buf.String()
}

// FormatTriggerResultHuman 格式化触发结果为人类可读输出
func FormatTriggerResultHuman(result *types.TriggerResult) string {
	var buf strings.Builder

	if result.Success {
		buf.WriteString("✅ 工作流触发成功\n\n")
		buf.WriteString(fmt.Sprintf("🆔 Run ID: %d\n", result.RunID))
		buf.WriteString(fmt.Sprintf("🔗 URL: %s\n", result.RunURL))
		if result.Message != "" {
			buf.WriteString(fmt.Sprintf("📝 %s\n", result.Message))
		}
	} else {
		buf.WriteString("❌ 工作流触发失败\n\n")
		if result.Error != "" {
			buf.WriteString(fmt.Sprintf("错误: %s\n", result.Error))
		}
	}

	return buf.String()
}

// FormatTestResultHuman 格式化测试结果为人类可读输出
func FormatTestResultHuman(result *types.TestResult) string {
	var buf strings.Builder

	buf.WriteString("==============================================\n")
	buf.WriteString("  批量测试结果\n")
	buf.WriteString("==============================================\n\n")

	buf.WriteString(fmt.Sprintf("总计: %d 个工作流\n", result.Total))
	buf.WriteString(fmt.Sprintf("✅ 成功: %d\n", result.Passed))
	buf.WriteString(fmt.Sprintf("❌ 失败: %d\n\n", result.Failed))

	if len(result.Results) > 0 {
		buf.WriteString("详细结果:\n\n")
		for i, r := range result.Results {
			status := getStatusIcon(r.Status)
			buf.WriteString(fmt.Sprintf("%d. %s %s (%s)\n",
				i+1, status, r.Workflow, formatDuration(r.Duration)))
			
			if len(r.Errors) > 0 {
				buf.WriteString("   错误:\n")
				for _, err := range r.Errors {
					buf.WriteString(fmt.Sprintf("     • %s: %s\n", err.Step, err.Message))
				}
			}
			
			if i < len(result.Results)-1 {
				buf.WriteString("\n")
			}
		}
	}

	buf.WriteString("\n==============================================\n")

	return buf.String()
}

// getStatusIcon 根据状态获取图标
func getStatusIcon(status string) string {
	switch status {
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

// formatDuration 格式化持续时间
func formatDuration(seconds int) string {
	if seconds < 60 {
		return fmt.Sprintf("%ds", seconds)
	}
	
	minutes := seconds / 60
	secs := seconds % 60
	
	if minutes < 60 {
		return fmt.Sprintf("%dm %ds", minutes, secs)
	}
	
	hours := minutes / 60
	mins := minutes % 60
	
	return fmt.Sprintf("%dh %dm %ds", hours, mins, secs)
}


