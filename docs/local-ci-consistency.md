# 本地与 CI 一致性处理

## 问题描述

### 你的痛点

1. **GitHub Action 上运行**：
   - 构建完成后上传产物到 GitHub Actions artifacts
   - 下游工作流可以下载这个产物

2. **本地运行**：
   - 构建完成后没有 GitHub Actions，无法上传产物
   - 下游工作流无法获取产物，逻辑链条断开

3. **问题**：
   - 本地和 CI 行为不一致
   - 本地无法测试完整的流程

## 解决方案

### 方案 1: 环境检测 + 条件处理

**核心思想**：检测运行环境，本地和 CI 行为不同但逻辑一致。

```python
# src/pipelines/flutter_build_pipeline.py
class FlutterBuildPipeline(BasePipeline):
    def execute(self):
        # 构建逻辑（本地和 CI 都用）
        self._run_command("flutter build windows --release")
        
        # 产物处理
        artifact_path = "artifacts/flutter-windows"
        
        # 环境检测
        is_ci = os.getenv("CI") == "true" or os.getenv("GITHUB_ACTIONS") == "true"
        
        if is_ci:
            # CI 环境：设置输出，让 GitHub Action 上传
            self.set_output("artifact-path", artifact_path)
            self.set_output("upload-artifacts", "true")
        else:
            # 本地环境：模拟或跳过上传
            self.logger.info(f"本地构建完成，产物位置: {artifact_path}")
            self.logger.info("提示: 本地环境不会上传产物到 GitHub Actions")
            # 可以选择：复制到本地目录、打印路径等
            self.set_output("artifact-path", artifact_path)
            self.set_output("upload-artifacts", "false")
        
        return PipelineResult(
            success=True,
            message="构建完成",
            data={
                "artifact-path": artifact_path,
                "is-ci": is_ci
            }
        )
```

### 方案 2: 产物本地存储 + 模拟下载

**核心思想**：本地也保存产物，下游工作流可以从本地读取。

```python
# src/pipelines/flutter_build_pipeline.py
class FlutterBuildPipeline(BasePipeline):
    def execute(self):
        # 构建逻辑
        self._run_command("flutter build windows --release")
        
        # 产物处理
        artifact_path = "artifacts/flutter-windows"
        
        # 环境检测
        is_ci = os.getenv("CI") == "true"
        
        if is_ci:
            # CI 环境：设置输出，让 GitHub Action 上传
            self.set_output("artifact-path", artifact_path)
        else:
            # 本地环境：保存到本地，供下游工作流使用
            local_artifact_dir = Path.home() / ".local" / "artifacts" / self.get_input("project-name", "unknown")
            local_artifact_dir.mkdir(parents=True, exist_ok=True)
            
            # 复制产物到本地存储
            import shutil
            shutil.copytree(artifact_path, local_artifact_dir / "flutter-windows", dirs_exist_ok=True)
            
            # 保存元数据
            metadata = {
                "artifact-path": str(local_artifact_dir / "flutter-windows"),
                "build-time": datetime.now().isoformat(),
            }
            with open(local_artifact_dir / "metadata.json", "w") as f:
                json.dump(metadata, f)
            
            self.logger.info(f"本地产物已保存到: {local_artifact_dir}")
            self.set_output("artifact-path", str(local_artifact_dir / "flutter-windows"))
        
        return PipelineResult(success=True, message="构建完成")
```

### 方案 3: 下游工作流也支持本地运行

**核心思想**：下游工作流也能在本地运行，从本地读取产物。

```python
# src/pipelines/release_pipeline.py
class ReleasePipeline(BasePipeline):
    def execute(self):
        # 环境检测
        is_ci = os.getenv("CI") == "true"
        
        if is_ci:
            # CI 环境：从 GitHub Actions artifacts 下载
            # 这个步骤在 GitHub Action YAML 中处理
            artifact_path = self.get_input("artifact-path", "artifacts")
        else:
            # 本地环境：从本地存储读取
            project_name = self.get_input("project-name", "unknown")
            local_artifact_dir = Path.home() / ".local" / "artifacts" / project_name
            
            if not local_artifact_dir.exists():
                return PipelineResult(
                    success=False,
                    message=f"本地产物不存在: {local_artifact_dir}",
                    exit_code=1
                )
            
            # 读取元数据
            metadata_file = local_artifact_dir / "metadata.json"
            if metadata_file.exists():
                with open(metadata_file) as f:
                    metadata = json.load(f)
                    artifact_path = metadata["artifact-path"]
            else:
                artifact_path = str(local_artifact_dir / "flutter-windows")
            
            self.logger.info(f"从本地读取产物: {artifact_path}")
        
        # 发布逻辑（本地和 CI 都用）
        version = self.get_input("version", "1.0.0")
        
        if is_ci:
            # CI 环境：使用 GitHub API 创建 Release
            self._create_github_release(version, artifact_path)
        else:
            # 本地环境：模拟或跳过
            self.logger.info(f"本地环境：模拟创建 Release v{version}")
            self.logger.info(f"产物路径: {artifact_path}")
            # 可以选择：创建本地 Release 目录、打印信息等
        
        return PipelineResult(success=True, message="发布完成")
```

## 完整示例

### 构建 Pipeline（支持本地和 CI）

```python
# src/pipelines/flutter_build_pipeline.py
import os
from pathlib import Path

class FlutterBuildPipeline(BasePipeline):
    def execute(self):
        # 1. 构建逻辑（本地和 CI 都用）
        self._run_command("flutter build windows --release")
        
        # 2. 产物处理
        artifact_path = "artifacts/flutter-windows"
        
        # 3. 环境检测
        is_ci = self._is_ci_environment()
        
        # 4. 产物处理（根据环境不同）
        if is_ci:
            # CI 环境：设置输出，让 GitHub Action 上传
            self.set_output("artifact-path", artifact_path)
            self.set_output("upload-artifacts", "true")
            self.logger.info("CI 环境：产物将上传到 GitHub Actions")
        else:
            # 本地环境：保存到本地存储
            local_path = self._save_to_local_storage(artifact_path)
            self.set_output("artifact-path", local_path)
            self.set_output("upload-artifacts", "false")
            self.logger.info(f"本地环境：产物已保存到 {local_path}")
        
        return PipelineResult(
            success=True,
            message="构建完成",
            data={
                "artifact-path": artifact_path,
                "is-ci": is_ci
            }
        )
    
    def _is_ci_environment(self) -> bool:
        """检测是否在 CI 环境中"""
        return (
            os.getenv("CI") == "true" or
            os.getenv("GITHUB_ACTIONS") == "true" or
            os.getenv("GITHUB_RUN_ID") is not None
        )
    
    def _save_to_local_storage(self, artifact_path: str) -> str:
        """保存产物到本地存储"""
        project_name = self.get_input("project-name", "unknown")
        local_artifact_dir = Path.home() / ".local" / "artifacts" / project_name
        local_artifact_dir.mkdir(parents=True, exist_ok=True)
        
        # 复制产物
        import shutil
        target_path = local_artifact_dir / "flutter-windows"
        if Path(artifact_path).exists():
            if target_path.exists():
                shutil.rmtree(target_path)
            shutil.copytree(artifact_path, target_path)
        
        # 保存元数据
        metadata = {
            "artifact-path": str(target_path),
            "build-time": datetime.now().isoformat(),
            "build-version": self.get_input("build-version", "unknown"),
        }
        with open(local_artifact_dir / "metadata.json", "w") as f:
            json.dump(metadata, f, indent=2)
        
        return str(target_path)
```

### 发布 Pipeline（支持本地和 CI）

```python
# src/pipelines/release_pipeline.py
class ReleasePipeline(BasePipeline):
    def execute(self):
        # 1. 环境检测
        is_ci = self._is_ci_environment()
        
        # 2. 获取产物路径（根据环境不同）
        if is_ci:
            # CI 环境：从 GitHub Actions artifacts 下载
            # 这个步骤在 GitHub Action YAML 中处理
            artifact_path = self.get_input("artifact-path", "artifacts")
        else:
            # 本地环境：从本地存储读取
            artifact_path = self._get_local_artifact_path()
            if not artifact_path:
                return PipelineResult(
                    success=False,
                    message="本地产物不存在，请先运行构建 Pipeline",
                    exit_code=1
                )
        
        # 3. 发布逻辑（本地和 CI 都用）
        version = self.get_input("version", "1.0.0")
        
        if is_ci:
            # CI 环境：使用 GitHub API 创建 Release
            self._create_github_release(version, artifact_path)
        else:
            # 本地环境：模拟或创建本地 Release
            self._create_local_release(version, artifact_path)
        
        return PipelineResult(success=True, message="发布完成")
    
    def _get_local_artifact_path(self) -> str:
        """从本地存储获取产物路径"""
        project_name = self.get_input("project-name", "unknown")
        local_artifact_dir = Path.home() / ".local" / "artifacts" / project_name
        metadata_file = local_artifact_dir / "metadata.json"
        
        if metadata_file.exists():
            with open(metadata_file) as f:
                metadata = json.load(f)
                return metadata.get("artifact-path", str(local_artifact_dir / "flutter-windows"))
        
        # 回退到默认路径
        default_path = local_artifact_dir / "flutter-windows"
        if default_path.exists():
            return str(default_path)
        
        return None
    
    def _create_local_release(self, version: str, artifact_path: str):
        """创建本地 Release（模拟）"""
        release_dir = Path("releases") / f"v{version}"
        release_dir.mkdir(parents=True, exist_ok=True)
        
        # 复制产物
        import shutil
        if Path(artifact_path).exists():
            shutil.copytree(artifact_path, release_dir / "artifacts", dirs_exist_ok=True)
        
        self.logger.info(f"本地 Release 已创建: {release_dir}")
        self.logger.info(f"产物路径: {release_dir / 'artifacts'}")
```

## 使用示例

### 本地运行完整流程

```bash
# 1. 构建
python -m src.pipelines.flutter_build_pipeline \
    --input project-name="my-project" \
    --input build-mode="release"

# 输出：
# 本地环境：产物已保存到 ~/.local/artifacts/my-project/flutter-windows

# 2. 发布（从本地读取产物）
python -m src.pipelines.release_pipeline \
    --input project-name="my-project" \
    --input version="1.0.0"

# 输出：
# 从本地读取产物: ~/.local/artifacts/my-project/flutter-windows
# 本地 Release 已创建: releases/v1.0.0
```

### CI 运行完整流程

```yaml
# .github/workflows/build.yml（自动生成）
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - name: Run Build
        run: python -m src.pipelines.flutter_build_pipeline
      - uses: actions/upload-artifact@v3
        with:
          path: artifacts/**

# .github/workflows/release.yml（自动生成）
jobs:
  release:
    needs: build
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: build-artifacts
      - name: Run Release
        run: python -m src.pipelines.release_pipeline \
          --input version="1.0.0"
```

## 总结

### 解决方案

1. **环境检测**：检测是本地还是 CI 环境
2. **产物处理**：
   - CI：上传到 GitHub Actions artifacts
   - 本地：保存到本地存储（`~/.local/artifacts/`）
3. **下游工作流**：
   - CI：从 GitHub Actions artifacts 下载
   - 本地：从本地存储读取

### 优势

1. ✅ **逻辑一致**：本地和 CI 使用同一套代码
2. ✅ **行为适配**：根据环境自动适配行为
3. ✅ **完整测试**：本地可以测试完整的流程链条
4. ✅ **易于调试**：本地产物保存在已知位置

### 关键点

- **环境检测**：`os.getenv("CI")` 或 `os.getenv("GITHUB_ACTIONS")`
- **产物存储**：本地使用 `~/.local/artifacts/`，CI 使用 GitHub Actions artifacts
- **元数据**：保存构建信息，供下游工作流使用

这样就能保证本地和 CI 的逻辑一致，同时适配不同的环境！


