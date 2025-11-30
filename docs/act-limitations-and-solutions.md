# act 工具的局限性和解决方案

## 你的工作流场景

### 工作流程

1. **Push build 分支** → 触发 GitHub Action 构建 → 产生产物
2. **手动测试产物** → 验证是否符合预期
3. **运行发布流程** → 查询 build 分支对应的 GitHub Action 工作流结果 → 获取产物 → 创建 Release

### 涉及的功能

1. ✅ **Git 分支操作**：push 分支
2. ❌ **查询 GitHub Action 工作流运行结果**：需要 GitHub API
3. ❌ **从特定工作流运行中获取产物**：需要 GitHub API
4. ❌ **创建 GitHub Release**：需要 GitHub API

## act 工具的局限性

### act 能做什么

1. ✅ **模拟 GitHub Actions 执行环境**
2. ✅ **运行工作流步骤**
3. ✅ **处理 artifacts（本地）**
4. ✅ **模拟基本的环境变量**

### act 不能做什么

1. ❌ **连接到真实的 GitHub API**
2. ❌ **查询其他工作流运行的结果**
3. ❌ **从 GitHub 获取产物（只能从本地 artifacts）**
4. ❌ **创建真实的 GitHub Release**
5. ❌ **查询分支对应的工作流运行**

## 解决方案

### 方案 1: 混合策略（推荐）

**核心思想**：本地测试用 act，GitHub 特有功能用真实 API。

#### 1. 构建阶段（本地测试）

```bash
# 使用 act 测试构建流程
act push -e build-branch.json

# 或直接运行 Pipeline
python -m src.pipelines.build_pipeline
```

#### 2. 发布阶段（需要真实 GitHub API）

```python
# src/pipelines/release_pipeline.py
class ReleasePipeline(BasePipeline):
    def execute(self):
        # 1. 查询 build 分支的工作流运行
        build_branch = self.get_input("build-branch", "build")
        workflow_run = self._get_workflow_run_by_branch(build_branch)
        
        if not workflow_run:
            return PipelineResult(
                success=False,
                message=f"未找到分支 {build_branch} 的工作流运行",
                exit_code=1
            )
        
        # 2. 获取产物
        artifacts = self._download_artifacts_from_run(workflow_run["id"])
        
        # 3. 创建 Release
        version = self.get_input("version", "1.0.0")
        self._create_github_release(version, artifacts)
        
        return PipelineResult(success=True, message="发布完成")
    
    def _get_workflow_run_by_branch(self, branch: str):
        """查询分支对应的工作流运行（需要 GitHub API）"""
        import requests
        
        token = os.getenv("GITHUB_TOKEN")
        repo = os.getenv("GITHUB_REPOSITORY")
        
        # 使用 GitHub API 查询
        url = f"https://api.github.com/repos/{repo}/actions/runs"
        headers = {"Authorization": f"token {token}"}
        params = {"branch": branch, "status": "success"}
        
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            runs = response.json()["workflow_runs"]
            if runs:
                return runs[0]  # 返回最新的成功运行
        return None
    
    def _download_artifacts_from_run(self, run_id: int):
        """从工作流运行中下载产物（需要 GitHub API）"""
        import requests
        
        token = os.getenv("GITHUB_TOKEN")
        repo = os.getenv("GITHUB_REPOSITORY")
        
        # 获取产物列表
        url = f"https://api.github.com/repos/{repo}/actions/runs/{run_id}/artifacts"
        headers = {"Authorization": f"token {token}"}
        
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            artifacts = response.json()["artifacts"]
            # 下载每个产物
            downloaded = []
            for artifact in artifacts:
                download_url = artifact["archive_download_url"]
                # 下载并解压
                # ...
                downloaded.append(artifact["name"])
            return downloaded
        return []
```

#### 3. 本地测试发布流程

```python
# 本地测试：使用 mock 数据
def _get_workflow_run_by_branch(self, branch: str):
    if not self._is_ci():
        # 本地：从本地存储模拟
        print(f"⚠️  本地环境：模拟查询分支 {branch} 的工作流运行")
        print(f"⚠️  提示：此功能需要在 CI 环境中使用真实的 GitHub API")
        
        # 尝试从本地存储查找
        local_artifacts = Path.home() / ".local" / "artifacts" / branch
        if local_artifacts.exists():
            return {
                "id": "local-mock",
                "branch": branch,
                "status": "success"
            }
        return None
    
    # CI：使用真实 GitHub API
    return self._get_from_github_api(branch)
```

### 方案 2: 使用 GitHub CLI (gh)

**核心思想**：使用 `gh` CLI 工具，可以在本地和 CI 中都使用。

#### 1. 查询工作流运行

```bash
# 查询 build 分支的工作流运行
gh run list --branch build --status success --limit 1

# 获取运行 ID
RUN_ID=$(gh run list --branch build --status success --limit 1 --json databaseId --jq '.[0].databaseId')

# 下载产物
gh run download $RUN_ID
```

#### 2. 在 Pipeline 中使用

```python
# src/pipelines/release_pipeline.py
class ReleasePipeline(BasePipeline):
    def execute(self):
        build_branch = self.get_input("build-branch", "build")
        
        # 使用 gh CLI 查询工作流运行
        result = self._run_command(
            f"gh run list --branch {build_branch} --status success --limit 1 --json databaseId --jq '.[0].databaseId'"
        )
        
        if result.returncode != 0:
            return PipelineResult(
                success=False,
                message=f"未找到分支 {build_branch} 的工作流运行",
                exit_code=1
            )
        
        run_id = result.stdout.strip()
        
        # 下载产物
        self._run_command(f"gh run download {run_id}")
        
        # 创建 Release
        version = self.get_input("version", "1.0.0")
        self._run_command(f"gh release create v{version} --notes 'Release {version}'")
        
        return PipelineResult(success=True, message="发布完成")
```

**优势**：
- ✅ 本地和 CI 都可以使用
- ✅ 不需要写复杂的 API 调用
- ✅ 命令行工具，易于使用

**劣势**：
- ⚠️ 需要安装 `gh` CLI
- ⚠️ 需要配置 GitHub token

### 方案 3: 简化工作流（推荐）

**核心思想**：改变工作流，减少对 GitHub 特有功能的依赖。

#### 原工作流

```
1. Push build 分支 → 构建 → 产物
2. 手动测试
3. 发布 → 查询 build 分支的工作流 → 获取产物 → 创建 Release
```

#### 简化后的工作流

```
1. Push build 分支 → 构建 → 产物 → 自动上传
2. 手动测试（从 GitHub Actions artifacts 下载）
3. 发布 → 直接指定产物名称 → 下载 → 创建 Release
```

**实现**：

```python
# src/pipelines/release_pipeline.py
class ReleasePipeline(BasePipeline):
    def execute(self):
        # 不再查询分支，直接指定产物名称
        artifact_name = self.get_input("artifact-name", "build-artifacts")
        
        # 下载产物（本地或 CI 都支持）
        if self._is_ci():
            # CI：从 GitHub Actions artifacts 下载
            # 这个步骤在 GitHub Action YAML 中处理
            artifact_path = "artifacts"
        else:
            # 本地：从本地存储读取
            artifact_path = self._get_local_artifact(artifact_name)
        
        # 创建 Release
        version = self.get_input("version", "1.0.0")
        self._create_release(version, artifact_path)
        
        return PipelineResult(success=True, message="发布完成")
```

**优势**：
- ✅ 不依赖 GitHub API 查询
- ✅ 本地和 CI 都可以运行
- ✅ 更简单，更可靠

## 推荐方案

### 对于你的场景

**推荐：方案 2（使用 GitHub CLI）**

原因：
1. ✅ `gh` CLI 可以在本地和 CI 中都使用
2. ✅ 不需要写复杂的 API 调用
3. ✅ 命令行工具，易于集成到 Pipeline 中
4. ✅ 可以查询工作流运行、下载产物、创建 Release

### 实现示例

```python
# src/pipelines/release_pipeline.py
class ReleasePipeline(BasePipeline):
    def execute(self):
        build_branch = self.get_input("build-branch", "build")
        version = self.get_input("version", "1.0.0")
        
        # 1. 查询工作流运行（使用 gh CLI）
        if self._is_ci():
            # CI：使用 gh CLI 查询
            run_id = self._get_run_id_by_branch(build_branch)
        else:
            # 本地：提示使用 gh CLI 或从本地存储读取
            print(f"⚠️  本地环境：请使用 `gh run list --branch {build_branch}` 查询")
            run_id = self._get_local_run_id(build_branch)
        
        if not run_id:
            return PipelineResult(
                success=False,
                message=f"未找到分支 {build_branch} 的工作流运行",
                exit_code=1
            )
        
        # 2. 下载产物（使用 gh CLI）
        self._run_command(f"gh run download {run_id}")
        
        # 3. 创建 Release（使用 gh CLI）
        self._run_command(f"gh release create v{version} --notes 'Release {version}'")
        
        return PipelineResult(success=True, message="发布完成")
    
    def _get_run_id_by_branch(self, branch: str) -> str:
        """使用 gh CLI 查询工作流运行 ID"""
        result = self._run_command(
            f"gh run list --branch {branch} --status success --limit 1 --json databaseId --jq '.[0].databaseId'"
        )
        if result.returncode == 0:
            return result.stdout.strip()
        return None
```

## 总结

### act 的局限性

- ❌ 不能查询 GitHub 工作流运行
- ❌ 不能从 GitHub 获取产物
- ❌ 不能创建真实的 GitHub Release

### 解决方案

1. **使用 GitHub CLI (gh)**：推荐
   - ✅ 本地和 CI 都可以使用
   - ✅ 可以查询工作流、下载产物、创建 Release
   - ✅ 命令行工具，易于集成

2. **使用 GitHub API**：备选
   - ✅ 功能完整
   - ⚠️ 需要写 API 调用代码
   - ⚠️ 本地需要配置 token

3. **简化工作流**：最佳
   - ✅ 不依赖 GitHub 特有功能
   - ✅ 本地和 CI 都可以运行
   - ⚠️ 需要改变工作流设计

### 建议

**对于你的场景，推荐使用 GitHub CLI (gh)**：
- 本地和 CI 都可以使用
- 可以完成所有需要的操作
- 不需要写复杂的 mock


