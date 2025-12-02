# Flutter 构建工具测试和验证

## ✅ 已完成的工作

### 1. 本地构建脚本

- ✅ **文件**: `scripts/flutter-build.sh`
- ✅ **功能**: 完整的 Flutter 构建流程
- ✅ **权限**: 已添加执行权限

### 2. GitHub Actions 模板

- ✅ **文件**: `core/templates/build/flutter-build.yml`
- ✅ **功能**: 多平台矩阵构建
- ✅ **文档**: 已更新 `core/templates/README.md`

### 3. 工作流文件

- ✅ **文件**: `.github/workflows/flutter-build.yml`
- ✅ **来源**: 从模板复制

### 4. 文档

- ✅ **使用指南**: `FLUTTER_BUILD_GUIDE.md`
- ✅ **测试文档**: `FLUTTER_BUILD_TEST.md`（本文件）

## 🧪 验证步骤

### 步骤 1: 验证本地脚本语法

```bash
# 检查脚本语法
bash -n scripts/flutter-build.sh

# 应该没有输出（表示语法正确）
```

### 步骤 2: 测试脚本帮助

```bash
# 查看帮助信息
bash scripts/flutter-build.sh --help

# 应该显示完整的帮助信息
```

### 步骤 3: 验证工作流文件

```bash
# 检查 YAML 语法（如果安装了 yamllint）
yamllint .github/workflows/flutter-build.yml

# 或使用 GitHub CLI 验证
gh workflow list
```

### 步骤 4: 推送代码

```bash
# 添加所有新文件
git add scripts/flutter-build.sh
git add core/templates/build/flutter-build.yml
git add .github/workflows/flutter-build.yml
git add FLUTTER_BUILD_GUIDE.md
git add FLUTTER_BUILD_TEST.md
git add core/templates/README.md

# 提交
git commit -m "feat: add Flutter build tool and workflow

- Add local Flutter build script (scripts/flutter-build.sh)
- Add Flutter GitHub Actions template
- Add workflow file (.github/workflows/flutter-build.yml)
- Add documentation and guides"

# 推送到远程仓库（必须！）
git push origin main
```

### 步骤 5: 使用 gh-action-debug 调试

```bash
# 方式 1: JSON 输出（推荐，AI 友好）
gh-action-debug workflow debug .github/workflows/flutter-build.yml main --output json

# 方式 2: 详细输出（人类可读）
gh-action-debug workflow debug .github/workflows/flutter-build.yml main --verbose

# 方式 3: 手动触发并调试
gh-action-debug workflow trigger .github/workflows/flutter-build.yml main \
  --input platform=web \
  --input build_mode=release
```

## 📊 预期结果

### gh-action-debug JSON 输出示例

```json
{
  "success": true,
  "run_id": 123456789,
  "run_url": "https://github.com/firoyang/GithubActionAISelfBuilder/actions/runs/123456789",
  "status": "success",
  "duration": 120,
  "jobs": [
    {
      "name": "Build Flutter (android)",
      "status": "success",
      "duration": 45
    },
    {
      "name": "Build Flutter (web)",
      "status": "success",
      "duration": 30
    }
  ],
  "errors": [],
  "suggestions": []
}
```

### 如果失败，JSON 输出会包含：

```json
{
  "success": false,
  "run_id": 123456789,
  "status": "failure",
  "errors": [
    {
      "job": "Build Flutter (android)",
      "step": "Build Flutter app",
      "error_type": "build_failed",
      "message": "Build failed with exit code 1",
      "log_snippet": "...",
      "suggestions": [
        "检查 Flutter 版本是否匹配",
        "检查 Android 依赖是否完整",
        "查看详细日志: gh run view 123456789 --log-failed"
      ]
    }
  ],
  "suggestions": [
    "检查 pubspec.yaml 中的依赖",
    "确保所有平台特定的依赖已安装",
    "验证 Flutter 环境配置"
  ]
}
```

## 🔍 调试流程

### 标准调试循环

```bash
# 1. 修改代码或工作流
vim .github/workflows/flutter-build.yml

# 2. 推送代码（必须！）
git add .github/workflows/flutter-build.yml
git commit -m "fix: update Flutter workflow"
git push origin main

# 3. 使用工具调试
gh-action-debug workflow debug .github/workflows/flutter-build.yml main --output json

# 4. 解析 JSON 输出
# - 检查 success 字段
# - 查看 errors 数组
# - 阅读 suggestions 建议

# 5. 根据建议修复
# 应用 suggestions 中的修复建议

# 6. 重复步骤 1-5 直到成功
```

## 🎯 验证检查清单

- [ ] 本地脚本语法正确（`bash -n scripts/flutter-build.sh`）
- [ ] 脚本帮助信息正常显示
- [ ] 工作流文件 YAML 语法正确
- [ ] 代码已推送到远程仓库
- [ ] 使用 gh-action-debug 成功触发工作流
- [ ] 工作流执行成功（或收到明确的错误信息）
- [ ] JSON 输出格式正确
- [ ] 错误分析功能正常（如果有错误）

## 📝 注意事项

### 1. 必须先推送代码

**重要**：GitHub Actions 从远程仓库拉取代码，本地修改不会生效！

```bash
# ❌ 错误：修改后直接触发
vim .github/workflows/flutter-build.yml
gh-action-debug workflow debug ...  # 使用的是旧代码！

# ✅ 正确：先推送再触发
vim .github/workflows/flutter-build.yml
git add .github/workflows/flutter-build.yml
git commit -m "fix: ..."
git push origin main
gh-action-debug workflow debug ...  # 使用的是新代码！
```

### 2. 使用 JSON 输出

对于 AI 助手，**必须使用 JSON 输出**：

```bash
# ✅ 推荐：JSON 输出
gh-action-debug workflow debug ... --output json

# ❌ 不推荐：人类可读输出（AI 难以解析）
gh-action-debug workflow debug ... --verbose
```

### 3. 多平台构建

Flutter 工作流会在多个平台构建，可能需要较长时间。如果只想测试单个平台，可以：

1. 修改工作流文件，只保留一个平台
2. 或使用手动触发，指定平台参数

## 🚀 下一步

1. **验证脚本**: 运行 `bash -n scripts/flutter-build.sh`
2. **推送代码**: 提交并推送到远程仓库
3. **触发测试**: 使用 `gh-action-debug` 触发工作流
4. **分析结果**: 查看 JSON 输出，确认成功或获取错误信息
5. **修复问题**: 如果有错误，根据建议修复并重复

---

**🎉 现在可以开始测试了！**

