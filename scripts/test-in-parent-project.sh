#!/bin/bash
# 测试脚本：在模拟的父项目中测试 Cursor 规则排除功能
#
# 使用方法：
#   bash scripts/test-in-parent-project.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_PARENT_DIR="/tmp/test-cursor-rules-parent"

echo "🧪 创建测试父项目..."
echo "   测试目录: $TEST_PARENT_DIR"
echo ""

# 清理旧的测试目录
if [ -d "$TEST_PARENT_DIR" ]; then
  echo "清理旧的测试目录..."
  rm -rf "$TEST_PARENT_DIR"
fi

# 创建测试父项目结构
mkdir -p "$TEST_PARENT_DIR"
cd "$TEST_PARENT_DIR"

# 初始化 npm 项目
echo "1️⃣  初始化测试父项目..."
npm init -y > /dev/null 2>&1

# 创建子目录结构（模拟 Git Submodule）
echo "2️⃣  创建子目录结构..."
mkdir -p Tools/GithubActionAISelfBuilder

# 复制规则文件（模拟 Git Submodule 中的规则）
echo "3️⃣  复制规则文件..."
mkdir -p Tools/GithubActionAISelfBuilder/.cursor
cp -r "$PROJECT_ROOT/.cursor/rules" Tools/GithubActionAISelfBuilder/.cursor/

# 复制测试脚本
echo "4️⃣  复制测试脚本..."
mkdir -p Tools/GithubActionAISelfBuilder/scripts
cp "$PROJECT_ROOT/scripts/test-cursor-rules.ts" Tools/GithubActionAISelfBuilder/scripts/
cp "$PROJECT_ROOT/package.json" Tools/GithubActionAISelfBuilder/

# 创建 .cursorignore 文件
echo "5️⃣  创建 .cursorignore 文件..."
cat > .cursorignore << 'EOF'
# 排除本项目特有的规则文件（ProjectOnly 目录）
Tools/GithubActionAISelfBuilder/.cursor/rules/ProjectOnly/
EOF

echo "   ✓ .cursorignore 内容:"
cat .cursorignore
echo ""

# 运行测试脚本
echo "6️⃣  运行测试脚本..."
echo ""
cd "$TEST_PARENT_DIR"

# 检查是否有 ts-node
if ! command -v ts-node &> /dev/null; then
  echo "   ⚠️  ts-node 未安装，尝试使用项目本地的..."
  if [ -f "$PROJECT_ROOT/node_modules/.bin/ts-node" ]; then
    TS_NODE="$PROJECT_ROOT/node_modules/.bin/ts-node"
  else
    echo "   ❌ 无法找到 ts-node，请先运行: npm install"
    exit 1
  fi
else
  TS_NODE="ts-node"
fi

$TS_NODE Tools/GithubActionAISelfBuilder/scripts/test-cursor-rules.ts "$TEST_PARENT_DIR"

echo ""
echo "✅ 测试完成！"
echo ""
echo "📝 下一步："
echo "   1. 在 Cursor 中打开测试父项目: $TEST_PARENT_DIR"
echo "   2. 验证规则列表，应该只看到共享规则"
echo "   3. 清理测试目录: rm -rf $TEST_PARENT_DIR"

