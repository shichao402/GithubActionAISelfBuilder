# GitHub API 客户端抽象层

## 设计目标

保持流水线设计一致性，根据运行环境自动选择最合适的实现方式：
- **GitHub Actions 环境**：使用 `@actions/github`（自动使用 `GITHUB_TOKEN`）
- **本地环境**：使用 GitHub CLI（需要 `gh auth login`）

## 问题背景

### 之前的方案

- 在 GitHub Actions 中需要手动设置 `GH_TOKEN: ${{ github.token }}`
- 代码中直接使用 `gh` CLI，不够灵活
- 无法根据环境自动选择最佳实现

### 新方案的优势

✅ **自动环境检测**：根据 `GITHUB_ACTIONS` 环境变量自动选择实现
✅ **保持一致性**：Pipeline 代码无需关心底层实现
✅ **最佳实践**：GitHub Actions 中使用 `@actions/github`，本地使用 `gh` CLI
✅ **无需手动配置**：GitHub Actions 中无需设置 `GH_TOKEN`

## 使用方式

### 在 Pipeline 中使用

```typescript
import { createGitHubApiClient } from '../../github-api-client';

export class ReleasePipeline extends ReleaseBasePipeline {
  private githubClient = createGitHubApiClient((level, message) => this.log(level, message));

  protected async getBuildRunId(buildBranch: string): Promise<string | null> {
    // 自动根据环境选择实现
    return await this.githubClient.getWorkflowRunId(buildBranch, 'success');
  }

  protected async createRelease(version: string, notes: string): Promise<boolean> {
    // 自动根据环境选择实现
    return await this.githubClient.createRelease(`v${version}`, notes);
  }
}
```

### 环境检测逻辑

```typescript
function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}

// 自动选择实现
if (isGitHubActions()) {
  // 使用 @actions/github
  return new GitHubActionsClient(log);
} else {
  // 使用 GitHub CLI
  return new GitHubCliClient(log);
}
```

## 实现对比

### GitHub Actions 环境

**使用 `@actions/github`**：
- ✅ 自动使用 `GITHUB_TOKEN`（无需手动设置）
- ✅ 类型安全（TypeScript）
- ✅ 符合 GitHub Actions 最佳实践
- ✅ 更好的错误处理

**示例**：
```typescript
const github = require('@actions/github');
const octokit = github.getOctokit(process.env.GITHUB_TOKEN!);
await octokit.rest.repos.createRelease({ ... });
```

### 本地环境

**使用 GitHub CLI**：
- ✅ 命令简单直观
- ✅ 功能强大
- ✅ 可以在本地和 CI/CD 中统一使用
- ⚠️ 需要 `gh auth login`

**示例**：
```typescript
await exec.exec('gh', ['release', 'create', tag, '--notes', notes]);
```

## 工作流文件配置

### 之前（需要手动设置 GH_TOKEN）

```yaml
- name: Run ReleasePipeline
  env:
    GH_TOKEN: ${{ github.token }}  # 必须手动设置
```

### 现在（自动处理）

```yaml
- name: Run ReleasePipeline
  env:
    # GITHUB_TOKEN 由 GitHub Actions 自动提供
    # @actions/github 会自动使用，无需手动设置
```

## 依赖要求

### GitHub Actions 环境

需要 `@actions/github` 依赖（已添加到 `package.json`）：

```json
{
  "dependencies": {
    "@actions/github": "^6.0.0"
  }
}
```

### 本地环境

需要安装 GitHub CLI：

```bash
# macOS
brew install gh

# Linux
# 参考：https://cli.github.com/manual/installation

# 登录
gh auth login
```

## 优势总结

| 特性 | 之前 | 现在 |
|------|------|------|
| 环境检测 | ❌ 手动 | ✅ 自动 |
| GitHub Actions 配置 | ⚠️ 需要设置 GH_TOKEN | ✅ 无需配置 |
| 代码一致性 | ⚠️ 直接使用 gh CLI | ✅ 统一接口 |
| 最佳实践 | ⚠️ 混用 | ✅ 环境适配 |
| 类型安全 | ❌ 无 | ✅ TypeScript |

## 迁移指南

### 步骤 1: 更新依赖

```bash
npm install @actions/github@^6.0.0
```

### 步骤 2: 更新 Pipeline 代码

```typescript
// 之前
await exec.exec('gh', ['release', 'create', tag, '--notes', notes]);

// 现在
const githubClient = createGitHubApiClient((level, message) => this.log(level, message));
await githubClient.createRelease(tag, notes);
```

### 步骤 3: 更新工作流文件

```yaml
# 之前
env:
  GH_TOKEN: ${{ github.token }}

# 现在（可以删除 GH_TOKEN，@actions/github 会自动使用 GITHUB_TOKEN）
```

## 注意事项

1. **本地测试**：需要先运行 `gh auth login` 进行认证
2. **GitHub Actions**：`GITHUB_TOKEN` 自动可用，无需配置
3. **错误处理**：两种实现都有完善的错误处理
4. **向后兼容**：旧的 Pipeline 代码仍然可以工作（但建议迁移）

