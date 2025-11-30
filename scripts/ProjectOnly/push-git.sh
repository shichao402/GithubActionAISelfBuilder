#!/bin/bash
# 一键推送 Git 脚本 (Shell)
#
# 自动添加、提交并推送更改到远程仓库，方便持续测试 GitHub Actions。
#
# 用法:
#   ./scripts/push-git.sh [提交信息]
#   或
#   ./scripts/push-git.sh "fix: update test"

set -e

COMMIT_MESSAGE="${1:-}"

echo "🚀 开始一键推送 Git..."
echo ""

# 1. 检查是否有未提交的更改
if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️  没有未提交的更改，无需推送"
    exit 0
fi

# 2. 显示当前状态
echo "📋 当前 Git 状态:"
git status -s
echo ""

# 3. 获取提交信息
if [ -z "$COMMIT_MESSAGE" ]; then
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_MESSAGE="chore: update for testing GitHub Actions [$TIMESTAMP]"
fi

# 4. 添加所有更改
echo "📦 添加所有更改..."
git add -A
echo "✅ 更改已添加"
echo ""

# 5. 提交
echo "💾 提交更改: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"
echo "✅ 更改已提交"
echo ""

# 6. 检查是否有远程仓库
if [ -z "$(git remote)" ]; then
    echo "⚠️  警告: 未配置远程仓库，跳过推送"
    exit 0
fi

# 7. 获取当前分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ -z "$BRANCH" ]; then
    echo "❌ 无法获取当前分支名"
    exit 1
fi

# 8. 推送
echo "📤 推送到远程仓库 (分支: $BRANCH)..."
if ! git push origin "$BRANCH"; then
    echo ""
    echo "❌ 推送失败！"
    echo "提示: 如果是因为远程分支不存在，可以运行:"
    echo "   git push -u origin $BRANCH"
    exit 1
fi

echo "✅ 推送成功！"
echo ""
echo "🎉 所有操作完成！"

