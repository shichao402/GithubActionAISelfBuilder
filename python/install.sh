#!/bin/bash
# Python 环境安装脚本
# 
# 要求：必须使用 Conda 进行环境管理，确保一致性

set -e

echo "🚀 GitHub Action Builder - Python 环境安装"
echo "=========================================="
echo ""

# 检查是否使用 conda
if ! command -v conda &> /dev/null; then
    echo "❌ 错误: 未检测到 Conda"
    echo ""
    echo "💡 本项目要求使用 Conda 进行环境管理，以确保一致性。"
    echo ""
    echo "📥 请安装 Conda："
    echo "   1. Miniconda（推荐，体积小）:"
    echo "      https://docs.conda.io/en/latest/miniconda.html"
    echo ""
    echo "   2. Anaconda（完整版）:"
    echo "      https://www.anaconda.com/products/distribution"
    echo ""
    echo "📝 安装步骤："
    echo "   1. 下载对应平台的安装包"
    echo "   2. 运行安装程序"
    echo "   3. 重新打开终端"
    echo "   4. 重新运行此脚本: bash install.sh"
    echo ""
    exit 1
fi

echo "✅ 检测到 Conda"
echo ""

# 检查 Python 版本（通过 conda 检查）
CONDA_PYTHON_VERSION=$(conda --version 2>&1 || echo "")
echo "📋 Conda 版本: $CONDA_PYTHON_VERSION"
echo ""

# 检查环境是否已存在
if conda env list | grep -q "github-action-builder"; then
    echo "⚠️  环境 'github-action-builder' 已存在"
    read -p "是否删除并重新创建？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  删除现有环境..."
        conda env remove -n github-action-builder -y
        echo "✅ 环境已删除"
        echo ""
    else
        echo "📝 使用现有环境"
        echo ""
        echo "✅ 安装完成！"
        echo ""
        echo "📚 下一步："
        echo "   conda activate github-action-builder"
        echo "   python -m src.scaffold --help"
        exit 0
    fi
fi

# 检查 environment.yml 文件是否存在
if [ ! -f "environment.yml" ]; then
    echo "❌ 错误: 未找到 environment.yml 文件"
    echo "   请确保在 python/ 目录下运行此脚本"
    exit 1
fi

echo "📦 创建 Conda 环境..."
echo "   使用配置文件: environment.yml"
echo ""

# 创建环境
conda env create -f environment.yml

echo ""
echo "✅ Conda 环境创建成功！"
echo ""
echo "📚 下一步："
echo "   1. 激活环境:"
echo "      conda activate github-action-builder"
echo ""
echo "   2. 验证安装:"
echo "      python -m src.scaffold --help"
echo ""
echo "   3. 查看文档:"
echo "      cat QUICK_START.md"
echo ""
echo "🎉 安装完成！"
