# 使用指南

## 快速开始

安装工具集后，AI 助手会自动了解如何处理 GitHub Actions。

### 1. 使用模板创建工作流

```bash
# 复制 Flutter 构建模板
cp core/templates/build/flutter-build.yml .github/workflows/build.yml

# 根据项目需求自定义
vim .github/workflows/build.yml
```

### 2. 使用 Go 工具调试工作流

```bash
# 触发并自动调试工作流（JSON 输出）
gh-action-debug workflow debug .github/workflows/build.yml main --output json

# 带参数触发
gh-action-debug workflow debug .github/workflows/build.yml main \
  --input platform=android \
  --output json

# 详细输出模式
gh-action-debug workflow debug .github/workflows/build.yml main --verbose
```

### 3. 本地构建

```bash
# Flutter 项目本地构建
bash scripts/flutter-build.sh --platform android --mode release
```

## 核心功能

### AI 规则文件

工具集包含三个 AI 规则文件，教导 AI 助手如何处理 GitHub Actions：

1. **github-actions.mdc** - 基础规则
   - 工作流文件管理
   - 命名规范
   - 最佳实践

2. **debugging.mdc** - 调试规则
   - 标准调试流程
   - gh-action-debug 工具使用
   - 常见问题

3. **best-practices.mdc** - 最佳实践
   - 性能优化
   - 本地一致性
   - 简洁原则

**位置**: `core/rules/`

**作用**: AI 助手会自动遵循这些规则，无需手动提醒

### Go 调试工具 (gh-action-debug)

一键调试 GitHub Actions 工作流的 Go 工具。

**功能**：
- 自动触发工作流
- 实时监控状态
- 收集失败日志
- 智能错误分析（12+ 种常见错误模式）
- 提供修复建议
- JSON/Human 双输出格式

**使用方式**：

```bash
# 完整的自动调试（推荐）
gh-action-debug workflow debug .github/workflows/build.yml main --output json

# 列出可用工作流
gh-action-debug workflow list

# 手动触发工作流
gh-action-debug workflow trigger .github/workflows/build.yml main

# 查看版本
gh-action-debug version
```

**安装位置**：
- 安装后：`scripts/toolsets/github-actions/gh-action-debug`
- 或添加到系统 PATH

### 本地构建脚本

#### Flutter 构建脚本

**位置**: `scripts/flutter-build.sh`

**使用方式**：

```bash
# 构建 Android 应用
bash scripts/flutter-build.sh --platform android --mode release

# 构建 iOS 应用
bash scripts/flutter-build.sh --platform ios --mode debug

# 查看帮助
bash scripts/flutter-build.sh --help
```

**功能**：
- 获取依赖
- 代码分析
- 运行测试
- 平台构建
- 错误处理

### 模板库

工具集提供常用的工作流模板：

#### 构建模板

- `build/flutter-build.yml` - Flutter 多平台构建
- `build/nodejs-build.yml` - Node.js 项目构建
- `build/python-build.yml` - Python 项目构建

#### 测试模板

- `test/pytest.yml` - Python 测试

#### 发布模板

- `release/github-release.yml` - GitHub Release 发布

#### 部署模板

- `deployment/deploy-npm.yml` - npm 包发布

**位置**: `core/templates/`

**使用方式**：

```bash
# 1. 复制模板到项目
cp core/templates/build/flutter-build.yml .github/workflows/build.yml

# 2. 根据需求自定义
vim .github/workflows/build.yml

# 3. 提交并推送
git add .github/workflows/build.yml
git commit -m "Add build workflow"
git push

# 4. 测试工作流
gh-action-debug workflow debug .github/workflows/build.yml main --output json
```

## 常见任务

### 创建 Flutter 构建工作流

```bash
# 1. 复制模板
cp core/templates/build/flutter-build.yml .github/workflows/build.yml

# 2. 推送并测试
git add .github/workflows/build.yml
git commit -m "Add Flutter build workflow"
git push
gh-action-debug workflow debug .github/workflows/build.yml main \
  --input platform=android \
  --output json
```

### 调试失败的工作流

```bash
# 1. 使用调试工具（会自动分析错误）
gh-action-debug workflow debug .github/workflows/build.yml main --output json

# 2. 查看详细日志和错误分析（JSON 输出包含所有信息）

# 3. 根据建议修复代码

# 4. 推送并重新测试
git add .
git commit -m "Fix workflow issues"
git push
gh-action-debug workflow debug .github/workflows/build.yml main --output json
```

### 本地测试构建

```bash
# 1. 运行本地构建脚本（与 CI 保持一致）
bash scripts/flutter-build.sh --platform android --mode release

# 2. 确保本地通过后再推送
git add .
git commit -m "Update build"
git push

# 3. 测试 CI 构建
gh-action-debug workflow debug .github/workflows/build.yml main --output json
```

## AI 助手集成

### 告诉 AI 使用工具集

安装后，AI 助手会自动了解规则。你可以简单地说：

```
"帮我创建一个 Flutter 构建工作流"
"调试失败的 build.yml 工作流"
"优化构建速度"
```

AI 会自动：
1. 使用合适的模板
2. 遵循最佳实践
3. 使用 gh-action-debug 工具调试
4. 提供修复建议

### AI 会做什么

**遵循规则**：
- ✅ 使用模板而不是从头编写
- ✅ 使用 gh-action-debug 而不是手动命令
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
cp core/templates/build/flutter-build.yml .github/workflows/build.yml

# ❌ 避免：从头编写
vim .github/workflows/build.yml  # 从空白开始
```

### 2. 本地和 CI 保持一致

```bash
# 1. 创建本地构建脚本
vim scripts/build.sh

# 2. 确保本地能构建
bash scripts/build.sh

# 3. 工作流使用相同的脚本
# 在 .github/workflows/build.yml 中:
# - run: bash scripts/build.sh
```

### 3. 使用 gh-action-debug 工具

```bash
# ✅ 推荐：使用工具（一键完成所有步骤）
gh-action-debug workflow debug .github/workflows/build.yml main --output json

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
# 3. 然后优化并行
# 4. 然后添加矩阵测试

# 不要一次性添加所有功能
```

## 故障排除

### gh-action-debug 工具未找到

```bash
# 方案 1: 重新安装
bash core/scripts/install.sh

# 方案 2: 手动构建
cd core/tools/go
make build
cp dist/gh-action-debug ~/bin/  # 或添加到 PATH
```

### 工作流触发失败

```bash
# 检查 gh CLI 认证
gh auth status

# 检查工作流文件语法
gh workflow view .github/workflows/build.yml

# 使用详细模式查看错误
gh-action-debug workflow debug .github/workflows/build.yml main --verbose
```

### 本地构建失败

```bash
# 检查脚本语法
bash -n scripts/flutter-build.sh

# 查看帮助
bash scripts/flutter-build.sh --help

# 使用详细模式
bash scripts/flutter-build.sh --platform android --verbose
```

## 参考

- [安装指南](INSTALL.md)
- [快速开始](guides/quickstart.md)
- [AI 自我调试指南](guides/ai-self-debug.md)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
