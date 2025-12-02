package analyzer

import (
	"fmt"
	"regexp"
)

// ErrorPattern 错误模式
type ErrorPattern struct {
	Pattern     *regexp.Regexp
	Type        string
	Description string
	Suggestions func(matches []string) []string
}

// CommonPatterns 常见错误模式
var CommonPatterns = []ErrorPattern{
	// Node.js 依赖错误
	{
		Pattern:     regexp.MustCompile(`Cannot find module '(.+?)'`),
		Type:        "missing_dependency",
		Description: "缺少 Node.js 模块",
		Suggestions: func(matches []string) []string {
			if len(matches) > 1 {
				module := matches[1]
				return []string{
					fmt.Sprintf("Add '%s' to package.json dependencies", module),
					fmt.Sprintf("Run: npm install %s --save", module),
					"Check if package-lock.json is committed",
				}
			}
			return []string{"Check package.json dependencies"}
		},
	},

	// Python 依赖错误
	{
		Pattern:     regexp.MustCompile(`ModuleNotFoundError: No module named '(.+?)'`),
		Type:        "missing_python_module",
		Description: "缺少 Python 模块",
		Suggestions: func(matches []string) []string {
			if len(matches) > 1 {
				module := matches[1]
				return []string{
					fmt.Sprintf("Add '%s' to requirements.txt", module),
					fmt.Sprintf("Run: pip install %s", module),
					"Check if requirements.txt is correct",
				}
			}
			return []string{"Check requirements.txt"}
		},
	},

	// 权限错误
	{
		Pattern:     regexp.MustCompile(`permission denied|Permission denied|403 Forbidden`),
		Type:        "permission_error",
		Description: "权限不足",
		Suggestions: func(matches []string) []string {
			return []string{
				"Add 'contents: write' to workflow permissions",
				"Check GITHUB_TOKEN permissions",
				"Verify repository settings allow GitHub Actions",
			}
		},
	},

	// Token 错误
	{
		Pattern:     regexp.MustCompile(`authentication failed|401 Unauthorized|Bad credentials`),
		Type:        "auth_error",
		Description: "认证失败",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if GITHUB_TOKEN is correctly set",
				"Verify token has required permissions",
				"Check if token has expired",
			}
		},
	},

	// 文件不存在
	{
		Pattern:     regexp.MustCompile(`No such file or directory: '(.+?)'|ENOENT.*'(.+?)'`),
		Type:        "file_not_found",
		Description: "文件不存在",
		Suggestions: func(matches []string) []string {
			var file string
			if len(matches) > 1 {
				file = matches[1]
				if file == "" && len(matches) > 2 {
					file = matches[2]
				}
			}

			suggestions := []string{
				"Check if the file exists in the repository",
				"Verify the file path is correct",
			}

			if file != "" {
				suggestions = append(suggestions,
					fmt.Sprintf("Check if '%s' is committed", file))
			}

			return suggestions
		},
	},

	// 命令不存在
	{
		Pattern:     regexp.MustCompile(`command not found: (.+)|'(.+?)' is not recognized`),
		Type:        "command_not_found",
		Description: "命令不存在",
		Suggestions: func(matches []string) []string {
			var cmd string
			if len(matches) > 1 {
				cmd = matches[1]
				if cmd == "" && len(matches) > 2 {
					cmd = matches[2]
				}
			}

			suggestions := []string{
				"Check if the required tool is installed",
				"Add a setup step to install the tool",
			}

			if cmd != "" {
				suggestions = append(suggestions,
					fmt.Sprintf("Install '%s' before using it", cmd))
			}

			return suggestions
		},
	},

	// 测试失败
	{
		Pattern:     regexp.MustCompile(`(\d+) failed|FAIL: (.+)|Tests failed`),
		Type:        "test_failure",
		Description: "测试失败",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check the test logs for details",
				"Run tests locally to reproduce the issue",
				"Fix failing tests before pushing",
			}
		},
	},

	// 编译错误
	{
		Pattern:     regexp.MustCompile(`SyntaxError|compilation failed|build failed`),
		Type:        "build_error",
		Description: "构建/编译错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check the compilation errors in logs",
				"Run build locally to identify the issue",
				"Fix syntax errors in source code",
			}
		},
	},

	// 网络错误
	{
		Pattern:     regexp.MustCompile(`ETIMEDOUT|ECONNREFUSED|Connection timed out|network error`),
		Type:        "network_error",
		Description: "网络连接错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if external services are accessible",
				"Add retry logic for network requests",
				"Verify firewall/proxy settings",
			}
		},
	},

	// Docker 错误
	{
		Pattern:     regexp.MustCompile(`docker: Error|Cannot connect to the Docker daemon`),
		Type:        "docker_error",
		Description: "Docker 相关错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if Docker is available in the runner",
				"Use a runner with Docker support",
				"Check Docker daemon status",
			}
		},
	},

	// 磁盘空间不足
	{
		Pattern:     regexp.MustCompile(`No space left on device|disk quota exceeded`),
		Type:        "disk_space_error",
		Description: "磁盘空间不足",
		Suggestions: func(matches []string) []string {
			return []string{
				"Clean up unnecessary files",
				"Use a runner with more disk space",
				"Remove unused dependencies or artifacts",
			}
		},
	},

	// Git 错误
	{
		Pattern:     regexp.MustCompile(`fatal: .* does not exist|fatal: not a git repository`),
		Type:        "git_error",
		Description: "Git 操作错误",
		Suggestions: func(matches []string) []string {
			return []string{
				"Check if git repository is properly initialized",
				"Verify branch/tag exists",
				"Check git configuration",
			}
		},
	},
}

// MatchPattern 匹配错误模式
func MatchPattern(log string) *ErrorPattern {
	for _, pattern := range CommonPatterns {
		if pattern.Pattern.MatchString(log) {
			return &pattern
		}
	}
	return nil
}

// ExtractMatches 提取匹配的内容
func ExtractMatches(pattern *ErrorPattern, log string) []string {
	if pattern == nil {
		return nil
	}
	return pattern.Pattern.FindStringSubmatch(log)
}


