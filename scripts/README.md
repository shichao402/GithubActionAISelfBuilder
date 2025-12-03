# Scripts 目录

此目录包含项目特定的脚本工具。

## 📁 目录结构

```
scripts/
├── flutter-build.sh    # Flutter 多平台构建脚本（项目特定）
└── README.md           # 本文件
```

## 🔧 脚本说明

### flutter-build.sh

**用途**: 本地构建 Flutter 项目，与 GitHub Actions 工作流保持一致。

**位置**: `scripts/flutter-build.sh`

**使用方式**:

```bash
# 从项目根目录运行
bash scripts/flutter-build.sh --platform android --mode release

# 查看帮助
bash scripts/flutter-build.sh --help
```

**支持的平台**:
- `android` - Android APK/AAB
- `ios` - iOS IPA
- `web` - Web 应用
- `windows` - Windows 桌面应用
- `linux` - Linux 桌面应用
- `macos` - macOS 桌面应用

**支持的构建模式**:
- `debug` - 调试模式
- `profile` - 性能分析模式
- `release` - 发布模式（默认）

**示例**:

```bash
# Android 发布构建
bash scripts/flutter-build.sh --platform android --mode release

# Windows 调试构建
bash scripts/flutter-build.sh --platform windows --mode debug

# iOS 发布构建（需要 macOS）
bash scripts/flutter-build.sh --platform ios --mode release
```

**功能**:
- ✅ 自动获取 Flutter 依赖
- ✅ 代码分析（`flutter analyze`）
- ✅ 运行测试（`flutter test`）
- ✅ 多平台构建
- ✅ 详细的错误输出
- ✅ 与 CI/CD 工作流保持一致

## 📝 注意事项

1. **项目特定**: 这些脚本是项目特定的，不会输出到其他项目
2. **Flutter 要求**: 需要安装 Flutter SDK 并配置 PATH
3. **平台限制**: iOS 构建需要 macOS，Android 需要 Android SDK

## 🔗 相关文档

- **GitHub Actions 工作流**: `.github/workflows/flutter-build.yml`
- **工作流模板**: `core/templates/build/flutter-build.yml`
- **工具集文档**: `README.md`（项目根目录）

## 🆚 与核心脚本的区别

- **`scripts/`**: 项目特定的脚本（不输出）
- **`core/scripts/`**: 工具集核心安装脚本（会输出到其他项目）
