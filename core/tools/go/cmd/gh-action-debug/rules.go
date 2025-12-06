package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/spf13/cobra"
)

var (
	exportForce   bool
	exportDryRun  bool
	exportTarget  string
)

var rulesCmd = &cobra.Command{
	Use:   "rules",
	Short: "管理 AI 规则文件",
	Long:  "管理 GitHub Actions 调试相关的 AI 规则文件（.mdc）",
}

var rulesExportCmd = &cobra.Command{
	Use:   "export [target-project]",
	Short: "导出规则文件到指定项目",
	Long: `将 GitHub Actions 调试规则导出到指定项目的 .cursor/rules/ 目录

示例:
  # 导出到当前目录
  gh-action-debug rules export

  # 导出到指定项目
  gh-action-debug rules export /path/to/project

  # 强制覆盖已存在的文件
  gh-action-debug rules export --force

  # 预览模式（不实际写入）
  gh-action-debug rules export --dry-run`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		// 确定目标项目路径
		targetDir := "."
		if len(args) > 0 {
			targetDir = args[0]
		}
		if exportTarget != "" {
			targetDir = exportTarget
		}

		// 转换为绝对路径
		absTargetDir, err := filepath.Abs(targetDir)
		if err != nil {
			return fmt.Errorf("无法解析目标路径: %w", err)
		}

		// 检查目标目录是否存在
		if _, err := os.Stat(absTargetDir); os.IsNotExist(err) {
			return fmt.Errorf("目标目录不存在: %s", absTargetDir)
		}

		// 查找规则源目录
		rulesSourceDir, err := findRulesSourceDir()
		if err != nil {
			return fmt.Errorf("无法找到规则文件: %w", err)
		}

		// 目标规则目录
		rulesTargetDir := filepath.Join(absTargetDir, ".cursor", "rules", "github-actions")

		if exportDryRun {
			fmt.Println("🔍 预览模式（不会实际写入文件）")
			fmt.Println()
		}

		fmt.Printf("📂 源目录: %s\n", rulesSourceDir)
		fmt.Printf("📂 目标目录: %s\n", rulesTargetDir)
		fmt.Println()

		// 获取所有 .mdc 文件
		files, err := filepath.Glob(filepath.Join(rulesSourceDir, "*.mdc"))
		if err != nil {
			return fmt.Errorf("无法读取规则文件: %w", err)
		}

		if len(files) == 0 {
			return fmt.Errorf("未找到规则文件 (*.mdc)")
		}

		// 创建目标目录
		if !exportDryRun {
			if err := os.MkdirAll(rulesTargetDir, 0755); err != nil {
				return fmt.Errorf("无法创建目标目录: %w", err)
			}
		}

		// 复制文件（过滤掉 macOS 的 ._ 隐藏文件）
		var exported, skipped int
		for _, srcFile := range files {
			fileName := filepath.Base(srcFile)
			
			// 跳过 macOS 隐藏文件
			if strings.HasPrefix(fileName, "._") {
				continue
			}
			dstFile := filepath.Join(rulesTargetDir, fileName)

			// 检查目标文件是否存在
			if _, err := os.Stat(dstFile); err == nil && !exportForce {
				fmt.Printf("⏭️  跳过 %s (已存在，使用 --force 覆盖)\n", fileName)
				skipped++
				continue
			}

			if exportDryRun {
				fmt.Printf("📄 将导出 %s\n", fileName)
				exported++
				continue
			}

			// 复制文件
			if err := copyFile(srcFile, dstFile); err != nil {
				return fmt.Errorf("无法复制 %s: %w", fileName, err)
			}
			fmt.Printf("✅ 已导出 %s\n", fileName)
			exported++
		}

		fmt.Println()
		if exportDryRun {
			fmt.Printf("📊 预览: 将导出 %d 个文件，跳过 %d 个文件\n", exported, skipped)
		} else {
			fmt.Printf("📊 完成: 导出 %d 个文件，跳过 %d 个文件\n", exported, skipped)
			fmt.Println()
			fmt.Println("💡 提示: 规则文件已导出到项目的 .cursor/rules/github-actions/ 目录")
			fmt.Println("   Cursor IDE 会自动加载这些规则")
		}

		return nil
	},
}

var rulesListCmd = &cobra.Command{
	Use:   "list",
	Short: "列出可用的规则文件",
	RunE: func(cmd *cobra.Command, args []string) error {
		rulesSourceDir, err := findRulesSourceDir()
		if err != nil {
			return fmt.Errorf("无法找到规则文件: %w", err)
		}

		files, err := filepath.Glob(filepath.Join(rulesSourceDir, "*.mdc"))
		if err != nil {
			return fmt.Errorf("无法读取规则文件: %w", err)
		}

		if len(files) == 0 {
			fmt.Println("未找到规则文件")
			return nil
		}

		// 过滤掉 macOS 的 ._ 隐藏文件
		var validFiles []string
		for _, file := range files {
			fileName := filepath.Base(file)
			if !strings.HasPrefix(fileName, "._") {
				validFiles = append(validFiles, file)
			}
		}

		fmt.Printf("📋 可用的规则文件 (%d 个):\n\n", len(validFiles))
		for _, file := range validFiles {
			fileName := filepath.Base(file)
			info, _ := os.Stat(file)
			size := "未知"
			if info != nil {
				size = formatFileSize(info.Size())
			}
			fmt.Printf("  • %s (%s)\n", fileName, size)
		}

		fmt.Println()
		fmt.Printf("📂 规则目录: %s\n", rulesSourceDir)

		return nil
	},
}

func init() {
	// export 命令标志
	rulesExportCmd.Flags().BoolVarP(&exportForce, "force", "f", false, "强制覆盖已存在的文件")
	rulesExportCmd.Flags().BoolVar(&exportDryRun, "dry-run", false, "预览模式，不实际写入文件")
	rulesExportCmd.Flags().StringVarP(&exportTarget, "target", "t", "", "目标项目路径")

	// 添加子命令
	rulesCmd.AddCommand(rulesExportCmd)
	rulesCmd.AddCommand(rulesListCmd)
}

// findRulesSourceDir 查找规则文件的源目录
func findRulesSourceDir() (string, error) {
	// 1. 首先检查环境变量
	if envDir := os.Getenv("GH_ACTION_DEBUG_RULES_DIR"); envDir != "" {
		if _, err := os.Stat(envDir); err == nil {
			return envDir, nil
		}
	}

	// 2. 检查可执行文件所在目录的相对路径
	execPath, err := os.Executable()
	if err == nil {
		execDir := filepath.Dir(execPath)
		
		// 可能的相对路径
		possiblePaths := []string{
			filepath.Join(execDir, "..", "..", "..", "rules"),           // 从 dist 目录
			filepath.Join(execDir, "..", "..", "rules"),                 // 从 go 目录
			filepath.Join(execDir, "rules"),                             // 同级目录
		}
		
		for _, p := range possiblePaths {
			absPath, _ := filepath.Abs(p)
			if _, err := os.Stat(absPath); err == nil {
				// 检查是否有 .mdc 文件
				if files, _ := filepath.Glob(filepath.Join(absPath, "*.mdc")); len(files) > 0 {
					return absPath, nil
				}
			}
		}
	}

	// 3. 检查 cursortoolset 安装目录
	homeDir, err := os.UserHomeDir()
	if err == nil {
		cursortoolsetPaths := []string{
			filepath.Join(homeDir, ".cursortoolsets", "repos", "github-action-toolset", "rules"),
			filepath.Join(homeDir, ".cursortoolsets", "repos", "github-action-toolset", "core", "rules"),
		}
		
		for _, p := range cursortoolsetPaths {
			if _, err := os.Stat(p); err == nil {
				if files, _ := filepath.Glob(filepath.Join(p, "*.mdc")); len(files) > 0 {
					return p, nil
				}
			}
		}
	}

	// 4. 检查当前工作目录
	cwd, err := os.Getwd()
	if err == nil {
		cwdPaths := []string{
			filepath.Join(cwd, "rules"),
			filepath.Join(cwd, "core", "rules"),
		}
		
		for _, p := range cwdPaths {
			if _, err := os.Stat(p); err == nil {
				if files, _ := filepath.Glob(filepath.Join(p, "*.mdc")); len(files) > 0 {
					return p, nil
				}
			}
		}
	}

	// 5. 检查 Go 模块路径（开发模式）
	gopath := os.Getenv("GOPATH")
	if gopath == "" {
		gopath = filepath.Join(homeDir, "go")
	}
	
	modulePaths := []string{
		filepath.Join(gopath, "src", "github.com", "shichao402", "GithubActionAISelfBuilder", "rules"),
		filepath.Join(gopath, "pkg", "mod", "github.com", "shichao402", "GithubActionAISelfBuilder@*", "rules"),
	}
	
	for _, pattern := range modulePaths {
		matches, _ := filepath.Glob(pattern)
		for _, p := range matches {
			if files, _ := filepath.Glob(filepath.Join(p, "*.mdc")); len(files) > 0 {
				return p, nil
			}
		}
	}

	return "", fmt.Errorf("无法找到规则目录，请设置环境变量 GH_ACTION_DEBUG_RULES_DIR 或确保规则文件在正确位置")
}

// copyFile 复制文件
func copyFile(src, dst string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	if err != nil {
		return err
	}

	// 保持文件权限
	sourceInfo, err := os.Stat(src)
	if err != nil {
		return err
	}
	
	return os.Chmod(dst, sourceInfo.Mode())
}

// formatFileSize 格式化文件大小
func formatFileSize(size int64) string {
	const (
		KB = 1024
		MB = KB * 1024
	)
	
	switch {
	case size >= MB:
		return fmt.Sprintf("%.2f MB", float64(size)/MB)
	case size >= KB:
		return fmt.Sprintf("%.2f KB", float64(size)/KB)
	default:
		return fmt.Sprintf("%d B", size)
	}
}

// getRuntimeInfo 获取运行时信息（用于调试）
func getRuntimeInfo() string {
	return fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH)
}

// isValidProjectDir 检查是否是有效的项目目录
func isValidProjectDir(dir string) bool {
	// 检查常见的项目标识文件
	indicators := []string{
		".git",
		"package.json",
		"go.mod",
		"Cargo.toml",
		"pyproject.toml",
		"requirements.txt",
		"pom.xml",
		"build.gradle",
		".cursor",
	}
	
	for _, indicator := range indicators {
		if _, err := os.Stat(filepath.Join(dir, indicator)); err == nil {
			return true
		}
	}
	
	return false
}

// suggestProjectDir 建议项目目录
func suggestProjectDir(dir string) string {
	absDir, _ := filepath.Abs(dir)
	
	// 向上查找项目根目录
	for {
		if isValidProjectDir(absDir) {
			return absDir
		}
		
		parent := filepath.Dir(absDir)
		if parent == absDir {
			break
		}
		absDir = parent
	}
	
	return dir
}

// Unused but kept for potential future use
var _ = strings.TrimSpace
