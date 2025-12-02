package output

import (
	"encoding/json"
	"fmt"

	"github.com/firoyang/github-action-toolset/pkg/types"
)

// FormatJSON 格式化为 JSON 输出
func FormatJSON(result *types.DebugResult) (string, error) {
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}
	return string(data), nil
}

// FormatTriggerResultJSON 格式化触发结果为 JSON
func FormatTriggerResultJSON(result *types.TriggerResult) (string, error) {
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}
	return string(data), nil
}

// FormatTestResultJSON 格式化测试结果为 JSON
func FormatTestResultJSON(result *types.TestResult) (string, error) {
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}
	return string(data), nil
}


