#!/bin/bash
# 构建验证脚本

set -e

echo "🔨 开始构建 Go 工具..."

cd "$(dirname "$0")"

# 1. 下载依赖
echo ""
echo "📥 下载依赖..."
go mod download
go mod tidy

# 2. 构建
echo ""
echo "🏗️  构建..."
mkdir -p dist
go build -ldflags "-X main.Version=dev" -o dist/gh-action-debug ./cmd/gh-action-debug

# 3. 验证
echo ""
echo "✅ 验证构建..."
if [ -f "dist/gh-action-debug" ]; then
    echo "✅ 二进制文件已创建: dist/gh-action-debug"
    ls -lh dist/gh-action-debug
else
    echo "❌ 构建失败：未找到二进制文件"
    exit 1
fi

# 4. 测试基本命令
echo ""
echo "🧪 测试基本命令..."

echo "  测试 version 命令..."
./dist/gh-action-debug version

echo ""
echo "  测试 help 命令..."
./dist/gh-action-debug --help | head -n 5

echo ""
echo "✅ 构建验证完成！"
echo ""
echo "可以使用以下命令测试:"
echo "  ./dist/gh-action-debug workflow list"
echo "  ./dist/gh-action-debug workflow trigger .github/workflows/build.yml main"
echo ""


