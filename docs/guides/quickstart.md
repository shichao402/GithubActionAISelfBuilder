# 快速开始指南

这个指南将帮助你在 5 分钟内开始使用 GitHub Action Toolset。

## 📋 前置要求

- Git 已安装
- GitHub CLI (gh) 已安装并登录
- 一个 GitHub 项目（本地或远程）

如果还没有安装 GitHub CLI：

```bash
# macOS
brew install gh

# Windows
choco install gh

# Linux
sudo apt install gh

# 登录
gh auth login
```

## 🚀 第一步：安装工具集

在你的项目根目录运行：

```bash
curl -sL https://raw.githubusercontent.com/firoyang/github-action-toolset/main/core/scripts/install.sh | bash
```

你会看到：
```
✅ 已复制 3 个规则文件到 .cursor/rules/github-actions/
✅ 已复制 3 个工具脚本到 scripts/toolsets/github-actions/
✅ 已复制 5 个模板文件到 .github/templates/
```

## 🎯 第二步：创建你的第一个工作流

### 选择模板

查看可用的模板：

```bash
ls .github/templates/
# build/  test/  release/  deployment/
```

### 复制模板

假设你的项目是 Node.js 项目：

```bash
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml
```

### 自定义配置

打开 `.github/workflows/build.yml`，根据需要修改：

```yaml
# 修改 Node.js 版本
env:
  NODE_VERSION: '20'  # 改为你需要的版本

# 修改测试矩阵
strategy:
  matrix:
    os: [ubuntu-latest]  # 只在 Linux 测试
    node: [20]           # 只测试一个版本
```

## 🔧 第三步：推送并测试

### 提交代码

```bash
git add .github/workflows/build.yml
git commit -m "Add build workflow"
git push
```

### 触发测试

如果项目有 `package.json`：

```bash
npm run ai-debug -- .github/workflows/build.yml main
```

否则：

```bash
python scripts/toolsets/github-actions/ai_debug_workflow.py .github/workflows/build.yml main
```

### 查看结果

脚本会自动：
1. 触发工作流
2. 监控执行状态
3. 如果失败，收集详细日志
4. 分析错误并提供修复建议

示例输出：

```
🚀 触发工作流: .github/workflows/build.yml
✅ 工作流已触发，运行 ID: 123456789

⏳ 监控工作流执行状态...
  状态: in_progress
  任务 build: in_progress

✅ 工作流执行成功！
```

## 💡 第四步：让 AI 帮你

现在你可以直接告诉 AI：

### 创建新工作流

```
"帮我创建一个 Python 测试工作流"
```

AI 会：
1. 复制 `pytest.yml` 模板
2. 根据项目调整配置
3. 推送并测试
4. 报告结果

### 调试失败的工作流

```
"调试失败的 build.yml 工作流"
```

AI 会：
1. 运行调试脚本
2. 收集失败日志
3. 分析错误原因
4. 提供修复建议
5. 应用修复
6. 重新测试

### 优化构建速度

```
"优化 build.yml 的构建速度"
```

AI 会：
1. 添加缓存
2. 优化依赖安装
3. 减少不必要的步骤
4. 测试优化效果

## 📚 常用命令速查

### 查看模板

```bash
# 列出所有模板
find .github/templates -name "*.yml"

# 查看模板内容
cat .github/templates/build/nodejs-build.yml
```

### 使用调试工具

```bash
# 基本用法
npm run ai-debug -- <workflow-file> [ref]

# 带参数
npm run ai-debug -- .github/workflows/release.yml main -f version=1.0.0

# 不使用 npm
python scripts/toolsets/github-actions/ai_debug_workflow.py .github/workflows/build.yml main
```

### 批量测试

```bash
# 测试所有工作流
npm run test-pipeline -- --all --trigger --watch

# 测试指定工作流
npm run test-pipeline -- --workflow build.yml --trigger
```

## 🎨 常见场景

### 场景 1：Node.js 项目

```bash
# 1. 复制模板
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml

# 2. 修改配置
vim .github/workflows/build.yml

# 3. 推送并测试
git add .github/workflows/build.yml
git commit -m "Add build workflow"
git push
npm run ai-debug -- .github/workflows/build.yml main
```

### 场景 2：Python 项目

```bash
# 1. 复制模板
cp .github/templates/build/python-build.yml .github/workflows/build.yml
cp .github/templates/test/pytest.yml .github/workflows/test.yml

# 2. 推送并测试
git add .github/workflows/
git commit -m "Add workflows"
git push
npm run test-pipeline -- --all --trigger
```

### 场景 3：发布新版本

```bash
# 1. 添加 release 工作流
cp .github/templates/release/github-release.yml .github/workflows/release.yml
git add .github/workflows/release.yml
git commit -m "Add release workflow"
git push

# 2. 创建标签触发发布
git tag v1.0.0
git push origin v1.0.0

# 3. 工作流会自动创建 Release
```

## ❓ 遇到问题？

### 问题 1：GitHub CLI 未登录

```bash
gh auth login
```

### 问题 2：工作流失败

```bash
# 使用调试工具查看详细日志
npm run ai-debug -- .github/workflows/build.yml main
```

### 问题 3：找不到模板

```bash
# 重新运行安装脚本
bash /path/to/toolset/core/scripts/install.sh
```

## 🎓 下一步

- [完整使用指南](../USAGE.md) - 查看所有功能
- [模板参考](../reference/templates.md) - 了解所有模板
- [最佳实践](best-practices.md) - 学习最佳实践

## 💬 获取帮助

- 查看 [文档目录](../README.md)
- 提交 [Issue](https://github.com/firoyang/github-action-toolset/issues)
- 参与 [讨论](https://github.com/firoyang/github-action-toolset/discussions)

---

**恭喜！** 🎉 你已经掌握了 GitHub Action Toolset 的基本用法。

现在可以让 AI 帮你处理所有 GitHub Actions 相关的工作了！


