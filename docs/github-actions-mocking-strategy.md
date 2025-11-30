# GitHub Actions 本地 Mock 策略

## 问题分析

### 你的观察

1. **需要对 GitHub 特有的功能做本地化 mock**
2. **工作量会比较大**
3. **需要 mock 的功能包括**：
   - 上传产物 (`actions/upload-artifact`)
   - 获取产物 (`actions/download-artifact`)
   - 根据命名查询工作流获取产物
   - 创建 GitHub Release
   - 其他 GitHub 相关功能

### 当前方案的问题

1. **工作量巨大**：每个 GitHub 功能都需要写本地 mock
2. **维护成本高**：GitHub Actions 功能更新，mock 也要更新
3. **不完整**：很难 mock 所有功能
4. **容易出错**：mock 和真实行为可能不一致

## 解决方案

### 方案 1: 分层抽象（推荐）

**核心思想**：将 GitHub 特有功能抽象为接口，本地和 CI 提供不同实现。

```python
# src/github_actions/interface.py
from abc import ABC, abstractmethod

class ArtifactManager(ABC):
    """产物管理器抽象接口"""
    
    @abstractmethod
    def upload(self, name: str, path: str, **kwargs):
        """上传产物"""
        pass
    
    @abstractmethod
    def download(self, name: str, path: str = None):
        """下载产物"""
        pass
    
    @abstractmethod
    def list_artifacts(self, workflow_name: str = None):
        """列出产物"""
        pass

class ReleaseManager(ABC):
    """发布管理器抽象接口"""
    
    @abstractmethod
    def create_release(self, version: str, notes: str, artifacts: list):
        """创建发布"""
        pass

# src/github_actions/ci_impl.py
class CIArtifactManager(ArtifactManager):
    """CI 环境实现：使用 GitHub Actions"""
    
    def upload(self, name: str, path: str, **kwargs):
        # CI 环境：设置输出，让 GitHub Action 上传
        # 实际上不做任何事，由 GitHub Action YAML 处理
        self.set_output("artifact-name", name)
        self.set_output("artifact-path", path)
        # GitHub Action 会执行 actions/upload-artifact@v3
    
    def download(self, name: str, path: str = None):
        # CI 环境：产物已经在工作流中下载
        # 只需要返回路径
        return path or f"artifacts/{name}"

# src/github_actions/local_impl.py
class LocalArtifactManager(ArtifactManager):
    """本地环境实现：使用本地存储"""
    
    def upload(self, name: str, path: str, **kwargs):
        # 本地环境：复制到本地存储
        local_dir = Path.home() / ".local" / "artifacts" / name
        shutil.copytree(path, local_dir, dirs_exist_ok=True)
        return str(local_dir)
    
    def download(self, name: str, path: str = None):
        # 本地环境：从本地存储读取
        local_dir = Path.home() / ".local" / "artifacts" / name
        if local_dir.exists():
            return str(local_dir)
        return None

# src/base_pipeline.py
class BasePipeline:
    def __init__(self):
        # 根据环境选择实现
        if self._is_ci():
            self.artifacts = CIArtifactManager()
            self.releases = CIReleaseManager()
        else:
            self.artifacts = LocalArtifactManager()
            self.releases = LocalReleaseManager()
    
    def _is_ci(self):
        return os.getenv("CI") == "true"
```

**优势**：
- ✅ 统一的接口，易于使用
- ✅ 本地和 CI 实现分离
- ✅ 易于扩展新功能

**劣势**：
- ⚠️ 仍然需要为每个功能写实现
- ⚠️ 工作量较大

### 方案 2: 最小化 Mock（推荐）

**核心思想**：只 mock 核心功能，其他功能在本地跳过或提示。

```python
# src/github_actions/minimal_mock.py
class MinimalGitHubActions:
    """最小化 GitHub Actions Mock"""
    
    def __init__(self):
        self.artifacts_dir = Path.home() / ".local" / "artifacts"
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
    
    def upload_artifact(self, name: str, path: str):
        """上传产物（本地 mock）"""
        target = self.artifacts_dir / name
        if Path(path).exists():
            shutil.copytree(path, target, dirs_exist_ok=True)
            print(f"✓ 本地产物已保存: {target}")
        return str(target)
    
    def download_artifact(self, name: str, path: str = None):
        """下载产物（本地 mock）"""
        source = self.artifacts_dir / name
        if source.exists():
            if path:
                shutil.copytree(source, path, dirs_exist_ok=True)
            return str(source)
        return None
    
    def create_release(self, version: str, notes: str, artifacts: list):
        """创建发布（本地 mock）"""
        release_dir = Path("releases") / f"v{version}"
        release_dir.mkdir(parents=True, exist_ok=True)
        
        # 保存发布信息
        with open(release_dir / "release.json", "w") as f:
            json.dump({
                "version": version,
                "notes": notes,
                "artifacts": artifacts,
                "created_at": datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"✓ 本地 Release 已创建: {release_dir}")
        return str(release_dir)
    
    def get_workflow_artifact(self, workflow_name: str, artifact_name: str):
        """获取工作流产物（本地 mock）"""
        # 本地：从本地存储查找
        workflow_dir = self.artifacts_dir / workflow_name
        artifact_path = workflow_dir / artifact_name
        
        if artifact_path.exists():
            return str(artifact_path)
        
        # 尝试从元数据查找
        metadata_file = workflow_dir / "metadata.json"
        if metadata_file.exists():
            with open(metadata_file) as f:
                metadata = json.load(f)
                if artifact_name in metadata.get("artifacts", {}):
                    return metadata["artifacts"][artifact_name]
        
        return None
```

**优势**：
- ✅ 工作量较小
- ✅ 只实现核心功能
- ✅ 易于维护

**劣势**：
- ⚠️ 功能不完整
- ⚠️ 某些功能在本地无法完全模拟

### 方案 3: 承认限制 + 文档说明

**核心思想**：承认某些功能只能在 CI 中运行，本地提供清晰的提示。

```python
# src/github_actions/limited.py
class LimitedGitHubActions:
    """受限的 GitHub Actions 支持"""
    
    def upload_artifact(self, name: str, path: str):
        if self._is_ci():
            # CI：设置输出，让 GitHub Action 处理
            self.set_output("artifact-name", name)
            self.set_output("artifact-path", path)
        else:
            # 本地：保存到本地，并提示
            local_path = self._save_to_local(name, path)
            print(f"⚠️  本地环境：产物已保存到 {local_path}")
            print(f"⚠️  提示：此功能在 CI 环境中会自动上传到 GitHub Actions")
            return local_path
    
    def get_workflow_artifact(self, workflow_name: str, artifact_name: str):
        if self._is_ci():
            # CI：从 GitHub Actions 获取
            # 这个功能只能在 CI 中运行
            return self._get_from_github(workflow_name, artifact_name)
        else:
            # 本地：提示不支持
            print(f"⚠️  本地环境不支持从 GitHub 工作流获取产物")
            print(f"⚠️  提示：此功能只能在 CI 环境中使用")
            print(f"⚠️  替代方案：使用本地存储的产物")
            return None
```

**优势**：
- ✅ 工作量最小
- ✅ 清晰说明限制
- ✅ 易于维护

**劣势**：
- ⚠️ 本地无法测试完整流程
- ⚠️ 用户体验可能不够好

### 方案 4: 使用 act（本地 GitHub Actions 运行器）

**核心思想**：使用 `act` 工具在本地运行 GitHub Actions。

```bash
# 安装 act
brew install act  # macOS
# 或
choco install act-cli  # Windows

# 本地运行 GitHub Action
act -j build
```

**优势**：
- ✅ 完全模拟 GitHub Actions 环境
- ✅ 不需要写 mock
- ✅ 可以测试完整的流程

**劣势**：
- ⚠️ 需要安装额外工具
- ⚠️ 性能可能较慢
- ⚠️ 某些功能可能不完全支持

## 推荐方案：混合策略

### 核心功能：最小化 Mock

只 mock 最核心的功能：
1. **产物管理**：上传/下载产物
2. **基本输出**：设置输出变量

### 高级功能：提示 + 跳过

对于复杂功能：
1. **工作流查询**：提示不支持，建议使用本地存储
2. **GitHub API 调用**：提示不支持，建议在 CI 中运行

### 完整测试：使用 act

对于需要完整测试的场景，使用 `act` 工具。

## 实现示例

```python
# src/github_actions/hybrid.py
class HybridGitHubActions:
    """混合策略：最小化 Mock + 提示"""
    
    def __init__(self):
        self.is_ci = os.getenv("CI") == "true"
        self.local_artifacts = Path.home() / ".local" / "artifacts"
        self.local_artifacts.mkdir(parents=True, exist_ok=True)
    
    # 核心功能：完整实现
    def upload_artifact(self, name: str, path: str):
        if self.is_ci:
            self.set_output("artifact-name", name)
            self.set_output("artifact-path", path)
        else:
            local_path = self._save_to_local(name, path)
            print(f"✓ 本地产物: {local_path}")
            return local_path
    
    def download_artifact(self, name: str, path: str = None):
        if self.is_ci:
            return path or f"artifacts/{name}"
        else:
            local_path = self.local_artifacts / name
            if local_path.exists():
                if path:
                    shutil.copytree(local_path, path, dirs_exist_ok=True)
                return str(local_path)
            return None
    
    # 高级功能：提示 + 跳过
    def get_workflow_artifact(self, workflow_name: str, artifact_name: str):
        if self.is_ci:
            # CI：实际实现（使用 GitHub API）
            return self._get_from_github(workflow_name, artifact_name)
        else:
            # 本地：提示不支持
            print(f"⚠️  本地环境不支持从 GitHub 工作流获取产物")
            print(f"⚠️  提示：使用 `download_artifact('{artifact_name}')` 从本地存储获取")
            print(f"⚠️  或使用 `act` 工具在本地运行完整的 GitHub Actions")
            return None
```

## 总结

### 推荐方案

1. **核心功能**：最小化 Mock（产物管理）
2. **高级功能**：提示 + 跳过
3. **完整测试**：使用 `act` 工具

### 工作量评估

- **最小化 Mock**：1-2 天
- **完整 Mock**：1-2 周
- **使用 act**：0 天（但需要学习）

### 建议

**采用混合策略**：
- ✅ 实现核心功能的 mock（产物管理）
- ✅ 高级功能提供清晰的提示
- ✅ 推荐使用 `act` 进行完整测试

这样既能满足基本需求，又不会工作量过大。


