# 项目设计思路总结

## 核心思路

### 1. 使用 TypeScript，可以使用 Reusable Actions

**目标**：利用 TypeScript 的类型安全和 GitHub Actions 的 Reusable Actions 机制。

**实现方式**：
- ✅ 创建可复用的 TypeScript Actions（`actions/build-action`, `actions/release-action`）
- ✅ 这些 Actions 可以在多个项目中复用
- ✅ TypeScript 提供编译时类型检查

**优势**：
- ✅ **类型安全**：编译时检查，减少运行时错误
- ✅ **可复用**：一次编写，多处使用
- ✅ **官方支持**：GitHub Actions 官方支持 TypeScript
- ✅ **本地测试**：使用 `act` 工具可以本地测试

### 2. 以派生类为单位生成 GitHub Action YAML

**目标**：每个 Pipeline 派生类对应一个 GitHub Action workflow 文件。

**当前实现**：
- ✅ Python 基类 `BasePipeline` 定义标准接口
- ✅ 派生类（如 `FlutterBuildPipeline`）实现具体逻辑
- ✅ Python 脚手架工具 `scaffold.py` 从派生类生成 YAML

**生成流程**：
```
Pipeline 派生类（Python）
  ↓
脚手架工具（scaffold.py）
  ↓
GitHub Action YAML
  ↓
使用 TypeScript Actions（build-action, release-action）
```

## 架构设计

### 层次结构

```
┌─────────────────────────────────────────┐
│  Pipeline 派生类（Python）              │
│  - FlutterBuildPipeline                 │
│  - BuildPipeline                        │
│  - ReleasePipeline                      │
│  定义：配置 + 逻辑                      │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  脚手架工具（scaffold.py）              │
│  - 读取派生类的配置方法                  │
│  - 生成 GitHub Action YAML              │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  GitHub Action YAML                     │
│  - .github/workflows/*.yml              │
│  - 使用 TypeScript Actions              │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  TypeScript Actions                     │
│  - actions/build-action                 │
│  - actions/release-action               │
│  - actions/common/*                     │
└─────────────────────────────────────────┘
```

### 数据流

1. **定义阶段**：用户在 Python 派生类中定义配置和逻辑
2. **生成阶段**：脚手架工具读取派生类，生成 YAML
3. **执行阶段**：GitHub Actions 执行 YAML，调用 TypeScript Actions

## 当前状态

### ✅ 已实现

1. **TypeScript Actions**
   - ✅ `actions/build-action`：标准化构建流程
   - ✅ `actions/release-action`：GitHub Release 发布
   - ✅ `actions/common/setup`：环境设置
   - ✅ `actions/common/artifact`：产物管理

2. **Python 脚手架**
   - ✅ `src/scaffold.py`：从派生类生成 YAML
   - ✅ 支持读取类方法配置（`get_workflow_inputs`, `get_workflow_setup` 等）
   - ✅ 生成使用 TypeScript Actions 的 YAML

3. **Pipeline 派生类**
   - ✅ `FlutterBuildPipeline`：Flutter Windows 构建
   - ✅ `BuildPipeline`：通用构建
   - ✅ `ReleasePipeline`：发布流程

### ⚠️ 需要补充

1. **脚手架工具迁移到 TypeScript**
   - ⚠️ 当前使用 Python 的 `scaffold.py`
   - 💡 **建议**：迁移到 TypeScript，实现类型安全的 YAML 生成

2. **Pipeline 定义方式**
   - ⚠️ 当前使用 Python 类定义
   - 💡 **选项 A**：保持 Python，但添加类型检查工具
   - 💡 **选项 B**：迁移到 TypeScript，但需要重新设计接口

3. **本地测试支持**
   - ✅ 已支持 `act` 工具
   - ⚠️ 需要完善文档和示例

4. **配置管理**
   - ⚠️ 当前使用 `config.yaml` 和类方法混合
   - 💡 **建议**：统一配置方式，优先使用类方法

## 设计决策

### 为什么保持 Python Pipeline 类？

**原因**：
1. ✅ **灵活性**：Python 可以轻松执行各种构建命令
2. ✅ **生态**：Python 在 CI/CD 领域广泛使用
3. ✅ **简单**：用户只需要写 Python 类，不需要学习 TypeScript

**权衡**：
- ❌ 失去类型安全（但可以通过工具检查）
- ❌ 需要 Python 运行时（但 GitHub Actions 支持）

### 为什么使用 TypeScript Actions？

**原因**：
1. ✅ **类型安全**：编译时检查
2. ✅ **可复用**：可以在多个项目中使用
3. ✅ **官方支持**：GitHub Actions 官方推荐

**优势**：
- ✅ 统一的构建/发布流程
- ✅ 可以在本地使用 `act` 测试
- ✅ 可以发布到 GitHub Marketplace

## 使用示例

### 1. 定义 Pipeline 派生类

```python
# src/pipelines/flutter_build_pipeline.py
class FlutterBuildPipeline(BasePipeline):
    @classmethod
    def get_workflow_setup(cls) -> Dict[str, Any]:
        config = WorkflowConfig()
        config.setup_python(version="3.9", cache="pip")
        config.setup_flutter(version="3.16.0")
        config.add_setup_step("Install Python dependencies", "pip install -r requirements.txt")
        return config.to_dict()
    
    @classmethod
    def get_workflow_runs_on(cls) -> str:
        return "windows-latest"
    
    def execute(self):
        # 构建逻辑
        self._run_command("flutter build windows --release")
        # 设置输出
        self.set_output("artifact-path", "build/windows/runner/Release")
```

### 2. 生成 YAML

```bash
python src/scaffold.py --pipeline FlutterBuildPipeline --output flutter-build.yml
```

### 3. 生成的 YAML

```yaml
name: Flutter Build
on:
  push:
    branches: [main, develop]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v20
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          cache: 'pip'
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
      - name: Install Python dependencies
        run: pip install -r requirements.txt
      - uses: ./actions/build-action
        with:
          build-command: python src/pipelines/flutter_build_pipeline.py
          artifact-path: build/windows/runner/Release/**
          upload-artifacts: true
```

## 未来改进方向

### 短期（1-2 周）

1. **完善文档**
   - ✅ 使用指南
   - ✅ 最佳实践
   - ✅ 常见问题

2. **增强脚手架**
   - ⚠️ 支持更多配置选项
   - ⚠️ 更好的错误提示
   - ⚠️ 验证生成的 YAML

### 中期（1-2 月）

1. **迁移脚手架到 TypeScript**
   - 💡 使用 TypeScript 重写 `scaffold.py`
   - 💡 实现类型安全的 YAML 生成
   - 💡 支持 TypeScript 类型检查

2. **增强 Actions**
   - 💡 支持更多构建场景
   - 💡 更好的错误处理
   - 💡 支持并行构建

### 长期（3-6 月）

1. **统一语言栈**
   - 💡 考虑完全迁移到 TypeScript
   - 💡 或者提供 Python 和 TypeScript 两种选择

2. **可视化工具**
   - 💡 Web UI 生成 Pipeline
   - 💡 可视化配置编辑器

## 总结

### 核心价值

1. ✅ **标准化**：统一的构建/发布流程
2. ✅ **可复用**：TypeScript Actions 可以在多个项目中使用
3. ✅ **类型安全**：TypeScript 提供编译时检查
4. ✅ **本地测试**：使用 `act` 可以本地测试

### 关键设计

1. **混合架构**：Python Pipeline 类 + TypeScript Actions
2. **代码生成**：从派生类自动生成 YAML
3. **可复用性**：Actions 可以在多个项目中复用

### 下一步

1. ✅ 完善文档和示例
2. ⚠️ 考虑迁移脚手架到 TypeScript
3. ⚠️ 增强错误处理和验证

