# 使用指南

## 快速开始

安装工具集后，AI 助手会自动了解如何处理 GitHub Actions。你可以：

### 1. 使用模板创建工作流

```bash
# 复制 Node.js 构建模板
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml

# 根据项目需求自定义
vim .github/workflows/build.yml
```

### 2. 调试工作流

```bash
# 触发并监控工作流
npm run ai-debug -- .github/workflows/build.yml main

# 带参数触发
npm run ai-debug -- .github/workflows/release.yml main -f version=1.0.0
```

### 3. 批量测试

```bash
# 测试所有工作流
npm run test-pipeline -- --all --trigger --watch

# 测试指定工作流
npm run test-pipeline -- --workflow build.yml --trigger
```

## 核心功能

### AI 规则文件

工具集包含三个 AI 规则文件，教导 AI 助手如何处理 GitHub Actions：

1. **github-actions.mdc** - 基础规则
   - 工作流文件管理
   - 命名规范
   - 最佳实践
   - 常用 Actions

2. **debugging.mdc** - 调试规则
   - 标准调试流程
   - 工具使用
   - 常见问题

3. **best-practices.mdc** - 最佳实践
   - 性能优化
   - 安全实践
   - 本地一致性

**位置**: `.cursor/rules/github-actions/`

**作用**: AI 助手会自动遵循这些规则，无需手动提醒

### 工具脚本

#### ai_debug_workflow.py

一键调试 GitHub Actions 工作流。

**使用方式**：

```bash
# 基本用法
npm run ai-debug -- <workflow-file> [ref]

# 示例
npm run ai-debug -- .github/workflows/build.yml main
npm run ai-debug -- .github/workflows/release.yml v1.0.0

# 带参数
npm run ai-debug -- .github/workflows/deploy.yml main \
  -f environment=production \
  -f version=1.0.0
```

**功能**：
- 自动触发工作流
- 实时监控状态
- 收集失败日志
- 分析错误原因
- 提供修复建议

#### test_pipelines.py

批量测试多个工作流。

**使用方式**：

```bash
# 测试所有工作流
npm run test-pipeline -- --all --trigger --watch

# 测试指定工作流
npm run test-pipeline -- --workflow build.yml --trigger

# 仅验证 YAML 语法
npm run test-pipeline -- --all --verify
```

**功能**：
- YAML 语法验证
- 批量触发工作流
- 监控执行状态
- 生成测试报告

### 模板库

工具集提供常用的工作流模板：

#### 构建模板

- `build/nodejs-build.yml` - Node.js 项目构建
- `build/python-build.yml` - Python 项目构建

#### 测试模板

- `test/pytest.yml` - Python 测试

#### 发布模板

- `release/github-release.yml` - GitHub Release 发布

#### 部署模板

- `deployment/deploy-npm.yml` - npm 包发布

**位置**: `.github/templates/`

**使用方式**：

```bash
# 1. 复制模板
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml

# 2. 根据需求自定义
vim .github/workflows/build.yml

# 3. 提交并推送
git add .github/workflows/build.yml
git commit -m "Add build workflow"
git push

# 4. 测试工作流
npm run ai-debug -- .github/workflows/build.yml main
```

## 常见任务

### 创建构建工作流

```bash
# 1. 选择合适的模板
ls .github/templates/build/

# 2. 复制模板
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml

# 3. 自定义配置
# 修改 Node.js 版本、测试命令等

# 4. 推送并测试
git add .github/workflows/build.yml
git commit -m "Add build workflow"
git push
npm run ai-debug -- .github/workflows/build.yml main
```

### 调试失败的工作流

```bash
# 1. 使用调试脚本
npm run ai-debug -- .github/workflows/build.yml main

# 2. 查看详细日志和错误分析

# 3. 根据建议修复代码

# 4. 推送并重新测试
git add .
git commit -m "Fix workflow issues"
git push
npm run ai-debug -- .github/workflows/build.yml main
```

### 发布新版本

```bash
# 1. 确保有发布工作流
cp .github/templates/release/github-release.yml .github/workflows/release.yml

# 2. 推送代码
git add .
git commit -m "Prepare for release"
git push

# 3. 创建标签
git tag v1.0.0
git push origin v1.0.0

# 4. 工作流会自动触发并创建 Release
```

## AI 助手集成

### 告诉 AI 使用工具集

安装后，AI 助手会自动了解规则。你可以简单地说：

```
"帮我创建一个 Node.js 构建工作流"
"调试失败的 build.yml 工作流"
"优化构建速度"
```

AI 会自动：
1. 使用合适的模板
2. 遵循最佳实践
3. 使用调试工具
4. 提供修复建议

### AI 会做什么

**遵循规则**：
- ✅ 使用模板而不是从头编写
- ✅ 使用调试脚本而不是手动命令
- ✅ 先推送代码再测试在线工作流
- ✅ 验证修改并提供反馈

**不会做**：
- ❌ 手动运行 `gh workflow run` 命令
- ❌ 不推送代码就触发测试
- ❌ 猜测错误原因而不查看日志
- ❌ 创建过度复杂的工作流

## 最佳实践

### 1. 从模板开始

```bash
# ✅ 推荐：使用模板
cp .github/templates/build/nodejs-build.yml .github/workflows/build.yml

# ❌ 避免：从头编写
vim .github/workflows/build.yml  # 从空白开始
```

### 2. 先本地后 CI

```bash
# 1. 确保本地能构建
npm run build
npm test

# 2. 创建构建脚本
echo '#!/bin/bash
npm ci
npm run build
npm test' > scripts/build.sh
chmod +x scripts/build.sh

# 3. 工作流使用相同的脚本
# 在 .github/workflows/build.yml 中:
# - run: bash scripts/build.sh
```

### 3. 使用调试工具

```bash
# ✅ 推荐：使用工具
npm run ai-debug -- .github/workflows/build.yml main

# ❌ 避免：手动操作
gh workflow run build.yml
sleep 10
gh run list
gh run view --log-failed
```

### 4. 增量优化

```bash
# 1. 先让工作流跑通
# 2. 然后添加缓存
# 3. 然后添加矩阵测试
# 4. 然后优化并行

# 不要一次性添加所有功能
```

## 进阶用法

### 自定义规则

如果需要项目特定的规则：

```bash
# 创建项目特定的规则文件
vim .cursor/rules/project-github-actions.mdc
```

### 自定义模板

```bash
# 创建项目特定的模板
mkdir -p .github/templates/custom
vim .github/templates/custom/my-workflow.yml
```

### 集成其他工具

工具集可以与其他工具结合使用：

- Dependabot
- CodeQL
- SonarQube
- Codecov

## 故障排除

### 工作流失败

```bash
# 1. 使用调试工具
npm run ai-debug -- .github/workflows/build.yml main

# 2. 查看详细日志
# 脚本会自动收集并显示

# 3. 根据建议修复

# 4. 重新测试
```

### 调试脚本失败

```bash
# 检查依赖
gh --version
python --version

# 检查权限
gh auth status

# 手动运行
python scripts/toolsets/github-actions/ai_debug_workflow.py --help
```

## 参考

- [安装指南](INSTALL.md)
- [快速开始](guides/quickstart.md)
- [示例](examples/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

