# 使用 act 工具在本地运行 GitHub Actions

## 什么是 act？

`act` 是一个工具，可以在本地运行 GitHub Actions，完全模拟 GitHub Actions 环境。

## 安装

### macOS
```bash
brew install act
```

### Windows
```bash
choco install act-cli
```

### Linux
```bash
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

## 基本使用

### 运行单个工作流

```bash
# 列出所有工作流
act -l

# 运行特定工作流
act -j build

# 运行特定事件
act push
act pull_request
act workflow_dispatch
```

### 运行特定步骤

```bash
# 只运行特定 job
act -j build

# 跳过某些步骤
act -j build --skip checkout
```

## 与当前项目结合

### 方案 1: 使用 act 进行完整测试

```bash
# 1. 生成 GitHub Action YAML（使用脚手架）
python src/scaffold.py --pipeline FlutterBuildPipeline --output .github/workflows/build.yml

# 2. 使用 act 在本地运行
act -j build

# 3. 测试完整流程
act -j build && act -j release
```

### 方案 2: 混合使用

```bash
# 开发阶段：直接运行 Pipeline（快速）
python -m src.pipelines.flutter_build_pipeline

# 测试阶段：使用 act 运行完整流程（完整）
act -j build
```

## 优势

1. ✅ **完全模拟**：完全模拟 GitHub Actions 环境
2. ✅ **不需要 mock**：不需要写本地 mock
3. ✅ **完整测试**：可以测试完整的流程
4. ✅ **产物支持**：支持 artifacts 上传/下载

## 劣势

1. ⚠️ **需要安装工具**：需要安装 act
2. ⚠️ **性能较慢**：比直接运行 Pipeline 慢
3. ⚠️ **某些功能不支持**：某些 GitHub 特有功能可能不支持

## 推荐使用场景

1. **完整流程测试**：测试多个工作流的组合
2. **CI 环境验证**：验证 GitHub Action YAML 是否正确
3. **调试复杂问题**：在本地复现 CI 环境的问题

## 总结

**act 工具**：
- ✅ 适合完整流程测试
- ✅ 不需要写 mock
- ⚠️ 需要安装额外工具

**最小化 Mock**：
- ✅ 适合快速开发
- ✅ 不需要额外工具
- ⚠️ 功能不完整

**推荐**：混合使用，开发时用 Pipeline，测试时用 act。


