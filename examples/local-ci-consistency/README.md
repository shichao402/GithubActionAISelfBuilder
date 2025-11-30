# 本地与 CI 一致性处理示例

## 问题

1. **GitHub Action 上运行**：构建完成后上传产物到 GitHub Actions artifacts
2. **本地运行**：构建完成后没有 GitHub Actions，无法上传产物
3. **下游工作流**：依赖产物，本地无法测试完整流程

## 解决方案

### 核心思想

1. **环境检测**：检测是本地还是 CI 环境
2. **产物处理**：
   - CI：上传到 GitHub Actions artifacts
   - 本地：保存到本地存储（`~/.local/artifacts/`）
3. **下游工作流**：
   - CI：从 GitHub Actions artifacts 下载
   - 本地：从本地存储读取

## 使用示例

### 本地运行完整流程

```bash
# 1. 构建（产物保存到本地存储）
python -m src.pipelines.flutter_build_pipeline \
    --input project-name="my-project" \
    --input build-mode="release"

# 输出：
# 本地环境：产物已保存到 ~/.local/artifacts/my-project/flutter-windows

# 2. 发布（从本地存储读取产物）
python -m src.pipelines.release_pipeline \
    --input project-name="my-project" \
    --input version="1.0.0"

# 输出：
# 本地环境：从本地存储读取 ~/.local/artifacts/my-project/flutter-windows
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

## 关键实现

### 1. 环境检测

```python
def _is_ci_environment(self) -> bool:
    return (
        os.getenv("CI") == "true" or
        os.getenv("GITHUB_ACTIONS") == "true" or
        os.getenv("GITHUB_RUN_ID") is not None
    )
```

### 2. 产物处理

```python
if is_ci:
    # CI：设置输出，让 GitHub Action 上传
    self.set_output("artifact-path", artifact_path)
else:
    # 本地：保存到本地存储
    local_path = self._save_to_local_storage(artifact_path)
    self.set_output("artifact-path", local_path)
```

### 3. 下游工作流

```python
if is_ci:
    # CI：从 GitHub Actions artifacts 读取
    artifact_path = self.get_input("artifact-path", "artifacts")
else:
    # 本地：从本地存储读取
    artifact_path = self._get_local_artifact_path()
```

## 优势

1. ✅ **逻辑一致**：本地和 CI 使用同一套代码
2. ✅ **行为适配**：根据环境自动适配行为
3. ✅ **完整测试**：本地可以测试完整的流程链条
4. ✅ **易于调试**：本地产物保存在已知位置

## 本地存储结构

```
~/.local/artifacts/
└── my-project/
    ├── metadata.json          # 构建元数据
    └── flutter-windows/       # 构建产物
        ├── app.exe
        └── ...
```

## 元数据格式

```json
{
  "artifact-path": "/home/user/.local/artifacts/my-project/flutter-windows",
  "build-time": "2024-01-01T12:00:00",
  "build-version": "1.0.0"
}
```


