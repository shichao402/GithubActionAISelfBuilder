# 为什么在 GitHub Actions 中还需要提供 GH_TOKEN？

## 问题的核心

你可能会想：**我们的流水线本身就在 GitHub Actions 上运行，应该不需要再认证才对啊？**

这是一个很好的问题！让我解释一下为什么即使你在 GitHub Actions 中运行，`gh` CLI 仍然需要显式提供 `GH_TOKEN`。

## 关键理解

### 1. GitHub Actions 确实提供了令牌

✅ **是的**，GitHub Actions 确实自动为每个工作流运行生成了 `GITHUB_TOKEN`。

这个令牌：
- 自动可用，无需手动创建
- 权限仅限于触发工作流的仓库
- 通过 `${{ github.token }}` 在工作流文件中访问
- 作为环境变量 `GITHUB_TOKEN` 自动注入到运行环境中

### 2. 但是 `gh` CLI 不知道自己在 GitHub Actions 中

❌ **问题在于**：`gh` CLI 是一个**通用的命令行工具**，它不知道自己在什么环境中运行。

`gh` CLI 的设计：
- 可以在**任何环境**中运行：本地机器、CI/CD、Docker 容器、GitHub Actions 等
- 不会自动检测环境类型
- 需要**显式地**通过环境变量或配置文件来获取认证信息

### 3. `gh` CLI 的认证机制

`gh` CLI 按以下顺序查找认证信息：

1. **`GH_TOKEN` 环境变量**（优先级最高）
2. **`~/.config/gh/hosts.yml` 配置文件**（本地认证）
3. **交互式登录**（`gh auth login`）

**关键点**：`gh` CLI **不会**自动查找 `GITHUB_TOKEN` 环境变量！

即使 GitHub Actions 自动提供了 `GITHUB_TOKEN`，`gh` CLI 也不知道要使用它，因为它只认识 `GH_TOKEN`。

## 实际验证

让我们看看在 GitHub Actions 中会发生什么：

```bash
# 在 GitHub Actions 中运行
echo $GITHUB_TOKEN
# 输出：ghs_xxxxxxxxxxxxx  （GitHub Actions 自动提供）

# 但是 gh CLI 查找的是 GH_TOKEN
echo $GH_TOKEN
# 输出：（空）  （没有设置）

# 所以 gh CLI 会失败
gh release create v1.0.0
# 错误：authentication required
```

## 解决方案对比

### 方案 1: 设置 GH_TOKEN（当前方案）

```yaml
env:
  GH_TOKEN: ${{ github.token }}  # 将 GITHUB_TOKEN 映射到 GH_TOKEN
```

**工作原理**：
- GitHub Actions 提供 `GITHUB_TOKEN`
- 我们将其映射到 `GH_TOKEN` 环境变量
- `gh` CLI 读取 `GH_TOKEN` 并成功认证

### 方案 2: 使用 @actions/github（推荐）

```typescript
import * as github from '@actions/github';

// @actions/github 会自动使用 GITHUB_TOKEN
const octokit = github.getOctokit(process.env.GITHUB_TOKEN!);
```

**工作原理**：
- `@actions/github` 是专门为 GitHub Actions 设计的
- 它知道要使用 `GITHUB_TOKEN` 环境变量
- 无需手动映射

## 为什么这样设计？

### `gh` CLI 的设计哲学

`gh` CLI 被设计为**通用工具**：
- ✅ 可以在任何环境中运行
- ✅ 不依赖特定的 CI/CD 平台
- ✅ 统一的认证机制（`GH_TOKEN`）

### `@actions/github` 的设计哲学

`@actions/github` 被设计为**GitHub Actions 专用**：
- ✅ 专门为 GitHub Actions 优化
- ✅ 自动使用 `GITHUB_TOKEN`
- ✅ 更好的类型安全

## 类比理解

想象一下：

- **`gh` CLI** = 通用的"钥匙"（需要你告诉它钥匙在哪里）
- **`@actions/github`** = 智能门锁（自动识别你在 GitHub Actions 中，自动使用正确的钥匙）

## 总结

| 问题 | 答案 |
|------|------|
| GitHub Actions 是否提供了令牌？ | ✅ 是的，`GITHUB_TOKEN` 自动可用 |
| `gh` CLI 是否知道自己在 GitHub Actions 中？ | ❌ 不知道，它是通用工具 |
| `gh` CLI 是否会自动使用 `GITHUB_TOKEN`？ | ❌ 不会，它只认识 `GH_TOKEN` |
| 为什么需要设置 `GH_TOKEN`？ | 因为需要将 `GITHUB_TOKEN` 映射到 `GH_TOKEN` |
| 有没有更好的方案？ | ✅ 使用 `@actions/github`，自动使用 `GITHUB_TOKEN` |

## 最佳实践建议

1. **当前项目**：使用 `GH_TOKEN: ${{ github.token }}` 快速修复
2. **未来优化**：考虑迁移到 `@actions/github`，更符合 GitHub Actions 最佳实践

