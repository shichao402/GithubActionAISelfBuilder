package config

import (
	"os"
	"testing"
)

func TestParseGitURL(t *testing.T) {
	tests := []struct {
		name      string
		url       string
		wantOwner string
		wantRepo  string
		wantErr   bool
	}{
		{
			name:      "https format",
			url:       "https://github.com/owner/repo.git",
			wantOwner: "owner",
			wantRepo:  "repo",
			wantErr:   false,
		},
		{
			name:      "https without .git",
			url:       "https://github.com/owner/repo",
			wantOwner: "owner",
			wantRepo:  "repo",
			wantErr:   false,
		},
		{
			name:      "ssh format",
			url:       "git@github.com:owner/repo.git",
			wantOwner: "owner",
			wantRepo:  "repo",
			wantErr:   false,
		},
		{
			name:      "ssh without .git",
			url:       "git@github.com:owner/repo",
			wantOwner: "owner",
			wantRepo:  "repo",
			wantErr:   false,
		},
		{
			name:      "invalid format",
			url:       "invalid-url",
			wantOwner: "",
			wantRepo:  "",
			wantErr:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			owner, repo, err := parseGitURL(tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("parseGitURL() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if owner != tt.wantOwner {
				t.Errorf("parseGitURL() owner = %v, want %v", owner, tt.wantOwner)
			}
			if repo != tt.wantRepo {
				t.Errorf("parseGitURL() repo = %v, want %v", repo, tt.wantRepo)
			}
		})
	}
}

func TestLoadFromEnv(t *testing.T) {
	// 保存原始环境变量
	originalGHToken := os.Getenv("GITHUB_TOKEN")
	originalGHRepo := os.Getenv("GITHUB_REPOSITORY")

	defer func() {
		// 恢复原始环境变量
		os.Setenv("GITHUB_TOKEN", originalGHToken)
		os.Setenv("GITHUB_REPOSITORY", originalGHRepo)
	}()

	tests := []struct {
		name      string
		envToken  string
		envRepo   string
		wantToken string
		wantOwner string
		wantRepo  string
	}{
		{
			name:      "load from GITHUB_TOKEN",
			envToken:  "test-token",
			envRepo:   "owner/repo",
			wantToken: "test-token",
			wantOwner: "owner",
			wantRepo:  "repo",
		},
		{
			name:      "empty environment",
			envToken:  "",
			envRepo:   "",
			wantToken: "",
			wantOwner: "",
			wantRepo:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 设置环境变量
			os.Setenv("GITHUB_TOKEN", tt.envToken)
			os.Setenv("GITHUB_REPOSITORY", tt.envRepo)

			cfg := &Config{}
			loadFromEnv(cfg)

			if cfg.GitHub.Token != tt.wantToken {
				t.Errorf("loadFromEnv() token = %v, want %v", cfg.GitHub.Token, tt.wantToken)
			}
			if cfg.GitHub.Owner != tt.wantOwner {
				t.Errorf("loadFromEnv() owner = %v, want %v", cfg.GitHub.Owner, tt.wantOwner)
			}
			if cfg.GitHub.Repo != tt.wantRepo {
				t.Errorf("loadFromEnv() repo = %v, want %v", cfg.GitHub.Repo, tt.wantRepo)
			}
		})
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name    string
		config  *Config
		wantErr bool
	}{
		{
			name: "valid config",
			config: &Config{
				GitHub: GitHubConfig{
					Token: "test-token",
					Owner: "owner",
					Repo:  "repo",
				},
			},
			wantErr: false,
		},
		{
			name: "missing token",
			config: &Config{
				GitHub: GitHubConfig{
					Owner: "owner",
					Repo:  "repo",
				},
			},
			wantErr: true,
		},
		{
			name: "missing owner",
			config: &Config{
				GitHub: GitHubConfig{
					Token: "test-token",
					Repo:  "repo",
				},
			},
			wantErr: true,
		},
		{
			name: "missing repo",
			config: &Config{
				GitHub: GitHubConfig{
					Token: "test-token",
					Owner: "owner",
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validate(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

