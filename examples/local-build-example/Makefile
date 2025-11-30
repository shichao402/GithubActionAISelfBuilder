# Makefile - 本地构建命令
# 使用与 GitHub Action 相同的 Pipeline 类

.PHONY: build test clean help

help:
	@echo "可用命令:"
	@echo "  make build  - 构建项目"
	@echo "  make test   - 运行测试"
	@echo "  make clean  - 清理构建产物"

build:
	@echo "🚀 开始本地构建..."
	@python -m src.pipelines.build_pipeline \
		--input project-name="my-project" \
		--input build-mode="release" \
		--input build-version="local-$$(date +%Y%m%d-%H%M%S)" \
		--input upload-artifacts="false"
	@echo "✅ 构建完成！"
	@echo "📦 产物位置: artifacts/"

test:
	@echo "🧪 运行测试..."
	@python -m src.pipelines.test_pipeline \
		--input test-type="all" \
		--input run-unit-tests="true"

clean:
	@echo "🧹 清理构建产物..."
	@rm -rf artifacts/ build/ dist/
	@echo "✅ 清理完成！"


