package types

import "time"

// WorkflowFile 表示一个 workflow 文件
type WorkflowFile struct {
	Path string `json:"path"`
	Name string `json:"name"`
}

// WorkflowRun 表示一次 workflow 运行
type WorkflowRun struct {
	ID         int64     `json:"id"`
	RunNumber  int       `json:"run_number"`
	Status     string    `json:"status"` // queued, in_progress, completed
	Conclusion string    `json:"conclusion"` // success, failure, cancelled, skipped
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	URL        string    `json:"url"`
	Jobs       []Job     `json:"jobs"`
}

// Job 表示 workflow 中的一个任务
type Job struct {
	ID         int64     `json:"id"`
	Name       string    `json:"name"`
	Status     string    `json:"status"`
	Conclusion string    `json:"conclusion"`
	StartedAt  time.Time `json:"started_at"`
	CompletedAt time.Time `json:"completed_at"`
	Steps      []Step    `json:"steps"`
}

// Step 表示 job 中的一个步骤
type Step struct {
	Name       string    `json:"name"`
	Status     string    `json:"status"`
	Conclusion string    `json:"conclusion"`
	Number     int       `json:"number"`
	StartedAt  time.Time `json:"started_at"`
	CompletedAt time.Time `json:"completed_at"`
	Logs       string    `json:"logs,omitempty"`
}

// WorkflowInput 表示 workflow 输入参数
type WorkflowInput struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

