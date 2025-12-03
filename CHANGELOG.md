# 更新日志

所有重要的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2025-12-02

### 重大变更 🚨

- **完全重构**: 从复杂的框架模式转变为"规则 + 工具 + 模板"模式
- **删除 BasePipeline**: 不再需要继承基类和学习框架 API
- **删除脚手架工具**: 直接使用 YAML 模板，更简单直观

### 新增 ✨

#### 核心架构

- 创建 `core/` 目录作为可复用内容的核心
  - `core/rules/` - AI 规则文件
  - `core/scripts/` - 安装脚本
  - `core/tools/go/` - Go 调试工具源码

#### AI 规则文件

- `github-actions.mdc` - GitHub Actions 基础规则和最佳实践
- `debugging.mdc` - 工作流调试标准流程
- `best-practices.mdc` - 性能优化和安全实践

#### 工具脚本

- `ai_debug_workflow.py` - 一键调试工作流（触发、监控、收集日志、分析）
- `test_pipelines.py` - 批量测试多个工作流
- `run_pipeline.py` - 手动触发指定工作流

#### 模板库

- **构建模板**:
  - `nodejs-build.yml` - Node.js 项目构建
  - `python-build.yml` - Python 项目构建
- **测试模板**:
  - `pytest.yml` - Python 测试
- **发布模板**:
  - `github-release.yml` - GitHub Release 创建
- **部署模板**:
  - `deploy-npm.yml` - npm 包发布

#### 安装和文档

- 创建一键安装脚本 `core/scripts/install.sh`
- 完整的文档体系：
  - 安装指南 (`docs/INSTALL.md`)
  - 使用指南 (`docs/USAGE.md`)
  - 快速开始 (`docs/guides/quickstart.md`)
- 项目自描述文件 `toolset.json`

#### 项目组织

- 创建 `dev/` 目录存放测试项目和验证工具（不复用）
- 创建 `legacy/` 目录存放旧版本实现
- 重新组织文档结构 (`docs/guides/`, `docs/reference/`, `docs/examples/`)

### 改进 🔧

- **简化规则文件**: 删除复杂的框架相关内容，只保留通用规则
- **更好的 AI 集成**: AI 可以直接理解规则，无需学习框架
- **降低学习成本**: 用户只需要了解 YAML 和 GitHub Actions
- **提高灵活性**: 可以直接修改 YAML，不受框架限制

### 废弃 ⚠️

以下功能已移至 `legacy/` 目录，不推荐继续使用：

- `BasePipeline` 基类及其派生类系统
- `WorkflowConfig` 和相关构建器
- `ScaffoldGenerator` 脚手架生成器
- `PipelineRegistry` 注册表系统
- Python 环境管理（不再需要）
- 复杂的 ProjectOnly 目录结构

### 文档 📚

- 新增完整的安装文档
- 新增详细的使用指南
- 新增快速开始指南（5 分钟上手）
- 新增模板使用说明
- 新增故障排除指南

### 测试 ✅

- 验证安装脚本在 macOS 上正常工作
- 验证所有文件正确复制到目标位置
- 验证工具脚本可以正常运行

## [0.x.x] - 旧版本（已废弃）

旧版本使用 BasePipeline 框架模式，已被新架构取代。

相关代码已移至 `legacy/` 目录，仅供参考。

---

## 类型说明

- `新增` - 新功能
- `改进` - 对现有功能的改进
- `修复` - Bug 修复
- `废弃` - 即将移除的功能
- `删除` - 已移除的功能
- `安全` - 安全相关修复
- `文档` - 仅文档更改


