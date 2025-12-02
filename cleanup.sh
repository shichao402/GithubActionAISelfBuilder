#!/bin/bash
# 清理旧文件脚本

set -e

echo "🧹 开始清理旧文件..."

# 1. 移动旧文档到 legacy/docs/
echo ""
echo "📁 移动旧文档到 legacy/docs/..."
mkdir -p legacy/docs

OLD_DOCS=(
    "docs/python-example.py"
    "docs/config-projectonly.md"
    "docs/parent-project-pipelines.md"
    "docs/modularity.md"
    "docs/type-safety-vs-simplicity.md"
    "docs/technical-solutions.md"
    "docs/why-gh-token-required.md"
    "docs/github-actions-authentication.md"
    "docs/github-api-client-abstraction.md"
    "docs/local-build-script-unification.md"
    "docs/USAGE_GUIDE.md"
)

for doc in "${OLD_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" legacy/docs/
        echo "  ✅ 已移动: $doc"
    fi
done

# 2. 移动旧配置到 legacy/
echo ""
echo "📁 移动旧配置到 legacy/..."
if [ -d "config" ]; then
    mv config legacy/
    echo "  ✅ 已移动: config/"
fi

# 3. 移动旧脚本到 legacy/
echo ""
echo "📁 移动旧脚本到 legacy/..."
if [ -d "scripts/tools" ]; then
    mv scripts/tools legacy/
    echo "  ✅ 已移动: scripts/tools/"
fi

if [ -f "scripts/README.md" ]; then
    mv scripts/README.md legacy/scripts-readme.md
    echo "  ✅ 已移动: scripts/README.md"
fi

# 4. 清理空目录
echo ""
echo "🗑️  清理空目录..."
find docs -type d -empty -delete 2>/dev/null || true
find scripts -type d -empty -delete 2>/dev/null || true

echo ""
echo "✅ 清理完成！"
echo ""
echo "📊 清理总结:"
echo "  - 旧文档已移至: legacy/docs/"
echo "  - 旧配置已移至: legacy/config/"
echo "  - 旧脚本已移至: legacy/"
echo ""
echo "🎯 当前项目结构:"
echo "  core/       - 核心可复用内容"
echo "  docs/       - 新的文档"
echo "  dev/        - 开发测试"
echo "  legacy/     - 旧版本归档"
echo ""

