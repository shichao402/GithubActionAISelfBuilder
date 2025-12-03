# 快速开始指南

这个指南将帮助你在 5 分钟内开始使用 GitHub Action AI 工具集。

## 📋 前置要求

- Git 已安装
- GitHub CLI (gh) 已安装并登录
- Go 1.18+ 已安装（用于构建 gh-action-debug 工具）
- 一个 GitHub 项目（本地或远程）

如果还没有安装：

```bash
# GitHub CLI
# macOS
brew install gh

# Windows
choco install gh

# Linux
sudo apt install gh

# 登录
gh auth login

# Go
# macOS
brew install go

# Windows
choco install golang

# Linux
sudo apt install golang
```

## 🚀 第一步：安装工具集

在你的项目根目录运行：

```bash
bash /path/to/GithubActionAISelfBuilder/core/scripts/install.sh
```

你会看到：
```
✅ 已复制 3 个规则文件到 core/rules/
✅ Go 工具已安装到 scripts/toolsets/github-actions/gh-action-debug
✅ 已复制模板文件到 core/templates/
```

## 🎯 第二步：创建你的第一个工作流

### 场景 1：Flutter 项目

```bash
# 1. 复制模板
cp core/templates/build/flutter-build.yml .github/workflows/build.yml

# 2. 根据需要自定义（可选）
vim .github/workflows/build.yml

# 3. 复制本地构建脚本
cp /path/to/GithubActionAISelfBuilder/scripts/flutter-build.sh scripts/

# 4. 本地测试
bash scripts/flutter-build.sh --platform android --mode release
```

### 场景 2：Node.js 项目

```bash
# 1. 复制模板
cp core/templates/build/nodejs-build.yml .github/workflows/build.yml

# 2. 自定义配置
vim .github/workflows/build.yml
# 修改 Node.js 版本、测试命令等
```

## 🔧 第三步：推送并测试

### 提交代码

```bash
git add .github/workflows/ scripts/
git commit -m "Add build workflow and scripts"
git push
```

### 使用 gh-action-debug 测试

```bash
# 完整的自动调试（推荐）
gh-action-debug workflow debug .github/workflows/build.yml main --output json

# 对于 Flutter 工作流（需要提供 platform 参数）
gh-action-debug workflow debug .github/workflows/build.yml main \
  --input platform=android \
  --output json
```

### 查看结果

工具会自动：
1. ✅ 触发工作流
2. ✅ 监控执行状态
3. ✅ 如果失败，收集详细日志
4. ✅ 分析错误（12+ 种错误模式）
5. ✅ 提供修复建议

示例输出（JSON 格式）：

```json
{
  "workflow": ".github/workflows/build.yml",
  "run_id": "123456789",
  "status": "completed",
  "conclusion": "success",
  "duration": "2m 30s",
  "jobs": [...]
}
```

## 💡 第四步：让 AI 帮你

现在你可以直接告诉 AI：

### 创建新工作流

```
"帮我创建一个 Flutter 构建工作流，支持 Android 和 iOS"
```

AI 会：
1. 复制 flutter-build.yml 模板
2. 根据项目调整配置
3. 推送并测试
4. 使用 gh-action-debug 调试
5. 报告结果

### 调试失败的工作流

```
"调试失败的 build.yml 工作流"
```

AI 会：
1. 运行 gh-action-debug
2. 收集失败日志
3. 分析错误原因（自动匹配错误模式）
4. 提供修复建议
5. 应用修复
6. 重新测试

### 优化构建速度

```
"优化 build.yml 的构建速度"
```

AI 会：
1. 添加缓存策略
2. 优化依赖安装
3. 减少不必要的步骤
4. 测试优化效果

## 📚 常用命令速查

### gh-action-debug 工具

```bash
# 完整调试（触发 + 监控 + 分析）
gh-action-debug workflow debug <workflow-file> <ref> --output json

# 列出所有工作流
gh-action-debug workflow list

# 手动触发工作流
gh-action-debug workflow trigger <workflow-file> <ref>

# 带输入参数触发
gh-action-debug workflow trigger <workflow-file> <ref> \
  --input key1=value1 \
  --input key2=value2

# 查看版本
gh-action-debug version

# 详细输出（调试模式）
gh-action-debug workflow debug <workflow-file> <ref> --verbose
```

### 本地构建

```bash
# Flutter 构建
bash scripts/flutter-build.sh --platform <platform> --mode <mode>

# 查看帮助
bash scripts/flutter-build.sh --help
```

### 查看模板

```bash
# 列出所有模板
find core/templates -name "*.yml"

# 查看模板内容
cat core/templates/build/flutter-build.yml
```

## 🎨 完整示例：Flutter 项目

```bash
# 1. 安装工具集
cd /path/to/your-flutter-project
bash /path/to/GithubActionAISelfBuilder/core/scripts/install.sh

# 2. 复制文件
cp /path/to/GithubActionAISelfBuilder/core/templates/build/flutter-build.yml \
   .github/workflows/build.yml
cp /path/to/GithubActionAISelfBuilder/scripts/flutter-build.sh \
   scripts/

# 3. 本地测试
bash scripts/flutter-build.sh --platform android --mode release

# 4. 推送代码
git add .github/workflows/build.yml scripts/flutter-build.sh
git commit -m "Add Flutter build workflow"
git push

# 5. 测试 CI
gh-action-debug workflow debug .github/workflows/build.yml main \
  --input platform=android \
  --output json
```

## ❓ 遇到问题？

### 问题 1：GitHub CLI 未登录

```bash
gh auth login
gh auth status  # 验证
```

### 问题 2：gh-action-debug 未找到

```bash
# 重新安装
bash /path/to/GithubActionAISelfBuilder/core/scripts/install.sh

# 或手动构建
cd /path/to/GithubActionAISelfBuilder/core/tools/go
make build
cp dist/gh-action-debug ~/bin/
```

### 问题 3：工作流失败

```bash
# 使用详细模式查看完整错误
gh-action-debug workflow debug .github/workflows/build.yml main --verbose

# 查看 GitHub Actions 页面
gh run list
gh run view <run-id> --log-failed
```

### 问题 4：本地构建失败

```bash
# 检查脚本语法
bash -n scripts/flutter-build.sh

# 查看帮助
bash scripts/flutter-build.sh --help
```

## 🎓 下一步

- [完整使用指南](../USAGE.md) - 查看所有功能
- [AI 自我调试指南](ai-self-debug.md) - 深入了解调试流程

## 💬 获取帮助

- 查看 [文档目录](../README.md)
- 检查工具日志输出
- 查看 GitHub Actions 页面

---

**恭喜！** 🎉 你已经掌握了 GitHub Action AI 工具集的基本用法。

现在可以让 AI 帮你处理所有 GitHub Actions 相关的工作了！
