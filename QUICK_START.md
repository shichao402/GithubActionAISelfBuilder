# 快速开始

## 🚀 5 分钟快速体验

### 1. 构建 Go 工具（1 分钟）

```bash
cd core/tools/go
bash build-verify.sh
```

**输出**：
```
🔨 开始构建 Go 工具...
📥 下载依赖...
🏗️  构建...
✅ 验证构建...
✅ 二进制文件已创建: dist/gh-action-debug
```

### 2. 测试基本命令（1 分钟）

```bash
# 测试 version
./dist/gh-action-debug version

# 测试 help
./dist/gh-action-debug --help

# 测试 list（需要在 git 仓库中）
./dist/gh-action-debug workflow list
```

### 3. 安装到测试项目（2 分钟）

```bash
# 创建测试目录
mkdir -p /tmp/test-project
cd /tmp/test-project

# 初始化 git
git init
git remote add origin https://github.com/your-username/your-repo.git

# 运行安装脚本
bash /path/to/github-action-toolset/core/scripts/install.sh

# 验证安装
ls .cursor/rules/github-actions/
ls scripts/toolsets/github-actions/
ls .github/templates/
```

### 4. 创建工作流（1 分钟）

```bash
# 从模板创建工作流
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml

# 查看创建的工作流
cat .github/workflows/build.yml | head -n 30
```

### 5. 使用调试工具（可选，如果连接到真实仓库）

```bash
# 推送代码
git add .
git commit -m "Add build workflow"
git push origin main

# 调试工作流
./scripts/toolsets/github-actions/gh-action-debug workflow debug .github/workflows/build.yml main --verbose
```

## ✅ 完成！

你已经体验了工具集的核心功能：

1. ✅ 构建了 Go 调试工具
2. ✅ 安装了规则和模板
3. ✅ 创建了工作流
4. ✅ （可选）测试了自动调试

## 📚 下一步

- [完整使用指南](docs/USAGE.md)
- [安装说明](docs/INSTALL.md)
- [Go 工具文档](core/tools/go/README.md)

## 🎯 关键命令速查

```bash
# 构建 Go 工具
cd core/tools/go && bash build-verify.sh

# 安装工具集
bash core/scripts/install.sh

# 调试工作流（核心功能）
gh-action-debug workflow debug .github/workflows/build.yml main --output json

# 从模板创建工作流
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml
```

---

**享受自动化调试的便利！** 🎉


