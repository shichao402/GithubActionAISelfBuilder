# 实现计划：TypeScript + Reusable Actions

## 当前状态分析

### ✅ 已完成

1. **TypeScript Actions**
   - ✅ `actions/build-action`：标准化构建流程
   - ✅ `actions/release-action`：GitHub Release 发布
   - ✅ `actions/common/setup`：环境设置
   - ✅ `actions/common/artifact`：产物管理

2. **Python 脚手架**
   - ✅ `src/scaffold.py`：从派生类生成 YAML
   - ✅ 支持读取类方法配置
   - ✅ 生成使用 TypeScript Actions 的 YAML

3. **Pipeline 派生类**
   - ✅ `FlutterBuildPipeline`：Flutter Windows 构建
   - ✅ `BuildPipeline`：通用构建
   - ✅ `ReleasePipeline`：发布流程

### ⚠️ 需要补充

1. **脚手架工具类型安全**
   - ⚠️ 当前使用 Python，缺少类型检查
   - 💡 **方案 A**：保持 Python，添加类型检查工具（mypy）
   - 💡 **方案 B**：迁移到 TypeScript

2. **Pipeline 定义方式**
   - ⚠️ 当前使用 Python 类
   - 💡 **保持现状**：Python 灵活，易于使用
   - 💡 **或迁移**：TypeScript 类，但需要重新设计

3. **配置管理**
   - ⚠️ 混合使用 `config.yaml` 和类方法
   - 💡 **统一**：优先使用类方法，`config.yaml` 作为可选覆盖

## 推荐方案

### 方案 1：保持 Python Pipeline + TypeScript Actions（推荐）

**架构**：
```
Python Pipeline 类（定义配置和逻辑）
  ↓
Python 脚手架（生成 YAML）
  ↓
GitHub Action YAML（使用 TypeScript Actions）
  ↓
TypeScript Actions（执行构建/发布）
```

**优势**：
- ✅ 用户只需要写 Python，简单易用
- ✅ TypeScript Actions 提供类型安全和可复用性
- ✅ 不需要迁移现有代码

**改进**：
1. 为 Python 代码添加类型检查（mypy）
2. 统一配置方式（优先类方法）
3. 完善文档和示例

### 方案 2：完全迁移到 TypeScript

**架构**：
```
TypeScript Pipeline 类（定义配置和逻辑）
  ↓
TypeScript 脚手架（生成 YAML）
  ↓
GitHub Action YAML（使用 TypeScript Actions）
  ↓
TypeScript Actions（执行构建/发布）
```

**优势**：
- ✅ 完全类型安全
- ✅ 统一语言栈
- ✅ 更好的 IDE 支持

**劣势**：
- ❌ 需要重写所有 Pipeline 类
- ❌ 用户需要学习 TypeScript
- ❌ 执行构建命令可能不如 Python 灵活

## 实施计划

### 阶段 1：完善当前方案（1-2 周）

#### 1.1 添加 Python 类型检查

```bash
# 安装 mypy
pip install mypy

# 添加类型注解
# src/base_pipeline.py
from typing import Dict, Any, Optional

class BasePipeline(ABC):
    @classmethod
    def get_workflow_inputs(cls) -> Dict[str, Dict[str, Any]]:
        ...
```

#### 1.2 统一配置方式

**原则**：
- 优先使用类方法（`get_workflow_*`）
- `config.yaml` 仅用于覆盖
- 移除不必要的配置文件

**实施**：
```python
# 修改 scaffold.py
def analyze_pipeline(self, pipeline_class: type) -> Dict[str, Any]:
    # 优先从类方法读取
    inputs = pipeline_class.get_workflow_inputs()
    setup = pipeline_class.get_workflow_setup()
    # config.yaml 仅用于覆盖
    ...
```

#### 1.3 完善文档

- ✅ 使用指南
- ✅ 最佳实践
- ✅ 常见问题
- ✅ 迁移指南

### 阶段 2：增强脚手架（2-4 周）

#### 2.1 验证生成的 YAML

```python
# 添加 YAML 验证
def validate_yaml(self, yaml_content: str) -> bool:
    # 使用 GitHub Actions 的 schema 验证
    # 或使用 yamllint
    ...
```

#### 2.2 更好的错误提示

```python
# 改进错误信息
def generate(self, ...):
    try:
        ...
    except Exception as e:
        # 提供清晰的错误信息和修复建议
        self.logger.error(f"生成失败: {e}")
        self.logger.info("建议: 检查 Pipeline 类的配置方法")
        ...
```

#### 2.3 支持更多配置选项

- 支持矩阵构建
- 支持依赖关系
- 支持条件执行

### 阶段 3：考虑迁移（可选，1-2 月）

#### 3.1 评估迁移成本

- 统计现有 Pipeline 类数量
- 评估迁移工作量
- 评估用户影响

#### 3.2 如果决定迁移

**步骤**：
1. 设计 TypeScript Pipeline 接口
2. 实现 TypeScript 脚手架
3. 迁移现有 Pipeline 类
4. 更新文档

**TypeScript Pipeline 接口设计**：

```typescript
// src/pipelines/base.ts
export interface PipelineConfig {
  inputs?: Record<string, InputConfig>;
  setup?: SetupConfig;
  triggers?: TriggerConfig;
  runsOn?: string;
}

export abstract class BasePipeline {
  abstract getConfig(): PipelineConfig;
  abstract execute(): Promise<void>;
}
```

## 具体实施步骤

### 第一步：添加类型检查（立即）

```bash
# 1. 安装 mypy
pip install mypy

# 2. 创建 mypy 配置
# mypy.ini
[mypy]
python_version = 3.9
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = False

# 3. 运行检查
mypy src/
```

### 第二步：统一配置方式（本周）

1. 修改 `scaffold.py`，优先使用类方法
2. 移除不必要的 `config.yaml` 使用
3. 更新文档

### 第三步：完善文档（本周）

1. 创建使用指南
2. 添加最佳实践
3. 创建常见问题文档

### 第四步：增强脚手架（下周）

1. 添加 YAML 验证
2. 改进错误提示
3. 支持更多配置选项

## 成功标准

### 短期目标（1 个月）

- ✅ 所有 Pipeline 类都有类型注解
- ✅ 配置方式统一（优先类方法）
- ✅ 文档完善
- ✅ 生成的 YAML 经过验证

### 中期目标（3 个月）

- ✅ 脚手架工具稳定可靠
- ✅ 支持常见构建场景
- ✅ 用户反馈良好

### 长期目标（6 个月）

- ⚠️ 考虑是否迁移到 TypeScript
- ⚠️ 或保持 Python + TypeScript 混合方案

## 风险与应对

### 风险 1：Python 类型检查不够严格

**应对**：
- 使用 mypy 严格模式
- 添加运行时验证
- 提供类型定义文件

### 风险 2：用户不熟悉 TypeScript

**应对**：
- 保持 Python Pipeline 类
- 提供详细的 TypeScript Actions 使用文档
- 提供示例和模板

### 风险 3：迁移成本高

**应对**：
- 先完善当前方案
- 评估迁移收益
- 逐步迁移，不一次性重写

## 总结

### 推荐路径

1. **短期**：完善当前 Python + TypeScript 混合方案
2. **中期**：评估是否需要完全迁移到 TypeScript
3. **长期**：根据用户反馈决定是否迁移

### 核心原则

1. ✅ **保持简单**：用户只需要写 Python 类
2. ✅ **类型安全**：TypeScript Actions 提供类型检查
3. ✅ **可复用**：Actions 可以在多个项目中使用
4. ✅ **渐进式**：不一次性重写，逐步改进

