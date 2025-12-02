# Flutter 构建工具使用指南

## 📋 概述

本项目提供了 Flutter 项目的本地构建脚本和 GitHub Actions 工作流模板，确保本地和 CI 环境的一致性。

## 🛠️ 本地构建脚本

### 位置

`scripts/flutter-build.sh`

### 功能

- ✅ 获取 Flutter 依赖
- ✅ 代码分析
- ✅ 运行测试
- ✅ 构建指定平台的应用
- ✅ 显示构建产物位置

### 使用方法

```bash
# 基本用法（需要指定平台）
bash scripts/flutter-build.sh --platform android

# 指定构建模式
bash scripts/flutter-build.sh --platform windows --mode release

# 指定目标文件
bash scripts/flutter-build.sh --platform web --target lib/main_web.dart

# 详细输出
bash scripts/flutter-build.sh --platform android --verbose

# 查看帮助
bash scripts/flutter-build.sh --help
```

### 支持的平台

- `android` - Android APK/AAB
- `ios` - iOS IPA/App
- `web` - Web 应用
- `windows` - Windows 桌面应用
- `linux` - Linux 桌面应用
- `macos` - macOS 桌面应用

### 构建模式

- `debug` - 调试模式（默认）
- `profile` - 性能分析模式
- `release` - 发布模式（默认）

### 示例

```bash
# 构建 Android 发布版本
bash scripts/flutter-build.sh --platform android --mode release

# 构建 Windows 调试版本
bash scripts/flutter-build.sh --platform windows --mode debug

# 构建 Web 应用
bash scripts/flutter-build.sh --platform web
```

## 🔄 GitHub Actions 工作流

### 模板位置

`.github/templates/build/flutter-build.yml`

### 特性

- ✅ 多平台矩阵构建
- ✅ 自动依赖缓存
- ✅ 代码分析和测试
- ✅ 构建产物上传
- ✅ 支持手动触发

### 创建工作流

```bash
# 从模板复制
cp .github/templates/build/flutter-build.yml .github/workflows/flutter-build.yml

# 根据需要自定义
vim .github/workflows/flutter-build.yml
```

### 触发条件

- **Push** 到 `main` 或 `develop` 分支（当相关文件变更时）
- **Pull Request** 到 `main` 分支
- **手动触发**（workflow_dispatch）

### 手动触发参数

- `platform` - 目标平台（必需）
- `build_mode` - 构建模式（可选，默认：release）

### 构建矩阵

工作流会在以下平台构建：

- ✅ Android (Ubuntu)
- ✅ iOS (macOS)
- ✅ Web (Ubuntu)
- ✅ Windows (Windows)
- ✅ Linux (Ubuntu)
- ✅ macOS (macOS)

## 🧪 验证和测试

### 1. 验证本地脚本

```bash
# 检查脚本语法
bash -n scripts/flutter-build.sh

# 查看帮助（验证参数解析）
bash scripts/flutter-build.sh --help
```

### 2. 测试本地构建（如果有 Flutter 项目）

```bash
# 在 Flutter 项目根目录运行
bash scripts/flutter-build.sh --platform web --verbose
```

### 3. 验证工作流文件

```bash
# 检查 YAML 语法
yamllint .github/workflows/flutter-build.yml

# 或使用 GitHub CLI
gh workflow list
```

### 4. 推送并测试工作流

```bash
# 1. 添加工作流文件
git add .github/workflows/flutter-build.yml
git commit -m "feat: add Flutter build workflow"
git push origin main

# 2. 使用 gh-action-debug 调试
gh-action-debug workflow debug .github/workflows/flutter-build.yml main --output json
```

## 🔍 调试工作流

### 使用 gh-action-debug（推荐）

```bash
# 完整调试流程（JSON 输出，AI 友好）
gh-action-debug workflow debug .github/workflows/flutter-build.yml main --output json

# 详细输出（人类可读）
gh-action-debug workflow debug .github/workflows/flutter-build.yml main --verbose

# 手动触发并调试
gh-action-debug workflow trigger .github/workflows/flutter-build.yml main \
  --input platform=web \
  --input build_mode=release
```

### 调试流程

1. **修改工作流或代码**
2. **推送代码到远程仓库**（必须！）
3. **使用 gh-action-debug 触发并监控**
4. **查看 JSON 输出中的错误和建议**
5. **根据建议修复**
6. **重复步骤 1-5 直到成功**

### 常见问题

#### 问题 1: Flutter 版本不匹配

**错误**：
```
Error: Flutter version mismatch
```

**解决**：
```yaml
# 在 .github/workflows/flutter-build.yml 中
env:
  FLUTTER_VERSION: '3.24.0'  # 改为你的 Flutter 版本
```

#### 问题 2: 平台特定构建失败

**错误**：
```
Error: Building for platform X failed
```

**解决**：
- 检查平台特定的依赖是否满足
- 查看详细日志：`gh-action-debug workflow debug ... --verbose`
- 可能需要额外的系统依赖或配置

#### 问题 3: 测试失败

**错误**：
```
Error: Tests failed
```

**解决**：
- 工作流中测试步骤设置了 `continue-on-error: true`
- 构建会继续，但需要修复测试
- 本地运行测试：`flutter test`

## 📊 构建产物

### 本地构建产物位置

- **Android**: `build/app/outputs/flutter-apk/` 或 `build/app/outputs/bundle/`
- **iOS**: `build/ios/ipa/` 或 `build/ios/iphoneos/`
- **Web**: `build/web/`
- **Windows**: `build/windows/runner/Release/`
- **Linux**: `build/linux/`
- **macOS**: `build/macos/Build/Products/Release/`

### GitHub Actions 构建产物

- 自动上传到 Artifacts
- 保留 7 天
- 可以从 Actions 页面下载

## 🎯 最佳实践

1. **本地优先**：确保本地能构建，CI 才能构建
2. **版本一致**：本地和 CI 使用相同的 Flutter 版本
3. **测试先行**：先运行测试，再构建
4. **缓存依赖**：使用 Flutter 缓存加快构建速度
5. **错误处理**：使用 `continue-on-error` 处理非关键步骤

## 📚 相关文档

- [GitHub Actions 规则](core/rules/github-actions.mdc)
- [调试规则](core/rules/debugging.mdc)
- [最佳实践](core/rules/best-practices.mdc)
- [Flutter 官方文档](https://flutter.dev/docs)

## ✅ 检查清单

- [ ] 本地构建脚本已创建并测试
- [ ] GitHub Actions 模板已创建
- [ ] 工作流文件已从模板复制
- [ ] 代码已推送到远程仓库
- [ ] 使用 gh-action-debug 测试工作流
- [ ] 构建成功并验证产物

---

**🎉 现在你可以使用 Flutter 构建工具了！**


