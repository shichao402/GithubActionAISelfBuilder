#!/bin/bash
# GitHub Action Toolset 安装脚本
# 用于在 CursorToolset 安装过程中自动构建 Go 工具

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[构建]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_info "开始构建 GitHub Action 工具..."

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    print_warn "未检测到 Go，跳过构建 Go 工具"
    print_warn "AI 规则文件将正常安装，但调试工具将不可用"
    print_warn "如需使用完整功能，请安装 Go: https://go.dev/dl/"
    exit 0
fi

print_info "检测到 Go $(go version | awk '{print $3}')"

# 进入 Go 工具目录
GO_TOOL_DIR="core/tools/go"
if [ ! -d "$GO_TOOL_DIR" ]; then
    print_error "未找到 Go 工具目录: $GO_TOOL_DIR"
    exit 1
fi

cd "$GO_TOOL_DIR"

# 执行构建
print_info "构建跨平台二进制文件..."

if [ -f "build-all.sh" ]; then
    bash build-all.sh
elif [ -f "Makefile" ]; then
    make build-all
else
    print_error "未找到构建脚本"
    exit 1
fi

# 检查构建结果
if [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then
    print_info "✅ 构建完成！"
    print_info "构建产物:"
    ls -lh dist/ | tail -n +2 | awk '{print "   ", $9, "(" $5 ")"}'
else
    print_error "构建失败：未找到构建产物"
    exit 1
fi

print_info "✅ GitHub Action 工具集构建成功"
