#!/bin/bash
# 跨平台构建脚本

set -e

echo "🏗️  开始跨平台构建..."

cd "$(dirname "$0")"

VERSION=${VERSION:-"1.0.0"}
BUILD_DIR="dist"

mkdir -p "$BUILD_DIR"

echo ""
echo "📦 构建版本: $VERSION"
echo ""

# Linux AMD64
echo "📦 构建 Linux AMD64..."
GOOS=linux GOARCH=amd64 go build \
  -ldflags "-X main.Version=$VERSION" \
  -o "$BUILD_DIR/gh-action-debug-linux-amd64" \
  ./cmd/gh-action-debug
echo "✅ $BUILD_DIR/gh-action-debug-linux-amd64"

# Linux ARM64
echo "📦 构建 Linux ARM64..."
GOOS=linux GOARCH=arm64 go build \
  -ldflags "-X main.Version=$VERSION" \
  -o "$BUILD_DIR/gh-action-debug-linux-arm64" \
  ./cmd/gh-action-debug
echo "✅ $BUILD_DIR/gh-action-debug-linux-arm64"

# macOS AMD64
echo "📦 构建 macOS AMD64..."
GOOS=darwin GOARCH=amd64 go build \
  -ldflags "-X main.Version=$VERSION" \
  -o "$BUILD_DIR/gh-action-debug-darwin-amd64" \
  ./cmd/gh-action-debug
echo "✅ $BUILD_DIR/gh-action-debug-darwin-amd64"

# macOS ARM64 (M1/M2)
echo "📦 构建 macOS ARM64..."
GOOS=darwin GOARCH=arm64 go build \
  -ldflags "-X main.Version=$VERSION" \
  -o "$BUILD_DIR/gh-action-debug-darwin-arm64" \
  ./cmd/gh-action-debug
echo "✅ $BUILD_DIR/gh-action-debug-darwin-arm64"

# Windows AMD64
echo "📦 构建 Windows AMD64..."
GOOS=windows GOARCH=amd64 go build \
  -ldflags "-X main.Version=$VERSION" \
  -o "$BUILD_DIR/gh-action-debug-windows-amd64.exe" \
  ./cmd/gh-action-debug
echo "✅ $BUILD_DIR/gh-action-debug-windows-amd64.exe"

echo ""
echo "✅ 所有平台构建完成！"
echo ""
echo "📊 构建产物:"
ls -lh "$BUILD_DIR"
echo ""

