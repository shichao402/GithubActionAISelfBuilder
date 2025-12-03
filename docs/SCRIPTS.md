# 脚本目录结构说明

本文档说明工具集中所有脚本的用途、层级和位置。

## 📊 脚本层级图

```
GithubActionAISelfBuilder/
│
├── scripts/                          # 📦 项目维护脚本（不输出）
│   ├── maintenance/
│   │   ├── cleanup.sh               # 清理旧文件
│   │   └── README.md
│   └── README.md
│
└── core/tools/go/                    # 🛠️  Go 工具开发脚本（不输出）
    ├── install.sh                    # 安装工具到系统 PATH
    ├── build-all.sh                  # 跨平台构建
    ├── build-verify.sh               # 构建验证
    ├── test-verify.sh                # 测试验证
    ├── Makefile                      # Make 构建（推荐）
    └── SCRIPTS.md                    # 开发脚本说明
```

## 🎯 脚本分类

### 1. 项目维护脚本 (`scripts/`)

**用途**: 维护工具集项目本身

**特点**:
- ❌ **不输出**到其他项目
- ✅ 项目特定
- ✅ 用于项目维护和重构

**脚本**:
- `maintenance/cleanup.sh` - 清理旧文件和过时内容

**使用场景**:
```bash
# 项目重构时清理旧文件
bash scripts/maintenance/cleanup.sh
```

---

### 2. Go 工具开发脚本 (`core/tools/go/`)

**用途**: 开发、构建、测试 `gh-action-debug` 工具

**特点**:
- ❌ **不输出**到其他项目
- ✅ 开发工具集时使用
- ✅ 构建产物在 `core/tools/go/dist/` 目录

**脚本**:
- `install.sh` - 将工具安装到系统 PATH (`/usr/local/bin`)
- `build-all.sh` - 跨平台构建所有平台
- `build-verify.sh` - 验证构建产物
- `test-verify.sh` - 运行测试验证
- `Makefile` - Make 构建（推荐使用）

**使用场景**:
```bash
# 开发工具时
cd core/tools/go
make build          # 构建当前平台
make test           # 运行测试
bash install.sh     # 安装到系统（可选）

# 发布新版本时
make build-all      # 构建所有平台
bash build-verify.sh # 验证构建
```

---

## 📋 脚本对比表

| 脚本路径 | 用途 | 输出到其他项目 | 使用场景 |
|---------|------|--------------|---------|
| `scripts/maintenance/cleanup.sh` | 清理旧文件 | ❌ | 项目维护 |
| `core/tools/go/install.sh` | 安装工具到系统 | ❌ | 开发时测试工具 |
| `core/tools/go/build-all.sh` | 跨平台构建 | ❌ | 发布新版本 |
| `core/tools/go/build-verify.sh` | 验证构建 | ❌ | 发布前验证 |
| `core/tools/go/test-verify.sh` | 测试验证 | ❌ | 开发时测试 |

## 🔄 工作流程

### 开发工具集时

```bash
# 1. 修改 Go 工具代码
vim core/tools/go/internal/debugger/debugger.go

# 2. 构建并测试
cd core/tools/go
make build
make test

# 3. 安装到系统（可选，方便测试）
bash install.sh

# 4. 测试工具
gh-action-debug workflow list
```

### 发布新版本时

```bash
# 1. 构建所有平台
cd core/tools/go
make build-all

# 2. 验证构建
bash build-verify.sh

# 3. 提交构建产物
git add dist/
git commit -m "build: 发布新版本"
git push
```

### 在其他项目中使用工具集

```bash
# 1. 添加 Submodule
cd /path/to/your/project
git submodule add https://github.com/shichao402/GithubActionAISelfBuilder.git .toolsets/github-actions

# 2. 手动安装工具集（参考 docs/INSTALL.md）

# 3. 使用工具
./scripts/toolsets/github-actions/gh-action-debug workflow list
```

## 📚 相关文档

- **项目维护脚本**: `scripts/README.md`
- **Go 工具开发脚本**: `core/tools/go/SCRIPTS.md`
- **安装指南**: `docs/INSTALL.md`
- **使用指南**: `docs/USAGE.md`

