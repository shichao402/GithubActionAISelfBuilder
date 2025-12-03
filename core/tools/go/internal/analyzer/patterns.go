package analyzer

import (
	"regexp"
	"strings"
)

// ErrorPattern 错误模式
type ErrorPattern struct {
	Pattern     *regexp.Regexp
	Type        string
	Category    string // 错误分类：environment, permission, network, build, etc.
	Description string
	Suggestions func(matches []string) []string
}

// CommonPatterns 通用错误模式（不涉及具体技术栈）
var CommonPatterns = []ErrorPattern{
	// 依赖缺失（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(cannot find|not found|missing|not installed).*?(module|package|dependency|library)`),
		Type:        "missing_dependency",
		Category:    "dependency",
		Description: "缺少依赖项",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if all required dependencies are declared in dependency files",
				"Verify that dependency files are committed to the repository",
				"Review the dependency installation step in the workflow",
				"Check if the dependency manager cache needs to be cleared",
			}
		},
	},

	// 权限错误（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(permission denied|access denied|403 forbidden|unauthorized access)`),
		Type:        "permission_error",
		Category:    "permission",
		Description: "权限不足",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check workflow permissions in the workflow file",
				"Verify that the GITHUB_TOKEN has required permissions",
				"Review repository settings for GitHub Actions permissions",
				"Check if file or directory permissions are correct",
			}
		},
	},

	// 认证错误（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(authentication failed|401 unauthorized|bad credentials|invalid token|unauthorized)`),
		Type:        "auth_error",
		Category:    "authentication",
		Description: "认证失败",
		Suggestions: func(matches []string) []string {
			return []string{
				"Verify that authentication tokens are correctly configured",
				"Check if tokens have the required permissions",
				"Verify that tokens have not expired",
				"Review secret configuration in repository settings",
			}
		},
	},

	// 文件不存在（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(no such file|file not found|enoent|does not exist)`),
		Type:        "file_not_found",
		Category:    "file_system",
		Description: "文件或目录不存在",
		Suggestions: func(matches []string) []string {
			return []string{
				"Verify that the file exists in the repository",
				"Check if the file path is correct",
				"Ensure the file is committed to the repository",
				"Review the working-directory configuration in the workflow",
			}
		},
	},

	// 命令不存在（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(command not found|not recognized|not found in path|executable not found)`),
		Type:        "command_not_found",
		Category:    "environment",
		Description: "命令或工具不存在",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if the required tool is installed in the runner",
				"Add a setup step to install the required tool",
				"Verify that the tool is available in the PATH",
				"Check if the tool version is compatible with the runner",
			}
		},
	},

	// 测试失败（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(test.*failed|tests failed|test failure|assertion failed)`),
		Type:        "test_failure",
		Category:    "testing",
		Description: "测试失败",
		Suggestions: func(matches []string) []string {
			return []string{
				"Review the test logs for specific failure details",
				"Run tests locally to reproduce the issue",
				"Check if test environment setup is correct",
				"Verify that test data or fixtures are available",
			}
		},
	},

	// 构建/编译错误（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(build failed|compilation error|syntax error|build error|compilation failed)`),
		Type:        "build_failure",
		Category:    "compilation",
		Description: "构建或编译错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Review the build logs for specific compilation errors",
				"Check for syntax errors in source code",
				"Verify that all required build tools are installed",
				"Check if build configuration is correct",
			}
		},
	},

	// 网络错误（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(connection.*refused|connection.*timed out|network.*error|etimedout|econnrefused|dns.*error)`),
		Type:        "network_error",
		Category:    "network",
		Description: "网络连接错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if external services or APIs are accessible",
				"Verify network connectivity from the runner",
				"Review firewall or proxy settings",
				"Consider adding retry logic for network requests",
			}
		},
	},

	// 超时错误（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(timeout|timed out|execution timeout|operation timed out)`),
		Type:        "timeout",
		Category:    "performance",
		Description: "操作超时",
		Suggestions: func(matches []string) []string {
			return []string{
				"Increase the timeout duration if appropriate",
				"Check if the operation is taking longer than expected",
				"Review resource availability (CPU, memory, disk)",
				"Consider optimizing the operation or breaking it into smaller steps",
			}
		},
	},

	// 磁盘空间不足（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(no space left|disk.*full|disk quota|out of disk space)`),
		Type:        "disk_space",
		Category:    "resource",
		Description: "磁盘空间不足",
		Suggestions: func(matches []string) []string {
			return []string{
				"Clean up unnecessary files or build artifacts",
				"Remove unused dependencies or cached files",
				"Consider using a runner with more disk space",
				"Review artifact retention settings",
			}
		},
	},

	// Git 错误（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(fatal:.*does not exist|not a git repository|git.*error|fatal:.*not found)`),
		Type:        "git_error",
		Category:    "version_control",
		Description: "Git 操作错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Verify that the git repository is properly initialized",
				"Check if the branch or tag exists",
				"Review git configuration and credentials",
				"Ensure the checkout action is correctly configured",
			}
		},
	},

	// Docker 错误（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(docker.*error|cannot connect.*docker|docker daemon|docker.*failed)`),
		Type:        "docker_error",
		Category:    "container",
		Description: "Docker 相关错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Verify that Docker is available in the runner",
				"Check if the runner supports Docker",
				"Review Docker daemon status and configuration",
				"Ensure Docker commands have proper permissions",
			}
		},
	},

	// 内存不足（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(out of memory|oom|memory.*error|allocation failed)`),
		Type:        "memory_error",
		Category:    "resource",
		Description: "内存不足",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if the operation requires more memory than available",
				"Consider using a runner with more memory",
				"Review memory usage and optimize if possible",
				"Check for memory leaks in the code",
			}
		},
	},

	// 脚本执行失败（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(script.*failed|execution.*failed|phase.*failed|non-zero exit)`),
		Type:        "script_failure",
		Category:    "execution",
		Description: "脚本执行失败",
		Suggestions: func(matches []string) []string {
			return []string{
				"Review the script logs for specific error messages",
				"Check if the script has proper permissions",
				"Verify that all required environment variables are set",
				"Test the script locally to identify the issue",
			}
		},
	},

	// 配置错误（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(configuration.*error|invalid.*config|config.*not found|misconfiguration)`),
		Type:        "config_error",
		Category:    "configuration",
		Description: "配置错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Review configuration files for syntax errors",
				"Verify that all required configuration values are set",
				"Check if configuration files are in the correct format",
				"Ensure configuration files are committed to the repository",
			}
		},
	},

	// 版本不兼容（通用）
	{
		Pattern:     regexp.MustCompile(`(?i)(version.*incompatible|incompatible.*version|version.*mismatch|requires.*version)`),
		Type:        "version_mismatch",
		Category:    "compatibility",
		Description: "版本不兼容",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if the tool or dependency version is compatible",
				"Review version requirements in dependency files",
				"Verify that the runner has the required version",
				"Consider updating or downgrading versions if appropriate",
			}
		},
	},
}

// MatchPattern 匹配错误模式
// 返回第一个匹配的模式
func MatchPattern(log string) *ErrorPattern {
	logLower := strings.ToLower(log)
	
	for _, pattern := range CommonPatterns {
		if pattern.Pattern.MatchString(logLower) {
			return &pattern
		}
	}
	return nil
}

// MatchAllPatterns 匹配所有错误模式
// 返回所有匹配的模式（按优先级排序）
func MatchAllPatterns(log string) []*ErrorPattern {
	logLower := strings.ToLower(log)
	var matches []*ErrorPattern
	
	for i := range CommonPatterns {
		pattern := &CommonPatterns[i]
		if pattern.Pattern.MatchString(logLower) {
			matches = append(matches, pattern)
		}
	}
	
	return matches
}

// ExtractMatches 提取匹配的内容
func ExtractMatches(pattern *ErrorPattern, log string) []string {
	if pattern == nil {
		return nil
	}
	return pattern.Pattern.FindStringSubmatch(log)
}

// GetCategoryDescription 获取错误分类的描述
func GetCategoryDescription(category string) string {
	descriptions := map[string]string{
		"dependency":      "依赖相关",
		"permission":      "权限相关",
		"authentication":  "认证相关",
		"file_system":     "文件系统相关",
		"environment":     "环境配置相关",
		"testing":         "测试相关",
		"compilation":     "编译构建相关",
		"network":         "网络相关",
		"performance":     "性能相关",
		"resource":        "资源相关",
		"version_control": "版本控制相关",
		"container":       "容器相关",
		"execution":       "执行相关",
		"configuration":  "配置相关",
		"compatibility":  "兼容性相关",
	}
	
	if desc, ok := descriptions[category]; ok {
		return desc
	}
	return "未知分类"
}
