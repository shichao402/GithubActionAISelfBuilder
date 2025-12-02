#!/bin/bash
# Flutter 项目构建脚本
#
# 用途：本地构建 Flutter 项目，与 GitHub Actions 保持一致
# 使用：bash scripts/flutter-build.sh [options]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 默认配置
BUILD_MODE="release"
PLATFORM=""
TARGET=""
VERBOSE=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            BUILD_MODE="$2"
            shift 2
            ;;
        --platform)
            PLATFORM="$2"
            shift 2
            ;;
        --target)
            TARGET="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Flutter 构建脚本"
            echo ""
            echo "用法: bash scripts/flutter-build.sh [options]"
            echo ""
            echo "选项:"
            echo "  --mode <mode>        构建模式 (debug|profile|release, 默认: release)"
            echo "  --platform <platform> 目标平台 (android|ios|web|windows|linux|macos)"
            echo "  --target <path>      目标文件路径"
            echo "  --verbose, -v         详细输出"
            echo "  --help, -h           显示帮助信息"
            echo ""
            echo "示例:"
            echo "  bash scripts/flutter-build.sh --platform android"
            echo "  bash scripts/flutter-build.sh --platform windows --mode release"
            echo "  bash scripts/flutter-build.sh --platform web --target lib/main_web.dart"
            exit 0
            ;;
        *)
            print_error "未知参数: $1"
            echo "使用 --help 查看帮助"
            exit 1
            ;;
    esac
done

# 检查 Flutter 是否安装
if ! command -v flutter &> /dev/null; then
    print_error "Flutter 未安装或不在 PATH 中"
    print_info "请安装 Flutter: https://flutter.dev/docs/get-started/install"
    exit 1
fi

# 显示 Flutter 版本
print_info "Flutter 版本: $(flutter --version | head -n 1)"

# 检查是否在 Flutter 项目目录
if [ ! -f "pubspec.yaml" ]; then
    print_error "未找到 pubspec.yaml，请确保在 Flutter 项目根目录运行此脚本"
    exit 1
fi

print_step "开始构建 Flutter 项目..."

# 1. 获取依赖
print_step "1. 获取 Flutter 依赖..."
if [ "$VERBOSE" = true ]; then
    flutter pub get
else
    flutter pub get > /dev/null 2>&1 || {
        print_error "获取依赖失败"
        exit 1
    }
fi
print_info "✅ 依赖获取完成"

# 2. 分析代码（可选，但推荐）
print_step "2. 分析代码..."
if [ "$VERBOSE" = true ]; then
    flutter analyze || print_warn "代码分析发现问题，但继续构建"
else
    flutter analyze > /dev/null 2>&1 || print_warn "代码分析发现问题，但继续构建"
fi

# 3. 运行测试（可选）
print_step "3. 运行测试..."
if [ -d "test" ] && [ "$(find test -name '*.dart' | wc -l)" -gt 0 ]; then
    if [ "$VERBOSE" = true ]; then
        flutter test || print_warn "测试失败，但继续构建"
    else
        flutter test > /dev/null 2>&1 || print_warn "测试失败，但继续构建"
    fi
else
    print_info "未找到测试文件，跳过测试"
fi

# 4. 构建项目
print_step "4. 构建项目..."

BUILD_CMD="flutter build"

# 添加平台参数
if [ -n "$PLATFORM" ]; then
    BUILD_CMD="$BUILD_CMD $PLATFORM"
else
    print_error "必须指定 --platform 参数"
    echo "支持的平台: android, ios, web, windows, linux, macos"
    exit 1
fi

# 添加模式参数
BUILD_CMD="$BUILD_CMD --$BUILD_MODE"

# 添加目标文件参数
if [ -n "$TARGET" ]; then
    BUILD_CMD="$BUILD_CMD --target $TARGET"
fi

print_info "执行命令: $BUILD_CMD"

if [ "$VERBOSE" = true ]; then
    eval "$BUILD_CMD"
else
    eval "$BUILD_CMD" || {
        print_error "构建失败"
        exit 1
    }
fi

print_info "✅ 构建完成"

# 5. 显示构建产物位置
print_step "5. 构建产物位置:"
case $PLATFORM in
    android)
        print_info "APK: build/app/outputs/flutter-apk/app-$BUILD_MODE.apk"
        print_info "AAB: build/app/outputs/bundle/${BUILD_MODE}AppBundle/app-$BUILD_MODE.aab"
        ;;
    ios)
        print_info "IPA: build/ios/ipa/"
        print_info "App: build/ios/iphoneos/Runner.app"
        ;;
    web)
        print_info "Web 构建: build/web/"
        ;;
    windows)
        print_info "Windows 构建: build/windows/runner/Release/"
        ;;
    linux)
        print_info "Linux 构建: build/linux/"
        ;;
    macos)
        print_info "macOS 构建: build/macos/Build/Products/Release/"
        ;;
esac

print_info "🎉 构建成功完成！"

