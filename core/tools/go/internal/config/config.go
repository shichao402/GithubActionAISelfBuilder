package config

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

// Config 表示应用配置
type Config struct {
	GitHub GitHubConfig `mapstructure:"github"`
	Output OutputConfig `mapstructure:"output"`
	Debug  DebugConfig  `mapstructure:"debug"`
}

// GitHubConfig GitHub 相关配置
type GitHubConfig struct {
	Token string `mapstructure:"token"` // GitHub Token
	Owner string `mapstructure:"owner"` // 仓库所有者（可选，从 git 自动获取）
	Repo  string `mapstructure:"repo"`  // 仓库名称（可选，从 git 自动获取）
}

// OutputConfig 输出相关配置
type OutputConfig struct {
	Format string `mapstructure:"format"` // json | human
}

// DebugConfig 调试相关配置
type DebugConfig struct {
	Timeout      int `mapstructure:"timeout"`       // 最长等待时间（秒）
	PollInterval int `mapstructure:"poll_interval"` // 轮询间隔（秒）
}

var (
	// globalConfig 全局配置实例
	globalConfig *Config
)

// Load 加载配置
// 优先级：命令行参数 > 环境变量 > 配置文件 > gh CLI > 默认值
func Load(configFile string) (*Config, error) {
	if globalConfig != nil {
		return globalConfig, nil
	}

	cfg := &Config{
		GitHub: GitHubConfig{},
		Output: OutputConfig{
			Format: "human",
		},
		Debug: DebugConfig{
			Timeout:      3600, // 1小时
			PollInterval: 5,    // 5秒
		},
	}

	// 1. 尝试从配置文件加载
	if configFile != "" {
		if err := loadFromFile(configFile, cfg); err != nil {
			return nil, fmt.Errorf("failed to load config file: %w", err)
		}
	} else {
		// 尝试加载默认配置文件
		_ = loadDefaultConfigFile(cfg)
	}

	// 2. 从环境变量加载（覆盖配置文件）
	loadFromEnv(cfg)

	// 3. 如果没有 Token，尝试从 gh CLI 获取
	if cfg.GitHub.Token == "" {
		token, err := getTokenFromGHCLI()
		if err == nil && token != "" {
			cfg.GitHub.Token = token
		}
	}

	// 4. 如果没有 Owner/Repo，从 git 仓库获取
	if cfg.GitHub.Owner == "" || cfg.GitHub.Repo == "" {
		owner, repo, err := getRepoInfoFromGit()
		if err == nil {
			if cfg.GitHub.Owner == "" {
				cfg.GitHub.Owner = owner
			}
			if cfg.GitHub.Repo == "" {
				cfg.GitHub.Repo = repo
			}
		}
	}

	// 验证必需的配置
	if err := validate(cfg); err != nil {
		return nil, err
	}

	globalConfig = cfg
	return cfg, nil
}

// GetGlobal 获取全局配置
func GetGlobal() *Config {
	return globalConfig
}

// loadFromFile 从文件加载配置
func loadFromFile(file string, cfg *Config) error {
	viper.SetConfigFile(file)
	if err := viper.ReadInConfig(); err != nil {
		return err
	}
	return viper.Unmarshal(cfg)
}

// loadDefaultConfigFile 加载默认配置文件
func loadDefaultConfigFile(cfg *Config) error {
	// 尝试多个位置
	configPaths := []string{
		filepath.Join(os.Getenv("HOME"), ".config", "gh-action-debug", "config.yaml"),
		filepath.Join(os.Getenv("HOME"), ".gh-action-debug.yaml"),
		"./gh-action-debug.yaml",
	}

	for _, path := range configPaths {
		if _, err := os.Stat(path); err == nil {
			return loadFromFile(path, cfg)
		}
	}

	return nil // 没有找到配置文件不是错误
}

// loadFromEnv 从环境变量加载
func loadFromEnv(cfg *Config) {
	// GITHUB_TOKEN 环境变量
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		cfg.GitHub.Token = token
	}

	// GH_TOKEN 环境变量（gh CLI 使用）
	if token := os.Getenv("GH_TOKEN"); token != "" {
		cfg.GitHub.Token = token
	}

	// GITHUB_REPOSITORY 环境变量（格式：owner/repo）
	if repo := os.Getenv("GITHUB_REPOSITORY"); repo != "" {
		parts := strings.Split(repo, "/")
		if len(parts) == 2 {
			cfg.GitHub.Owner = parts[0]
			cfg.GitHub.Repo = parts[1]
		}
	}
}

// getTokenFromGHCLI 从 gh CLI 获取 token
func getTokenFromGHCLI() (string, error) {
	cmd := exec.Command("gh", "auth", "token")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(output)), nil
}

// getRepoInfoFromGit 从 git 仓库获取 owner 和 repo
func getRepoInfoFromGit() (owner, repo string, err error) {
	// 获取远程仓库 URL
	cmd := exec.Command("git", "config", "--get", "remote.origin.url")
	output, err := cmd.Output()
	if err != nil {
		return "", "", err
	}

	url := strings.TrimSpace(string(output))
	return parseGitURL(url)
}

// parseGitURL 解析 git URL 获取 owner 和 repo
func parseGitURL(url string) (owner, repo string, err error) {
	// 支持多种格式：
	// https://github.com/owner/repo.git
	// git@github.com:owner/repo.git
	// https://github.com/owner/repo

	url = strings.TrimSuffix(url, ".git")

	// HTTPS 格式
	if strings.HasPrefix(url, "https://github.com/") {
		parts := strings.Split(strings.TrimPrefix(url, "https://github.com/"), "/")
		if len(parts) >= 2 {
			return parts[0], parts[1], nil
		}
	}

	// SSH 格式
	if strings.HasPrefix(url, "git@github.com:") {
		parts := strings.Split(strings.TrimPrefix(url, "git@github.com:"), "/")
		if len(parts) >= 2 {
			return parts[0], parts[1], nil
		}
	}

	return "", "", fmt.Errorf("invalid git URL format: %s", url)
}

// validate 验证配置
func validate(cfg *Config) error {
	if cfg.GitHub.Token == "" {
		return fmt.Errorf("GitHub token is required. Set it via:\n" +
			"  1. GITHUB_TOKEN environment variable\n" +
			"  2. config file (github.token)\n" +
			"  3. gh auth login (GitHub CLI)")
	}

	if cfg.GitHub.Owner == "" || cfg.GitHub.Repo == "" {
		return fmt.Errorf("repository owner and name are required. Set them via:\n" +
			"  1. GITHUB_REPOSITORY environment variable (owner/repo)\n" +
			"  2. config file (github.owner and github.repo)\n" +
			"  3. run from a git repository")
	}

	return nil
}

// SetGlobal 设置全局配置（测试用）
func SetGlobal(cfg *Config) {
	globalConfig = cfg
}


