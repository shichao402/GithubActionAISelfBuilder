# 在父项目中使用本项目的规则文件

## 概述

本目录包含的共享规则文件（`rules.mdc` 和 `scripts-usage.mdc`）设计用于在父项目中正常工作。

## 规则文件说明

### 共享规则文件

- **`rules.mdc`**: 核心规则，说明如何使用本项目创建 Pipeline 和生成工作流
- **`scripts-usage.mdc`**: 脚本使用规则，说明如何在父项目中使用共享脚本

### 项目特定规则（不会注入）

位于 `ProjectOnly/` 目录的文件在注入到父项目时**会被删除**，因此共享规则不引用这些内容。

## 路径调整指南

### 1. 导入路径调整

在父项目中创建 Pipeline 时，需要根据实际项目结构调整导入路径：

```typescript
// 方式 1: Git Submodule（假设子模块名为 GithubActionAISelfBuilder）
import { BasePipeline } from '../../GithubActionAISelfBuilder/src/base-pipeline';

// 方式 2: npm 包
import { BasePipeline } from '@your-org/github-action-builder/base-pipeline';

// 方式 3: 相对路径（根据实际结构调整）
import { BasePipeline } from '<本项目相对路径>/src/base-pipeline';
```

### 2. 命令路径调整

使用脚手架工具时，需要指定本项目的路径：

```bash
# 方式 1: 进入子模块目录
cd <子模块路径>
npm run scaffold -- --pipeline YourPipeline --output ../.github/workflows/your-pipeline.yml

# 方式 2: 使用绝对路径
npm run scaffold -- --pipeline YourPipeline --output <父项目绝对路径>/.github/workflows/your-pipeline.yml
```

### 3. 脚本路径调整

复制脚本后，需要调整脚本内部的导入路径：

```typescript
// 原脚本中的导入
import { WorkflowManager } from '../../src/workflow-manager';

// 在父项目中需要调整为
import { WorkflowManager } from '<本项目路径>/src/workflow-manager';
```

## 注意事项

1. **路径引用**: 所有路径引用都是相对于本项目根目录的
2. **ProjectOnly 文件**: 在注入到父项目时会被删除，需要使用的脚本应在注入前复制
3. **独立完整**: 共享规则文件独立完整，不依赖 ProjectOnly 内容
4. **路径灵活性**: 规则文件使用占位符（如 `<本项目路径>`），需要根据实际情况替换

## 最佳实践

1. **使用相对路径**: 优先使用相对路径，便于项目迁移
2. **统一路径管理**: 在父项目中统一管理本项目的路径引用
3. **文档化路径**: 在父项目的 README 中记录路径配置
4. **测试验证**: 在父项目中测试路径配置是否正确


