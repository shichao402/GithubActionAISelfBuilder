#!/bin/bash
# GitHub Action Builder - 环境安装脚本 (Bash)
# 
# 此脚本用于安装 Python 环境和依赖
# 要求: 必须使用 Conda 进行环境管理

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PYTHON_DIR="$PROJECT_ROOT/python"

echo "🚀 GitHub Action Builder - 环境安装"
echo "=================================="
echo ""

# 检查 Conda
if ! command -v conda &> /dev/null; then
    echo "❌ 错误: 未找到 Conda"
    echo ""
    echo "📝 请先安装 Conda:"
    echo "   - Miniconda: https://docs.conda.io/en/latest/miniconda.html"
    echo "   - Anaconda: https://www.anaconda.com/products/distribution"
    echo ""
    echo "安装后，请重新运行此脚本。"
    exit 1
fi

echo "✅ 检测到 Conda: $(conda --version)"
echo ""

# 检查 environment.yml
ENV_FILE="$PYTHON_DIR/environment.yml"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 错误: 未找到 environment.yml 文件: $ENV_FILE"
    exit 1
fi

echo "📋 环境配置文件: $ENV_FILE"
echo ""

# 创建/更新 Conda 环境
echo "🔧 创建/更新 Conda 环境: github-action-builder"
echo ""

cd "$PYTHON_DIR"

conda env update -f environment.yml --name github-action-builder

echo ""
echo "✅ 环境安装完成！"
echo ""
echo "📝 使用环境:"
echo "   conda activate github-action-builder"
echo ""

