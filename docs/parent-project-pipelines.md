# 在父项目中创建 Pipeline

## Pipeline 存放位置

### 灵活配置

**父项目的 Pipeline 可以放在任何位置，通过配置文件指定**。

### 默认位置

如果不配置，脚手架工具默认在项目根目录的 `src/pipelines/` 目录下查找：

```
父项目根目录/
├── src/
│   └── pipelines/              # 默认 Pipeline 目录
│       ├── my-build-pipeline.ts
│       └── my-release-pipeline.ts
├── <本项目路径>/               # 本项目（Git Submodule 或依赖）
└── .github/
    └── workflows/              # 生成的工作流文件
```

### 自定义位置

可以在父项目根目录创建 `config.yaml` 文件，配置自定义 Pipeline 目录：

```yaml
pipelines:
  scripts_dir: "custom/pipelines"  # 自定义 Pipeline 目录（相对于项目根目录）
```

**示例目录结构**:
```
父项目根目录/
├── custom/
│   └── pipelines/              # 自定义 Pipeline 目录
│       └── my-build-pipeline.ts
├── config.yaml                  # 配置文件
└── .github/
    └── workflows/
```

## 创建 Pipeline 的步骤

### 1. 选择 Pipeline 存放位置

可以选择任何位置，推荐在项目根目录下创建 Pipeline 目录：

- **默认位置**: `src/pipelines/`（无需配置）
- **自定义位置**: 在 `config.yaml` 中配置 `pipelines.scripts_dir`

### 2. 创建 Pipeline 文件

在选定的目录下创建新的 TypeScript 文件：

```typescript
// src/pipelines/my-build-pipeline.ts
import { BasePipeline, PipelineResult } from '../../GithubActionAISelfBuilder/src/base-pipeline';
import { createWorkflowConfig } from '../../GithubActionAISelfBuilder/src/workflow-config';

export class MyBuildPipeline extends BasePipeline {
  // ... 实现代码
}
```

### 3. 调整导入路径

根据实际的项目结构调整导入路径：

- **Git Submodule**: `../../GithubActionAISelfBuilder/src/base-pipeline`
- **npm 包**: `@your-org/github-action-builder/base-pipeline`
- **相对路径**: 根据实际位置调整

### 4. 使用脚手架工具生成工作流

在父项目根目录运行脚手架工具：

```bash
# 在父项目根目录
cd <父项目根目录>

# 使用本项目的脚手架工具
node GithubActionAISelfBuilder/dist/src/scaffold.js \
  --pipeline MyBuildPipeline \
  --output .github/workflows/my-build.yml
```

## 脚手架工具的工作原理

### 项目根目录检测

脚手架工具会：
1. 从运行目录开始向上查找
2. 找到第一个包含 `package.json` 的目录作为项目根目录
3. 在项目根目录的 `src/pipelines/` 目录下查找 Pipeline 文件

### Pipeline 文件查找

脚手架工具会：
1. 递归扫描 `src/pipelines/` 目录（或配置的自定义目录）
2. 查找所有 `.ts` 文件
3. 动态导入并查找匹配的 Pipeline 类

### 工作流生成

脚手架工具会：
1. 加载 Pipeline 类
2. 读取静态配置方法（`getWorkflowInputs()`, `getWorkflowSetup()` 等）
3. 生成 GitHub Action YAML 文件
4. 保存到 `.github/workflows/` 目录（或指定的输出路径）

## 配置选项

### config.yaml 配置

在父项目根目录创建 `config.yaml`（可选）：

```yaml
scaffold:
  workflows_dir: ".github/workflows"  # 工作流输出目录

pipelines:
  scripts_dir: "src/pipelines"        # Pipeline 脚本目录
```

## 最佳实践

1. **灵活选择位置**: 根据项目结构选择合适的位置，通过 `config.yaml` 配置
2. **命名规范**: 使用清晰的命名，如 `my-project-build-pipeline.ts`
3. **导入路径**: 使用相对路径，便于项目迁移
4. **文档化**: 在 Pipeline 文件中添加清晰的注释说明用途
5. **配置管理**: 在项目根目录创建 `config.yaml`，统一管理 Pipeline 目录配置

## 注意事项

1. **路径问题**: 确保导入路径正确指向本项目的 `BasePipeline`
2. **编译问题**: 如果使用 TypeScript，需要先编译或使用 `ts-node`
3. **依赖问题**: 确保父项目安装了必要的依赖（如 `@actions/core`）
4. **版本兼容**: 确保本项目的版本与父项目兼容

