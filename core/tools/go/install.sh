#!/bin/bash
# gh-action-debug 安装脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
print_info "工具路径: $SCRIPT_DIR"

# 检测操作系统和架构
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
    x86_64)
        ARCH="amd64"
        ;;
    aarch64|arm64)
        ARCH="arm64"
        ;;
    *)
        print_error "不支持的架构: $ARCH"
        exit 1
        ;;
esac

BINARY_NAME="gh-action-debug-${OS}-${ARCH}"
if [ "$OS" = "windows" ]; then
    BINARY_NAME="${BINARY_NAME}.exe"
fi

print_info "检测到系统: $OS $ARCH"
print_info "二进制文件: $BINARY_NAME"

# 检查二进制文件是否存在
BINARY_PATH="$SCRIPT_DIR/dist/$BINARY_NAME"
if [ ! -f "$BINARY_PATH" ]; then
    print_error "未找到二进制文件: $BINARY_PATH"
    print_info "请先构建工具:"
    print_info "  cd $SCRIPT_DIR"
    print_info "  bash build-all.sh"
    exit 1
fi

# 安装到系统
INSTALL_DIR="/usr/local/bin"
INSTALL_PATH="$INSTALL_DIR/gh-action-debug"

print_info "准备安装到: $INSTALL_PATH"

# 检查是否需要 sudo
if [ -w "$INSTALL_DIR" ]; then
    cp "$BINARY_PATH" "$INSTALL_PATH"
else
    print_warn "需要管理员权限安装到 $INSTALL_DIR"
    sudo cp "$BINARY_PATH" "$INSTALL_PATH"
fi

# 添加执行权限
if [ -w "$INSTALL_PATH" ]; then
    chmod +x "$INSTALL_PATH"
else
    sudo chmod +x "$INSTALL_PATH"
fi

print_info "✅ 安装完成！"
echo ""
print_info "验证安装:"
echo "  gh-action-debug version"
echo ""
print_info "使用示例:"
echo "  gh-action-debug workflow list"
echo "  gh-action-debug workflow debug .github/workflows/build.yml main"
echo ""

# 验证安装
if command -v gh-action-debug &> /dev/null; then
    print_info "✅ gh-action-debug 已成功安装"
    gh-action-debug version
else
    print_error "安装失败：无法找到 gh-action-debug"
    exit 1
fi

