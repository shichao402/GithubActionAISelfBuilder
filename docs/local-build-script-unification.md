# 本地构建脚本与 GitHub Action 统一

## 你的新痛点

1. **每个项目都要写 GitHub Action**
2. **每个项目还要写本地构建脚本**
3. **希望本地构建脚本和 GitHub Action 使用同一套流程**

## 问题分析

### 传统方式的问题

**GitHub Action**：
```yaml
jobs:
  build:
    steps:
      - run: npm install
      - run: npm run build
      - uses: actions/upload-artifact@v3
```

**本地构建脚本**（需要单独写）：
```bash
#!/bin/bash
npm install
npm run build
# 产物处理...
```

**问题**：
- ❌ 两套代码，容易不一致
- ❌ 维护成本高
- ❌ 本地和 CI 行为可能不同

### Reusable Workflows + Actions 的问题

**GitHub Action**：
```yaml
jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      build-command: npm run build
```

**本地构建脚本**（仍然需要单独写）：
```bash
#!/bin/bash
npm install
npm run build
```

**问题**：
- ❌ 构建逻辑在 YAML 中，无法在本地复用
- ❌ 仍然需要单独写本地脚本

## 当前项目的解决方案

### ✅ 核心优势：同一套代码，本地和 CI 都能用

**Pipeline 类定义构建逻辑**：
```python
# src/pipelines/flutter_build_pipeline.py
class FlutterBuildPipeline(BasePipeline):
    def execute(self):
        # 构建逻辑（本地和 CI 都用这个）
        self._run_command("flutter pub get")
        self._run_command("flutter build windows --release")
        # 产物处理...
```

**本地运行**：
```bash
# 直接在本地运行 Pipeline
python -m src.pipelines.flutter_build_pipeline \
    --input project-name="my-project" \
    --input build-mode="release"
```

**GitHub Action 调用**：
```yaml
# .github/workflows/flutter-build.yml（自动生成）
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - name: Run Build
        run: python -m src.pipelines.flutter_build_pipeline \
          --input project-name=${{ github.repository }} \
          --input build-mode="release"
      - uses: actions/upload-artifact@v3
```

**优势**：
- ✅ 同一套代码，本地和 CI 都用
- ✅ 行为完全一致
- ✅ 只需要维护一套代码

## Go 实现的优势

### 本地运行

```bash
# 编译为单文件二进制
go build -o build-pipeline ./cmd/pipeline

# 本地运行
./build-pipeline \
  --input project-name="my-project" \
  --input build-mode="release"
```

### GitHub Action 调用

```yaml
# .github/workflows/flutter-build.yml（自动生成）
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - name: Run Build
        run: ./build-pipeline \
          --input project-name=${{ github.repository }} \
          --input build-mode="release"
      - uses: actions/upload-artifact@v3
```

**优势**：
- ✅ 单文件二进制，无需运行时
- ✅ 本地和 CI 使用同一个二进制
- ✅ 行为完全一致

## 完整解决方案

### 1. 项目结构

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
└── Makefile                   # 本地构建命令（可选）
```

### 2. Pipeline 类（构建逻辑）

```python
# src/pipelines/build_pipeline.py
class BuildPipeline(BasePipeline):
    def execute(self):
        # 构建逻辑（本地和 CI 都用这个）
        self._run_command("npm install")
        self._run_command("npm run build")
        # 产物处理...
```

### 3. 本地构建脚本

```bash
#!/bin/bash
# scripts/build.sh

# 激活虚拟环境（如果需要）
source venv/bin/activate

# 运行 Pipeline（和 GitHub Action 用同一个）
python -m src.pipelines.build_pipeline \
    --input project-name="my-project" \
    --input build-mode="release" \
    --input upload-artifacts="false"  # 本地不上传
```

### 4. GitHub Action（自动生成）

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
          --input build-mode="release" \
          --input upload-artifacts="true"  # CI 上传
      - uses: actions/upload-artifact@v3
```

### 5. Makefile（可选）

```makefile
# Makefile
.PHONY: build test clean

build:
	@echo "本地构建..."
	@python -m src.pipelines.build_pipeline \
		--input project-name="my-project" \
		--input build-mode="release"

test:
	@echo "运行测试..."
	@python -m src.pipelines.test_pipeline

clean:
	@echo "清理构建产物..."
	@rm -rf artifacts/ build/
```

## 对比其他方案

### Reusable Workflows + Actions

**问题**：
- ❌ 构建逻辑在 YAML 中，无法在本地复用
- ❌ 仍然需要单独写本地脚本
- ❌ 本地和 CI 行为可能不同

### 当前项目（Python/Go）

**优势**：
- ✅ 构建逻辑在 Pipeline 类中
- ✅ 本地可以直接运行 Pipeline 类
- ✅ GitHub Action 只是调用 Pipeline 类
- ✅ 本地和 CI 使用同一套代码
- ✅ 行为完全一致

## 实际使用示例

### 场景 1: Flutter 项目

**Pipeline 类**：
```python
class FlutterBuildPipeline(BasePipeline):
    def execute(self):
        self._run_command("flutter pub get")
        self._run_command("flutter build windows --release")
        # 产物处理...
```

**本地运行**：
```bash
# 方式 1: 直接运行
python -m src.pipelines.flutter_build_pipeline \
    --input build-mode="release"

# 方式 2: 使用脚本
./scripts/build.sh

# 方式 3: 使用 Makefile
make build
```

**GitHub Action**（自动生成）：
```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
      - name: Run Build
        run: python -m src.pipelines.flutter_build_pipeline \
          --input build-mode="release"
      - uses: actions/upload-artifact@v3
```

### 场景 2: Node.js 项目

**Pipeline 类**：
```python
class NodeBuildPipeline(BasePipeline):
    def execute(self):
        self._run_command("npm ci")
        self._run_command("npm run build")
        # 产物处理...
```

**本地运行**：
```bash
python -m src.pipelines.node_build_pipeline
```

**GitHub Action**（自动生成）：
```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Run Build
        run: python -m src.pipelines.node_build_pipeline
      - uses: actions/upload-artifact@v3
```

## 最佳实践

### 1. 统一入口

```python
# src/pipelines/build_pipeline.py
if __name__ == "__main__":
    pipeline = BuildPipeline()
    result = pipeline.run()
    sys.exit(result.exit_code)
```

### 2. 环境检测

```python
def execute(self):
    # 检测运行环境
    is_ci = os.getenv("CI") == "true"
    is_local = not is_ci
    
    if is_local:
        self.logger.info("本地构建模式")
        # 本地特定逻辑
    else:
        self.logger.info("CI 构建模式")
        # CI 特定逻辑
```

### 3. 参数统一

```python
def execute(self):
    # 本地和 CI 使用相同的参数
    build_mode = self.get_input("build-mode", "release")
    project_name = self.get_input("project-name", "unknown")
    
    # 构建逻辑（本地和 CI 都用）
    self._run_command(f"build --mode {build_mode}")
```

## 总结

### 当前项目的优势

1. ✅ **同一套代码**：Pipeline 类定义构建逻辑
2. ✅ **本地可运行**：可以直接运行 Pipeline 类
3. ✅ **CI 自动调用**：GitHub Action 自动生成并调用
4. ✅ **行为一致**：本地和 CI 使用同一套代码
5. ✅ **维护简单**：只需要维护一套代码

### 其他方案的问题

1. ❌ **Reusable Workflows**：构建逻辑在 YAML 中，无法在本地复用
2. ❌ **自定义 Actions**：构建逻辑在 Action 中，无法在本地复用
3. ❌ **传统方式**：需要写两套代码（GitHub Action + 本地脚本）

### 建议

**使用当前项目（迁移到 Go）**：
- ✅ 本地和 CI 使用同一套代码
- ✅ 单文件二进制，易于分发
- ✅ 类型安全（Go）
- ✅ 自动生成 GitHub Action

这正是当前项目的核心优势之一！


