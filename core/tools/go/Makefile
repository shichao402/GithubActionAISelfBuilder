.PHONY: build install test clean run help

# 变量
BINARY_NAME=gh-action-debug
VERSION?=1.0.0
BUILD_DIR=dist
CMD_DIR=./cmd/gh-action-debug

# Go 构建参数
LDFLAGS=-ldflags "-X main.Version=$(VERSION)"

# 默认目标
.DEFAULT_GOAL := help

## build: 构建当前平台的二进制文件
build:
	@echo "🔨 构建 $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) $(CMD_DIR)
	@echo "✅ 构建完成: $(BUILD_DIR)/$(BINARY_NAME)"

## build-all: 构建所有平台的二进制文件
build-all:
	@echo "🔨 构建所有平台..."
	@mkdir -p $(BUILD_DIR)
	
	@echo "  📦 Linux AMD64..."
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 $(CMD_DIR)
	
	@echo "  📦 Linux ARM64..."
	GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-arm64 $(CMD_DIR)
	
	@echo "  📦 macOS AMD64..."
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 $(CMD_DIR)
	
	@echo "  📦 macOS ARM64 (M1/M2)..."
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 $(CMD_DIR)
	
	@echo "  📦 Windows AMD64..."
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe $(CMD_DIR)
	
	@echo "✅ 所有平台构建完成！"
	@ls -lh $(BUILD_DIR)

## install: 安装到本地
install:
	@echo "📦 安装 $(BINARY_NAME)..."
	go install $(LDFLAGS) $(CMD_DIR)
	@echo "✅ 安装完成: $(shell go env GOPATH)/bin/$(BINARY_NAME)"

## test: 运行所有测试
test:
	@echo "🧪 运行测试..."
	go test -v ./...

## test-coverage: 运行测试并生成覆盖率报告
test-coverage:
	@echo "🧪 运行测试（含覆盖率）..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "✅ 覆盖率报告: coverage.html"

## run: 运行程序（开发模式）
run:
	@echo "🚀 运行 $(BINARY_NAME)..."
	go run $(CMD_DIR) $(ARGS)

## clean: 清理构建产物
clean:
	@echo "🧹 清理..."
	rm -rf $(BUILD_DIR)
	rm -f coverage.out coverage.html
	@echo "✅ 清理完成"

## fmt: 格式化代码
fmt:
	@echo "✨ 格式化代码..."
	go fmt ./...
	@echo "✅ 格式化完成"

## lint: 代码检查
lint:
	@echo "🔍 代码检查..."
	golangci-lint run ./...

## deps: 下载依赖
deps:
	@echo "📥 下载依赖..."
	go mod download
	go mod tidy
	@echo "✅ 依赖下载完成"

## help: 显示帮助信息
help:
	@echo "可用的 make 命令:"
	@echo ""
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'

# 快捷方式
b: build
ba: build-all
i: install
t: test
r: run
c: clean


