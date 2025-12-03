package analyzer

import (
	"strings"

	"github.com/shichao402/GithubActionAISelfBuilder/core/tools/go/pkg/types"
)

// Analyzer 错误分析器
type Analyzer struct {
	verbose bool
}

// NewAnalyzer 创建新的分析器
func NewAnalyzer(verbose bool) *Analyzer {
	return &Analyzer{
		verbose: verbose,
	}
}

// AnalyzeRun 分析 workflow run，提取错误信息
func (a *Analyzer) AnalyzeRun(run *types.WorkflowRun) []types.ErrorInfo {
	var errors []types.ErrorInfo

	// 遍历所有 jobs
	for _, job := range run.Jobs {
		// 只分析失败的 jobs
		if job.Conclusion != "failure" {
			continue
		}

		// 遍历 job 中的所有 steps
		for _, step := range job.Steps {
			// 只分析失败的 steps
			if step.Conclusion != "failure" {
				continue
			}

			// 分析步骤日志
			errorInfo := a.analyzeStepLogs(job.Name, step)
			if errorInfo != nil {
				errors = append(errors, *errorInfo)
			}
		}
	}

	return errors
}

// analyzeStepLogs 分析步骤日志
func (a *Analyzer) analyzeStepLogs(jobName string, step types.Step) *types.ErrorInfo {
	if step.Logs == "" {
		return &types.ErrorInfo{
			Job:       jobName,
			Step:      step.Name,
			ErrorType: "unknown",
			Category:  "unknown",
			Message:   "Step failed but no logs available",
			Suggestions: []string{
				"Check the workflow logs manually",
				"Enable debug logging",
			},
		}
	}

	// 尝试匹配已知的错误模式
	pattern := MatchPattern(step.Logs)
	if pattern != nil {
		matches := ExtractMatches(pattern, step.Logs)

		// 提取错误消息（通常是第一个匹配）
		message := pattern.Description
		if len(matches) > 0 {
			message = matches[0]
		}

		return &types.ErrorInfo{
			Job:         jobName,
			Step:        step.Name,
			ErrorType:   pattern.Type,
			Category:    pattern.Category,
			Message:     message,
			Suggestions: pattern.Suggestions(matches),
		}
	}

	// 如果没有匹配到已知模式，提取关键错误信息
	errorMessage := extractErrorMessage(step.Logs)

	return &types.ErrorInfo{
		Job:       jobName,
		Step:      step.Name,
		ErrorType: "unknown",
		Category:  "unknown",
		Message:   errorMessage,
		Suggestions: []string{
			"Check the full logs for more details",
			"Search for the error message online",
			"Review the step configuration",
		},
	}
}

// extractErrorMessage 从日志中提取错误消息
func extractErrorMessage(logs string) string {
	lines := strings.Split(logs, "\n")

	// 查找包含 "error", "Error", "ERROR" 的行
	for _, line := range lines {
		lower := strings.ToLower(line)
		if strings.Contains(lower, "error:") ||
			strings.Contains(lower, "error ") ||
			strings.Contains(lower, "failed") ||
			strings.Contains(lower, "fatal:") {
			// 清理并返回这一行
			return strings.TrimSpace(line)
		}
	}

	// 如果没找到错误行，返回最后几行（通常错误在末尾）
	if len(lines) > 0 {
		// 返回最后一行非空行
		for i := len(lines) - 1; i >= 0; i-- {
			line := strings.TrimSpace(lines[i])
			if line != "" {
				return line
			}
		}
	}

	return "Step failed with unknown error"
}

// GenerateSummary 生成错误摘要
func (a *Analyzer) GenerateSummary(errors []types.ErrorInfo) string {
	if len(errors) == 0 {
		return "No errors found"
	}

	var summary strings.Builder
	summary.WriteString("Found ")
	summary.WriteString(string(rune(len(errors))))
	summary.WriteString(" error(s):\n\n")

	for i, err := range errors {
		summary.WriteString(string(rune(i + 1)))
		summary.WriteString(". ")
		summary.WriteString(err.Job)
		summary.WriteString(" / ")
		summary.WriteString(err.Step)
		summary.WriteString("\n")
		summary.WriteString("   Type: ")
		summary.WriteString(err.ErrorType)
		summary.WriteString("\n")
		summary.WriteString("   Message: ")
		summary.WriteString(err.Message)
		summary.WriteString("\n")

		if len(err.Suggestions) > 0 {
			summary.WriteString("   Suggestions:\n")
			for _, suggestion := range err.Suggestions {
				summary.WriteString("     - ")
				summary.WriteString(suggestion)
				summary.WriteString("\n")
			}
		}

		if i < len(errors)-1 {
			summary.WriteString("\n")
		}
	}

	return summary.String()
}
