#!/bin/bash
# 本地构建脚本
# 使用与 GitHub Action 相同的 Pipeline 类

set -e

echo "🚀 开始本地构建..."

# 激活虚拟环境（如果需要）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 运行 Pipeline（和 GitHub Action 用同一个）
python -m src.pipelines.build_pipeline \
    --input project-name="my-project" \
    --input build-mode="release" \
    --input build-version="local-$(date +%Y%m%d-%H%M%S)" \
    --input upload-artifacts="false"  # 本地不上传

echo "✅ 构建完成！"
echo "📦 产物位置: artifacts/"


