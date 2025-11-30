# GitHub Actions 中的身份验证

## 问题背景

在 GitHub Actions 中执行需要访问 GitHub API 的操作（如创建 Release、查询工作流运行等）时，需要进行身份验证。

## 🤔 常见疑问

**Q: 我们的流水线本身就在 GitHub Actions 上运行，为什么还需要提供 GH_TOKEN？**

**A: 这是一个很好的问题！** 虽然 GitHub Actions 确实自动提供了 `GITHUB_TOKEN`，但 `gh` CLI 是一个**通用的命令行工具**，它不知道自己在 GitHub Actions 环境中运行，所以需要显式地通过 `GH_TOKEN` 环境变量来获取认证信息。

详细解释请参考：[为什么在 GitHub Actions 中还需要提供 GH_TOKEN？](./why-gh-token-required.md)

## 两种认证方式对比

### 方式 1: 使用 GitHub CLI (`gh`)

**特点**：
- `gh` 是一个**通用的命令行工具**，可以在本地和 CI/CD 中使用
- 在 GitHub Actions 中使用时，需要**手动设置 `GH_TOKEN` 环境变量**
- `GH_TOKEN` 需要指向 `GITHUB_TOKEN`（GitHub Actions 自动提供的令牌）

**优点**：
- ✅ 命令简单直观：`gh release create v1.0.0`
- ✅ 功能强大，支持所有 GitHub CLI 功能
- ✅ 可以在本地和 CI/CD 中统一使用

**缺点**：
- ⚠️ 需要在 workflow 文件中显式设置环境变量
- ⚠️ 需要确保 GitHub CLI 已安装

**示例**：
```yaml
- name: Create Release
  run: gh release create v1.0.0 --notes "Release notes"
  env:
    GH_TOKEN: ${{ github.token }}  # 必须设置！
```

### 方式 2: 使用 `@actions/github` 库

**特点**：
- `@actions/github` 是 **GitHub 官方提供的 JavaScript 库**，专门为 GitHub Actions 设计
- **自动使用 `GITHUB_TOKEN`**，无需手动配置
- 通过 JavaScript/TypeScript API 调用 GitHub API

**优点**：
- ✅ **无需手动设置环境变量**，自动使用 `GITHUB_TOKEN`
- ✅ 专门为 GitHub Actions 优化
- ✅ 类型安全（TypeScript 支持）
- ✅ 符合 GitHub Actions 最佳实践

**缺点**：
- ⚠️ 需要编写 JavaScript/TypeScript 代码
- ⚠️ 只能在 GitHub Actions 中使用（不能本地运行）

**示例**：
```typescript
import * as github from '@actions/github';

const octokit = github.getOctokit(process.env.GITHUB_TOKEN!);
await octokit.rest.repos.createRelease({
  owner: github.context.repo.owner,
  repo: github.context.repo.repo,
  tag_name: 'v1.0.0',
  body: 'Release notes',
});
```

## 为什么需要认证？

GitHub API 需要身份验证来：
1. **确认权限**：确保操作者有权限执行该操作
2. **防止滥用**：限制 API 调用频率
3. **审计追踪**：记录谁执行了什么操作

## 在 GitHub Actions 中的特殊处理

GitHub Actions 为每个工作流运行**自动生成 `GITHUB_TOKEN`**：
- 令牌自动可用，无需手动创建
- 权限仅限于触发工作流的仓库
- 在 workflow 文件中通过 `${{ github.token }}` 访问

## 当前 ReleasePipeline 的问题

当前 `ReleasePipeline` 使用 `gh` CLI，但没有在 workflow 文件中设置 `GH_TOKEN` 环境变量，导致认证失败。

## 解决方案

### 方案 1: 在 workflow 文件中添加 GH_TOKEN（简单快速）

修改 `.github/workflows/release.yml`：

```yaml
- name: Run ReleasePipeline
  env:
    GH_TOKEN: ${{ github.token }}  # 添加这一行
    INPUT_VERSION: ${{ inputs.version || '' }}
    # ... 其他环境变量
```

**优点**：修改最小，只需添加一行
**缺点**：仍然依赖 GitHub CLI

### 方案 2: 使用 @actions/github（推荐，更符合最佳实践）

修改 `ReleasePipeline` 使用 `@actions/github` 而不是 `gh` CLI：

```typescript
import * as github from '@actions/github';

// 替换 gh release create
const octokit = github.getOctokit(process.env.GITHUB_TOKEN!);
await octokit.rest.repos.createRelease({
  owner: github.context.repo.owner,
  repo: github.context.repo.repo,
  tag_name: `v${version}`,
  body: releaseNotes,
  // 上传文件需要额外的 API 调用
});
```

**优点**：
- ✅ 无需手动设置环境变量
- ✅ 符合 GitHub Actions 最佳实践
- ✅ 类型安全
- ✅ 更好的错误处理

**缺点**：需要修改代码，上传文件需要额外的 API 调用

## 推荐方案

**对于新项目**：推荐使用 `@actions/github`（方案 2）
**对于现有项目**：可以先用方案 1 快速修复，后续再迁移到方案 2

## 总结

- **`gh` CLI**：通用工具，需要手动设置 `GH_TOKEN`
- **`@actions/github`**：专门为 GitHub Actions 设计，自动使用 `GITHUB_TOKEN`
- **两者都可以**，但 `@actions/github` 更符合 GitHub Actions 的最佳实践

