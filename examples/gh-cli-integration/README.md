# GitHub CLI (gh) 集成示例

## 为什么使用 GitHub CLI？

### 你的工作流需求

1. 查询 build 分支的工作流运行结果
2. 从工作流运行中获取产物
3. 创建 GitHub Release

### act 的局限性

- ❌ 不能查询 GitHub 工作流运行
- ❌ 不能从 GitHub 获取产物
- ❌ 不能创建真实的 GitHub Release

### GitHub CLI 的优势

- ✅ 本地和 CI 都可以使用
- ✅ 可以查询工作流运行
- ✅ 可以下载产物
- ✅ 可以创建 Release
- ✅ 命令行工具，易于集成

## 安装 GitHub CLI

### macOS
```bash
brew install gh
```

### Windows
```bash
choco install gh
```

### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### 配置认证

```bash
# 登录 GitHub
gh auth login

# 或使用 token
export GITHUB_TOKEN=your_token
```

## 使用示例

### 1. 查询工作流运行

```bash
# 查询 build 分支的工作流运行
gh run list --branch build --status success --limit 1

# 获取运行 ID
RUN_ID=$(gh run list --branch build --status success --limit 1 --json databaseId --jq '.[0].databaseId')
echo $RUN_ID
```

### 2. 下载产物

```bash
# 下载特定运行的所有产物
gh run download $RUN_ID

# 下载到指定目录
gh run download $RUN_ID --dir artifacts/
```

### 3. 创建 Release

```bash
# 创建 Release
gh release create v1.0.0 --notes "Release 1.0.0"

# 创建 Release 并附加文件
gh release create v1.0.0 --notes "Release 1.0.0" artifacts/app.exe
```

## 在 Pipeline 中使用

### 完整示例

```python
# src/pipelines/release_pipeline.py
class ReleasePipeline(BasePipeline):
    def execute(self):
        build_branch = self.get_input("build-branch", "build")
        version = self.get_input("version", "1.0.0")
        
        # 1. 查询工作流运行
        run_id = self._get_run_id_by_branch(build_branch)
        
        # 2. 下载产物
        self._run_command(f"gh run download {run_id} --dir artifacts/")
        
        # 3. 创建 Release
        self._run_command(f"gh release create v{version} --notes 'Release {version}' artifacts/*")
        
        return PipelineResult(success=True, message="发布完成")
```

## 工作流对比

### 原工作流（需要 GitHub API）

```
1. Push build 分支 → 构建 → 产物
2. 手动测试
3. 发布 → 使用 GitHub API 查询工作流 → 获取产物 → 创建 Release
```

### 使用 gh CLI 的工作流

```
1. Push build 分支 → 构建 → 产物
2. 手动测试
3. 发布 → 使用 gh CLI 查询工作流 → 下载产物 → 创建 Release
```

**优势**：
- ✅ 本地和 CI 都可以使用
- ✅ 不需要写 API 调用代码
- ✅ 命令行工具，易于使用

## 本地测试

### 测试查询工作流

```bash
# 查询工作流运行
gh run list --branch build --status success

# 获取运行 ID
RUN_ID=$(gh run list --branch build --status success --limit 1 --json databaseId --jq '.[0].databaseId')
```

### 测试下载产物

```bash
# 下载产物
gh run download $RUN_ID --dir artifacts/
```

### 测试创建 Release

```bash
# 创建 Release（测试）
gh release create v1.0.0-test --notes "Test Release" --draft
```

## 总结

### GitHub CLI (gh) 的优势

1. ✅ **本地和 CI 都可以使用**
2. ✅ **可以完成所有需要的操作**
3. ✅ **不需要写复杂的 API 调用**
4. ✅ **命令行工具，易于集成**

### 推荐使用场景

- ✅ 查询工作流运行
- ✅ 下载产物
- ✅ 创建 Release
- ✅ 其他 GitHub 操作

### 与 act 的配合

- **开发阶段**：使用 act 测试工作流
- **发布阶段**：使用 gh CLI 完成发布操作

这样既能本地测试，又能完成所有需要的操作！


