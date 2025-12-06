package main

import (
	"fmt"
	"os"

	"github.com/shichao402/GithubActionAISelfBuilder/core/tools/go/internal/config"
	"github.com/shichao402/GithubActionAISelfBuilder/core/tools/go/internal/debugger"
	"github.com/shichao402/GithubActionAISelfBuilder/core/tools/go/internal/github"
	"github.com/shichao402/GithubActionAISelfBuilder/core/tools/go/internal/output"
	"github.com/shichao402/GithubActionAISelfBuilder/core/tools/go/pkg/types"
	"github.com/spf13/cobra"
)

var (
	// Version 将在编译时注入
	Version = "dev"
	
	// 全局选项
	outputFormat string
	verbose      bool
	quiet        bool
	configFile   string
	
	// 全局客户端
	ghClient github.Client
)

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

var rootCmd = &cobra.Command{
	Use:   "gh-action-debug",
	Short: "GitHub Actions 调试工具",
	Long: `gh-action-debug - GitHub Actions 自动调试工具

一个用于自动触发、监控和调试 GitHub Actions 工作流的命令行工具。
专为 AI 助手设计，提供标准化的 JSON 输出。

使用示例:
  # 自动调试工作流
  gh-action-debug workflow debug .github/workflows/build.yml main

  # 带参数触发
  gh-action-debug workflow debug .github/workflows/release.yml main --input version=1.0.0

  # JSON 输出（供 AI 使用）
  gh-action-debug workflow debug .github/workflows/build.yml main --output json

更多信息: https://github.com/shichao402/GithubActionAISelfBuilder`,
	Version: Version,
}

func init() {
	// 全局标志
	rootCmd.PersistentFlags().StringVarP(&outputFormat, "output", "o", "human", "输出格式 (json|human)")
	rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "详细输出")
	rootCmd.PersistentFlags().BoolVarP(&quiet, "quiet", "q", false, "静默模式")
	rootCmd.PersistentFlags().StringVarP(&configFile, "config", "c", "", "配置文件路径")
	
	// 添加子命令
	rootCmd.AddCommand(workflowCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(rulesCmd)
	
	// 添加 PersistentPreRun 来初始化配置和客户端
	rootCmd.PersistentPreRunE = func(cmd *cobra.Command, args []string) error {
		// rules 命令不需要 GitHub 客户端
		if cmd.Parent() != nil && cmd.Parent().Use == "rules" {
			return nil
		}
		if cmd.Use == "rules" {
			return nil
		}
		return initializeClient()
	}
}

// initializeClient 初始化配置和 GitHub 客户端
func initializeClient() error {
	// 加载配置
	cfg, err := config.Load(configFile)
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}
	
	// 如果命令行指定了输出格式，覆盖配置文件
	if outputFormat != "" {
		cfg.Output.Format = outputFormat
	}
	
	// 创建 GitHub 客户端
	client, err := github.NewClient(cfg)
	if err != nil {
		return fmt.Errorf("failed to create GitHub client: %w", err)
	}
	
	ghClient = client
	
	if verbose {
		fmt.Printf("✅ 配置加载成功\n")
		fmt.Printf("   仓库: %s/%s\n", cfg.GitHub.Owner, cfg.GitHub.Repo)
		fmt.Printf("   输出格式: %s\n", cfg.Output.Format)
	}
	
	return nil
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "显示版本信息",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("gh-action-debug version %s\n", Version)
	},
}

var workflowCmd = &cobra.Command{
	Use:   "workflow",
	Short: "工作流操作",
	Long:  "管理和调试 GitHub Actions 工作流",
}

func init() {
	// workflow 子命令
	workflowCmd.AddCommand(debugCmd)
	workflowCmd.AddCommand(triggerCmd)
	workflowCmd.AddCommand(watchCmd)
	workflowCmd.AddCommand(logsCmd)
	workflowCmd.AddCommand(analyzeCmd)
	workflowCmd.AddCommand(testCmd)
	workflowCmd.AddCommand(listCmd)
}

var (
	debugInputs []string // --input key=value 格式
)

var debugCmd = &cobra.Command{
	Use:   "debug <workflow-file> [ref]",
	Short: "自动调试工作流（完整流程）",
	Long: `自动调试 GitHub Actions 工作流

此命令会执行完整的调试流程:
1. 触发工作流
2. 监控执行状态
3. 如果失败，收集错误日志
4. 分析错误并提供修复建议

示例:
  gh-action-debug workflow debug .github/workflows/build.yml main
  gh-action-debug workflow debug .github/workflows/release.yml main --input version=1.0.0
  gh-action-debug workflow debug .github/workflows/build.yml main --output json`,
	Args: cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		workflowFile := args[0]
		ref := "main"
		if len(args) > 1 {
			ref = args[1]
		}
		
		// 解析 inputs
		inputs := parseInputs(debugInputs)
		
		// 创建调试器
		cfg := config.GetGlobal()
		dbg := debugger.NewDebugger(ghClient, cfg, verbose)
		
		// 执行调试
		result, err := dbg.Debug(workflowFile, ref, inputs)
		if err != nil {
			return fmt.Errorf("debug failed: %w", err)
		}
		
		// 格式化输出
		if err := formatOutput(result, cfg.Output.Format); err != nil {
			return fmt.Errorf("failed to format output: %w", err)
		}
		
		// 如果失败，返回错误退出码
		if !result.Success {
			os.Exit(1)
		}
		
		return nil
	},
}

func init() {
	debugCmd.Flags().StringArrayVarP(&debugInputs, "input", "f", []string{}, "工作流输入参数 (key=value)")
}

var (
	triggerInputs []string // --input key=value 格式
)

var triggerCmd = &cobra.Command{
	Use:   "trigger <workflow-file> [ref]",
	Short: "触发工作流",
	Args:  cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		workflowFile := args[0]
		ref := "main"
		if len(args) > 1 {
			ref = args[1]
		}
		
		// 解析 inputs
		inputs := parseInputs(triggerInputs)
		
		fmt.Printf("🚀 触发工作流: %s (ref: %s)\n", workflowFile, ref)
		
		// 触发工作流
		result, err := ghClient.TriggerWorkflow(workflowFile, ref, inputs)
		if err != nil {
			return fmt.Errorf("failed to trigger workflow: %w", err)
		}
		
		fmt.Printf("✅ %s\n", result.Message)
		fmt.Printf("🔗 URL: %s\n", result.RunURL)
		fmt.Printf("🆔 Run ID: %d\n", result.RunID)
		
		return nil
	},
}

func init() {
	triggerCmd.Flags().StringArrayVarP(&triggerInputs, "input", "f", []string{}, "工作流输入参数 (key=value)")
}

// parseInputs 解析 key=value 格式的输入
func parseInputs(inputs []string) map[string]string {
	result := make(map[string]string)
	for _, input := range inputs {
		parts := splitKeyValue(input)
		if len(parts) == 2 {
			result[parts[0]] = parts[1]
		}
	}
	return result
}

// splitKeyValue 分割 key=value 字符串
func splitKeyValue(s string) []string {
	for i, c := range s {
		if c == '=' {
			return []string{s[:i], s[i+1:]}
		}
	}
	return []string{s}
}

// formatOutput 格式化输出
func formatOutput(result interface{}, format string) error {
	var outputStr string
	var err error
	
	switch format {
	case "json":
		switch v := result.(type) {
		case *types.DebugResult:
			outputStr, err = output.FormatJSON(v)
		case *types.TriggerResult:
			outputStr, err = output.FormatTriggerResultJSON(v)
		case *types.TestResult:
			outputStr, err = output.FormatTestResultJSON(v)
		default:
			return fmt.Errorf("unsupported result type for JSON output")
		}
		
		if err != nil {
			return err
		}
		fmt.Println(outputStr)
		
	case "human":
		switch v := result.(type) {
		case *types.DebugResult:
			outputStr = output.FormatHuman(v)
		case *types.TriggerResult:
			outputStr = output.FormatTriggerResultHuman(v)
		case *types.TestResult:
			outputStr = output.FormatTestResultHuman(v)
		default:
			return fmt.Errorf("unsupported result type for human output")
		}
		fmt.Print(outputStr)
		
	default:
		return fmt.Errorf("unsupported output format: %s", format)
	}
	
	return nil
}

var watchCmd = &cobra.Command{
	Use:   "watch <run-id>",
	Short: "监控工作流执行",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		// TODO: 实现监控逻辑
		fmt.Println("⚠️  功能开发中...")
	},
}

var logsCmd = &cobra.Command{
	Use:   "logs <run-id>",
	Short: "获取工作流日志",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		// TODO: 实现日志获取逻辑
		fmt.Println("⚠️  功能开发中...")
	},
}

var analyzeCmd = &cobra.Command{
	Use:   "analyze <run-id>",
	Short: "分析工作流错误",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		// TODO: 实现分析逻辑
		fmt.Println("⚠️  功能开发中...")
	},
}

var testCmd = &cobra.Command{
	Use:   "test",
	Short: "批量测试工作流",
	Run: func(cmd *cobra.Command, args []string) {
		// TODO: 实现测试逻辑
		fmt.Println("⚠️  功能开发中...")
	},
}

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "列出所有工作流",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("📋 列出所有工作流...")
		
		workflows, err := ghClient.ListWorkflows()
		if err != nil {
			return fmt.Errorf("failed to list workflows: %w", err)
		}
		
		if len(workflows) == 0 {
			fmt.Println("没有找到工作流")
			return nil
		}
		
		fmt.Printf("\n找到 %d 个工作流:\n\n", len(workflows))
		for i, wf := range workflows {
			fmt.Printf("%d. %s\n", i+1, wf.Name)
			fmt.Printf("   路径: %s\n", wf.Path)
			if i < len(workflows)-1 {
				fmt.Println()
			}
		}
		
		return nil
	},
}

