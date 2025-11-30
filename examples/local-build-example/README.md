# 本地构建与 GitHub Action 统一示例

## 核心思想

**同一套代码，本地和 CI 都用**：
- Pipeline 类定义构建逻辑
- 本地直接运行 Pipeline 类
- GitHub Action 自动生成并调用 Pipeline 类

## 项目结构

```
my-project/
├── .github/
│   └── workflows/
│       └── build.yml          # 自动生成（调用 Pipeline）
├── src/
│   └── pipelines/
│       └── build_pipeline.py  # 构建逻辑（本地和 CI 都用）
├── scripts/
│   └── build.sh               # 本地构建脚本（调用 Pipeline）
├── Makefile                   # 本地构建命令
└── README.md
```

## 使用方式

### 1. 本地构建

**方式 1: 直接运行 Pipeline**
```bash
python -m src.pipelines.build_pipeline \
    --input project-name="my-project" \
    --input build-mode="release"
```

**方式 2: 使用脚本**
```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

**方式 3: 使用 Makefile**
```bash
make build
```

### 2. GitHub Action（自动生成）

```yaml
# .github/workflows/build.yml（自动生成）
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - name: Run Build
        run: python -m src.pipelines.build_pipeline \
          --input project-name=${{ github.repository }} \
          --input build-mode="release"
      - uses: actions/upload-artifact@v3
```

## 优势

1. ✅ **同一套代码**：本地和 CI 都用 Pipeline 类
2. ✅ **行为一致**：本地和 CI 行为完全相同
3. ✅ **维护简单**：只需要维护一套代码
4. ✅ **易于测试**：本地可以测试完整的构建流程

## 对比其他方案

### Reusable Workflows + Actions

**问题**：
- ❌ 构建逻辑在 YAML 中，无法在本地复用
- ❌ 仍然需要单独写本地脚本
- ❌ 本地和 CI 行为可能不同

### 当前项目

**优势**：
- ✅ 构建逻辑在 Pipeline 类中
- ✅ 本地可以直接运行 Pipeline 类
- ✅ GitHub Action 只是调用 Pipeline 类
- ✅ 本地和 CI 使用同一套代码

## 最佳实践

1. **统一入口**：Pipeline 类作为统一入口
2. **环境检测**：检测运行环境（本地/CI）
3. **参数统一**：本地和 CI 使用相同的参数
4. **行为一致**：确保本地和 CI 行为相同


