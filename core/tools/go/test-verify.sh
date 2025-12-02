#!/bin/bash
# 测试验证脚本

set -e

echo "🧪 开始运行测试..."

cd "$(dirname "$0")"

# 1. 运行所有测试
echo ""
echo "📋 运行单元测试..."
go test ./... -v

# 2. 测试覆盖率
echo ""
echo "📊 生成测试覆盖率..."
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out | tail -n 1

# 3. 生成 HTML 覆盖率报告
echo ""
echo "📄 生成 HTML 覆盖率报告..."
go tool cover -html=coverage.out -o coverage.html
echo "✅ 覆盖率报告已生成: coverage.html"

echo ""
echo "✅ 测试完成！"


