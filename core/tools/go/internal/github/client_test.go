package github

import (
	"testing"

	"github.com/firoyang/github-action-toolset/internal/config"
)

func TestNewClient(t *testing.T) {
	tests := []struct {
		name    string
		config  *config.Config
		wantErr bool
	}{
		{
			name:    "nil config",
			config:  nil,
			wantErr: true,
		},
		{
			name: "valid config",
			config: &config.Config{
				GitHub: config.GitHubConfig{
					Token: "test-token",
					Owner: "test-owner",
					Repo:  "test-repo",
				},
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := NewClient(tt.config)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewClient() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && client == nil {
				t.Error("NewClient() returned nil client")
			}
		})
	}
}

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
			url:       "https://github.com/firoyang/test-repo.git",
			wantOwner: "firoyang",
			wantRepo:  "test-repo",
			wantErr:   false,
		},
		{
			name:      "https without .git",
			url:       "https://github.com/firoyang/test-repo",
			wantOwner: "firoyang",
			wantRepo:  "test-repo",
			wantErr:   false,
		},
		{
			name:      "ssh format",
			url:       "git@github.com:firoyang/test-repo.git",
			wantOwner: "firoyang",
			wantRepo:  "test-repo",
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

