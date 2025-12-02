# 端到端测试计划

## 🎯 测试目标

验证整个工具集可以正常安装和使用。

## 📋 测试步骤

### 步骤 1: 准备测试环境

```bash
# 创建临时测试目录
mkdir -p /tmp/test-gh-toolset
cd /tmp/test-gh-toolset

# 初始化 git 仓库
git init
git remote add origin https://github.com/your-username/test-repo.git

# 创建基本的项目文件
cat > package.json << EOF
{
  "name": "test-project",
  "version": "1.0.0",
  "scripts": {}
}
EOF
```

### 步骤 2: 安装工具集

```bash
# 运行安装脚本
bash /path/to/github-action-toolset/core/scripts/install.sh
```

**预期结果**：
```
✅ 已复制 3 个规则文件到 .cursor/rules/github-actions/
✅ 已复制 3-4 个工具脚本到 scripts/toolsets/github-actions/
✅ Go 工具已安装到 scripts/toolsets/github-actions/gh-action-debug
✅ 已复制 5 个模板文件到 .github/templates/
```

### 步骤 3: 验证规则文件

```bash
# 检查规则文件
ls -la .cursor/rules/github-actions/

# 预期：
# github-actions.mdc
# debugging.mdc
# best-practices.mdc
```

### 步骤 4: 验证工具脚本

```bash
# 检查工具脚本
ls -la scripts/toolsets/github-actions/

# 预期：
# gh-action-debug (Go 工具)
# ai_debug_workflow.py
# test_pipelines.py
# run_pipeline.py
```

### 步骤 5: 验证 Go 工具

```bash
# 测试 Go 工具
./scripts/toolsets/github-actions/gh-action-debug version

# 预期：
# gh-action-debug version 1.0.0

# 测试 list 命令
./scripts/toolsets/github-actions/gh-action-debug workflow list

# 预期：
# 📋 列出所有工作流...
# （如果仓库有 workflows）
```

### 步骤 6: 验证模板

```bash
# 检查模板
ls -la .github/templates/

# 预期：
# build/
# test/
# release/
# deployment/

# 查看 Node.js 构建模板
cat .github/templates/build/nodejs-build.yml | head -n 20
```

### 步骤 7: 创建工作流

```bash
# 从模板创建工作流
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml

# 检查创建的工作流
ls -la .github/workflows/
```

### 步骤 8: 测试调试工具（如果连接到真实仓库）

```bash
# 确保已登录 GitHub CLI
gh auth status

# 推送代码（如果连接到真实仓库）
git add .
git commit -m "Add workflow"
git push origin main

# 使用 Go 工具调试
./scripts/toolsets/github-actions/gh-action-debug workflow debug .github/workflows/build.yml main --verbose

# 预期：
# ✅ 配置加载成功
# 🚀 触发工作流...
# ⏳ 监控工作流执行状态...
# ✅ 工作流执行成功！（或失败并显示详细错误）
```

### 步骤 9: 清理

```bash
# 清理测试目录
cd /
rm -rf /tmp/test-gh-toolset
```

## ✅ 验证检查清单

- [ ] 规则文件已复制到正确位置
- [ ] Go 工具可执行且显示版本
- [ ] Python 脚本已复制
- [ ] 模板文件已复制
- [ ] Go 工具可以列出工作流
- [ ] 可以从模板创建工作流
- [ ] Go 工具可以触发工作流
- [ ] （可选）Go 工具可以完整调试工作流

## 🔍 测试 Go 工具核心功能

### 前置要求

- 在一个真实的 GitHub 仓库中
- 已登录 GitHub CLI
- 仓库中有至少一个 workflow 文件

### 测试命令

```bash
# 1. 测试 list
gh-action-debug workflow list

# 2. 测试 trigger
gh-action-debug workflow trigger .github/workflows/build.yml main

# 3. 测试 debug（完整流程）
gh-action-debug workflow debug .github/workflows/build.yml main --verbose

# 4. 测试 JSON 输出
gh-action-debug workflow debug .github/workflows/build.yml main --output json

# 5. 测试带参数
gh-action-debug workflow debug .github/workflows/release.yml main --input version=1.0.0
```

### 预期输出格式

#### Human 输出
```
==============================================
  GitHub Actions 调试结果
==============================================

🆔 Run ID: 123456789
🔗 URL: https://github.com/...
⏱️  Duration: 45s

✅ 状态: 成功

📋 任务状态:
  ✅ build (45s)

==============================================
```

#### JSON 输出
```json
{
  "success": true,
  "run_id": 123456789,
  "run_url": "https://github.com/...",
  "status": "success",
  "duration": 45,
  "jobs": [...],
  "errors": [],
  "suggestions": []
}
```

## 📊 性能测试

```bash
# 测试启动速度
time gh-action-debug version
# 预期: < 0.1s

time gh-action-debug workflow list
# 预期: < 1s

# 测试完整调试流程
time gh-action-debug workflow debug .github/workflows/build.yml main
# 预期: 取决于 workflow 执行时间，通常 1-5 分钟
```

## 🐛 已知问题

1. **首次构建**
   - 如果工具集没有预编译的 Go 二进制文件，需要手动构建
   - 解决：提供预编译版本或在安装脚本中自动构建

2. **仓库检测**
   - 如果不在 git 仓库中运行，无法自动检测 owner/repo
   - 解决：通过环境变量或配置文件指定

3. **网络问题**
   - 首次下载 Go 依赖可能较慢
   - 解决：提供预编译版本

## ✅ 通过标准

测试通过的标准：

1. ✅ 所有文件正确复制到目标位置
2. ✅ Go 工具可执行且显示正确版本
3. ✅ `workflow list` 命令正常工作
4. ✅ `workflow trigger` 命令可以触发工作流
5. ✅ `workflow debug` 命令可以完成完整流程
6. ✅ JSON 输出格式正确
7. ✅ 错误分析和建议功能正常

## 🎯 下一步

测试通过后：
1. 记录测试结果
2. 更新文档
3. 准备发布
4. 创建 Release Notes

