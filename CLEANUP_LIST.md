# 清理清单

## ✅ 已移到 legacy/

- ✅ `python/` - 旧的 Python 实现
- ✅ `scripts/ProjectOnly/` - 项目特定脚本
- ✅ `scripts/env/` - 环境安装脚本
- ✅ `.cursor/rules/` (旧的) - 移到 legacy/old-cursor-rules/

## 📝 保留的文件（已重构）

### 核心内容 (core/)
- ✅ `core/rules/` - 简化的 AI 规则（新的）
- ✅ `core/scripts/` - Python 工具脚本（作为备选）
- ✅ `core/templates/` - Workflow 模板
- ✅ `core/tools/go/` - Go 调试工具（新的主力）

### 文档 (docs/)
- ✅ `docs/INSTALL.md` - 安装指南（需更新）
- ✅ `docs/USAGE.md` - 使用指南（需更新）
- ✅ `docs/README.md` - 文档索引
- ✅ `docs/guides/` - 使用指南
- ⚠️  其他旧文档 - 需要审查

### 开发测试 (dev/)
- ✅ `dev/test-project/` - 测试项目
- ✅ `dev/README.md` - 说明

### 配置
- ✅ `config/` - 示例配置
- ✅ `toolset.json` - 工具集描述
- ✅ `.gitignore` - Git 忽略（需更新）

### 根文件
- ✅ `README.md` - 项目说明（需更新）
- ✅ `CHANGELOG.md` - 更新日志
- ✅ `PROJECT_STRUCTURE.md` - 项目结构
- ✅ `GO_TOOL_IMPLEMENTATION_PLAN.md` - Go 工具计划
- ✅ `IMPLEMENTATION_SUMMARY.md` - 实现总结

## 🗑️ 可以删除的文件

### 旧文档（可选保留在 legacy/）
- `docs/python-example.py` - Python 示例
- `docs/config-projectonly.md` - ProjectOnly 配置说明
- `docs/parent-project-pipelines.md` - 旧的流水线文档
- `docs/modularity.md` - 旧的模块化文档
- `docs/type-safety-vs-simplicity.md` - 类型安全讨论
- `docs/technical-solutions.md` - 技术方案
- `docs/why-gh-token-required.md` - Token 说明
- `docs/github-actions-authentication.md` - 认证说明
- `docs/github-api-client-abstraction.md` - API 客户端抽象
- `docs/local-build-script-unification.md` - 本地构建统一

### 旧配置（已移到 legacy/）
- ❌ 无需删除，已在 legacy/

## 📋 需要更新的文件

1. **README.md** - 更新项目说明
2. **docs/INSTALL.md** - 添加 Go 工具安装
3. **docs/USAGE.md** - 更新使用说明
4. **.gitignore** - 添加 Go 相关忽略

## 🎯 决策

**保留策略**：
- ✅ 旧文档移动到 `legacy/docs/` 目录
- ✅ Python 脚本保留在 `core/scripts/` 作为备选
- ✅ legacy/ 目录完整保留，方便参考
- ✅ 不删除任何已归档的内容

**原因**：
1. 方便查看历史设计思路
2. Python 脚本可作为备选方案
3. 文档有参考价值
4. Git 历史已经记录，删除意义不大


