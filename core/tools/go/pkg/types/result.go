package types

// DebugResult 表示调试结果
type DebugResult struct {
	Success     bool          `json:"success"`
	RunID       int64         `json:"run_id"`
	RunURL      string        `json:"run_url"`
	Status      string        `json:"status"`
	Duration    int           `json:"duration"` // 秒
	Jobs        []JobResult   `json:"jobs"`
	Errors      []ErrorInfo   `json:"errors"`
	Suggestions []string      `json:"suggestions"`
}

// JobResult 表示任务结果
type JobResult struct {
	Name       string       `json:"name"`
	Status     string       `json:"status"`
	Conclusion string       `json:"conclusion"`
	Duration   int          `json:"duration"` // 秒
	Steps      []StepResult `json:"steps"`
}

// StepResult 表示步骤结果
type StepResult struct {
	Name       string `json:"name"`
	Status     string `json:"status"`
	Conclusion string `json:"conclusion"`
	Duration   int    `json:"duration"` // 秒
	Logs       string `json:"logs,omitempty"`
}

// ErrorInfo 表示错误信息
type ErrorInfo struct {
	Job         string   `json:"job"`
	Step        string   `json:"step"`
	ErrorType   string   `json:"error_type"`
	Message     string   `json:"message"`
	Suggestions []string `json:"suggestions"`
}

// TriggerResult 表示触发结果
type TriggerResult struct {
	Success bool   `json:"success"`
	RunID   int64  `json:"run_id"`
	RunURL  string `json:"run_url"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

// TestResult 表示批量测试结果
type TestResult struct {
	Total   int               `json:"total"`
	Passed  int               `json:"passed"`
	Failed  int               `json:"failed"`
	Results []WorkflowTestResult `json:"results"`
}

// WorkflowTestResult 表示单个 workflow 测试结果
type WorkflowTestResult struct {
	Workflow string      `json:"workflow"`
	Status   string      `json:"status"`
	Duration int         `json:"duration"`
	Errors   []ErrorInfo `json:"errors,omitempty"`
}


