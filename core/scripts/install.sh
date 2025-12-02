#!/bin/bash
# GitHub Action Toolset 安装脚本
#
# 用途：将工具集安装到目标项目
# 使用：bash install.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo ""
}

# 获取脚本所在目录（工具集根目录）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd ../.. && pwd )"
print_info "工具集路径: $SCRIPT_DIR"

# 获取目标项目根目录（当前工作目录）
TARGET_DIR="$(pwd)"
print_info "目标项目路径: $TARGET_DIR"

# 检查是否在工具集目录本身
if [ "$SCRIPT_DIR" = "$TARGET_DIR" ]; then
    print_error "检测到您在工具集目录中运行安装脚本"
    print_info "请在目标项目根目录运行此脚本"
    print_info "示例: bash /path/to/toolset/core/scripts/install.sh"
    exit 1
fi

print_header "🚀 GitHub Action Toolset 安装"

# 1. 检查依赖
print_header "1. 检查依赖"

# 检查 gh
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -n 1)
    print_info "✅ GitHub CLI: $GH_VERSION"
    
    # 检查 gh 是否已登录
    if gh auth status &> /dev/null; then
        print_info "✅ GitHub CLI 已登录"
    else
        print_warn "⚠️  GitHub CLI 未登录"
        print_info "请运行: gh auth login"
    fi
else
    print_error "❌ 未检测到 GitHub CLI (gh)"
    echo ""
    print_info "GitHub CLI 是必需的，用于触发和监控工作流"
    echo ""
    print_info "安装方法:"
    print_info "  macOS:   brew install gh"
    print_info "  Windows: choco install gh"
    print_info "  Linux:   sudo apt install gh  # Debian/Ubuntu"
    echo ""
    print_info "详细信息: https://cli.github.com/"
    exit 1
fi

# 检查 Python（可选）
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_info "✅ $PYTHON_VERSION"
else
    print_warn "⚠️  未检测到 Python 3"
    print_info "Python 是可选的，但推荐安装以使用工具脚本"
fi

# 检查 Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_info "✅ $GIT_VERSION"
else
    print_error "❌ 未检测到 Git"
    exit 1
fi

# 2. 复制规则文件
print_header "2. 安装 AI 规则文件"

RULES_TARGET="$TARGET_DIR/.cursor/rules/github-actions"
mkdir -p "$RULES_TARGET"

if [ -d "$SCRIPT_DIR/core/rules" ]; then
    cp "$SCRIPT_DIR"/core/rules/*.mdc "$RULES_TARGET/" 2>/dev/null || true
    RULE_COUNT=$(ls "$RULES_TARGET"/*.mdc 2>/dev/null | wc -l)
    print_info "✅ 已复制 $RULE_COUNT 个规则文件到 .cursor/rules/github-actions/"
    ls "$RULES_TARGET"/*.mdc 2>/dev/null | xargs -n 1 basename
else
    print_error "❌ 未找到规则文件目录: $SCRIPT_DIR/core/rules"
    exit 1
fi

# 3. 安装 Go 工具（如果可用）
print_header "3. 安装 Go 调试工具"

SCRIPTS_TARGET="$TARGET_DIR/scripts/toolsets/github-actions"
mkdir -p "$SCRIPTS_TARGET"

GO_TOOL_DIR="$SCRIPT_DIR/core/tools/go"
if [ -d "$GO_TOOL_DIR" ]; then
    print_info "检测到 Go 工具，尝试安装..."
    
    # 检测系统
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case "$ARCH" in
        x86_64) ARCH="amd64" ;;
        aarch64|arm64) ARCH="arm64" ;;
    esac
    
    BINARY_NAME="gh-action-debug-${OS}-${ARCH}"
    if [ "$OS" = "windows" ]; then
        BINARY_NAME="${BINARY_NAME}.exe"
    fi
    
    BINARY_PATH="$GO_TOOL_DIR/dist/$BINARY_NAME"
    
    if [ -f "$BINARY_PATH" ]; then
        # 复制到 scripts/toolsets/github-actions/
        mkdir -p "$TARGET_DIR/scripts/toolsets/github-actions"
        cp "$BINARY_PATH" "$TARGET_DIR/scripts/toolsets/github-actions/gh-action-debug"
        chmod +x "$TARGET_DIR/scripts/toolsets/github-actions/gh-action-debug"
        print_info "✅ Go 工具已安装到 scripts/toolsets/github-actions/gh-action-debug"
        
        # 可选：安装到系统路径
        if command -v gh-action-debug &> /dev/null; then
            print_info "✅ gh-action-debug 已在系统 PATH 中"
        else
            print_warn "提示: 可以将 gh-action-debug 安装到系统路径:"
            print_info "  cd $GO_TOOL_DIR && bash install.sh"
        fi
    else
        print_warn "未找到预编译的 Go 工具二进制文件"
        print_info "可以手动构建:"
        print_info "  cd $GO_TOOL_DIR && bash build-all.sh"
    fi
else
    print_warn "未检测到 Go 工具目录"
fi

# 4. 复制模板文件
print_header "4. 安装 Workflow 模板"

TEMPLATES_TARGET="$TARGET_DIR/.github/templates"
mkdir -p "$TEMPLATES_TARGET"

if [ -d "$SCRIPT_DIR/core/templates" ]; then
    # 复制所有模板文件，保持目录结构
    cp -r "$SCRIPT_DIR"/core/templates/* "$TEMPLATES_TARGET/" 2>/dev/null || true
    
    TEMPLATE_COUNT=$(find "$TEMPLATES_TARGET" -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l)
    print_info "✅ 已复制 $TEMPLATE_COUNT 个模板文件到 .github/templates/"
    
    # 显示模板目录结构
    if command -v tree &> /dev/null; then
        tree "$TEMPLATES_TARGET" -L 2 -I "README.md"
    else
        find "$TEMPLATES_TARGET" -name "*.yml" -o -name "*.yaml" | head -n 5
    fi
else
    print_error "❌ 未找到模板目录: $SCRIPT_DIR/core/templates"
    exit 1
fi

# 5. 配置 npm scripts（如果项目使用 Node.js）
print_header "5. 配置 npm scripts"

if [ -f "$TARGET_DIR/package.json" ]; then
    print_info "检测到 package.json，配置 npm scripts..."
    
    # 检查是否已经有 ai-debug 脚本
    if grep -q '"ai-debug"' "$TARGET_DIR/package.json"; then
        print_warn "⚠️  ai-debug 脚本已存在，跳过"
    else
        print_info "提示: 请手动添加以下脚本到 package.json:"
        echo ""
        echo '  "scripts": {'
        echo '    "ai-debug": "./scripts/toolsets/github-actions/gh-action-debug workflow debug",'
        echo '    "test-workflow": "./scripts/toolsets/github-actions/gh-action-debug workflow list"'
        echo '  }'
        echo ""
    fi
else
    print_info "未检测到 package.json，跳过 npm scripts 配置"
fi

# 6. 安装完成
print_header "✅ 安装完成"

print_info "已安装以下内容:"
echo ""
echo "  📋 AI 规则文件:"
echo "     .cursor/rules/github-actions/"
echo "       ├── github-actions.mdc"
echo "       ├── debugging.mdc"
echo "       └── best-practices.mdc"
echo ""
echo "  🔧 调试工具:"
echo "     scripts/toolsets/github-actions/"
echo "       └── gh-action-debug        (Go 调试工具)"
echo ""
echo "  📦 Workflow 模板:"
echo "     .github/templates/"
echo "       ├── build/"
echo "       ├── test/"
echo "       ├── release/"
echo "       └── deployment/"
echo ""

print_header "📚 下一步"

echo "1. 验证安装:"
echo "   ls -la .cursor/rules/github-actions/"
echo "   ls -la scripts/toolsets/github-actions/"
echo "   ls -la .github/templates/"
echo ""

echo "2. 创建工作流（从模板）:"
echo "   cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml"
echo ""

echo "3. 调试工作流:"
if [ -f "$TARGET_DIR/scripts/toolsets/github-actions/gh-action-debug" ]; then
    echo "   ./scripts/toolsets/github-actions/gh-action-debug workflow debug .github/workflows/build.yml main"
elif command -v gh-action-debug &> /dev/null; then
    echo "   gh-action-debug workflow debug .github/workflows/build.yml main"
else
    echo "   # 请先安装 Go 工具或使用系统安装的版本"
fi
echo ""

echo "4. 查看文档:"
echo "   cat $SCRIPT_DIR/docs/USAGE.md"
echo ""

print_info "🎉 现在 AI 助手会自动遵循 GitHub Actions 最佳实践！"
echo ""

