# Go 工具开发脚本

此目录包含 `gh-action-debug` 工具的**开发脚本**，用于构建、测试和安装工具。

## 📋 脚本说明

### 🔨 构建脚本

#### `build-all.sh`
**用途**: 跨平台构建 Go 工具，生成所有平台的二进制文件

**使用方式**:
```bash
cd core/tools/go
bash build-all.sh
```

**输出**: `dist/gh-action-debug-{os}-{arch}` 文件

**支持的平台**:
- Linux (amd64, arm64)
- macOS (amd64, arm64)
- Windows (amd64, arm64)

#### `Makefile` (推荐)
**用途**: 使用 Make 构建（更标准）

**使用方式**:
```bash
cd core/tools/go
make build          # 构建当前平台
make build-all      # 构建所有平台
make clean          # 清理构建产物
```

### ✅ 验证脚本

#### `build-verify.sh`
**用途**: 验证构建产物是否正确

**使用方式**:
```bash
cd core/tools/go
bash build-verify.sh
```

#### `test-verify.sh`
**用途**: 运行测试并验证工具功能

**使用方式**:
```bash
cd core/tools/go
bash test-verify.sh
```

### 📦 安装脚本

#### `install.sh`
**用途**: 将 `gh-action-debug` 安装到系统 PATH (`/usr/local/bin`)

**使用方式**:
```bash
cd core/tools/go
bash install.sh
```

**注意**: 
- 需要先构建工具（`make build` 或 `bash build-all.sh`）
- 可能需要 sudo 权限
- 安装后可以在任何地方使用 `gh-action-debug` 命令

**与 `core/scripts/install.sh` 的区别**:
- `core/tools/go/install.sh` - 将工具安装到**系统 PATH**（全局可用）
- `core/scripts/install.sh` - 将工具集安装到**目标项目**（项目本地）

## 🎯 使用场景

### 开发工具时

```bash
# 1. 修改代码
vim internal/debugger/debugger.go

# 2. 构建（当前平台）
make build

# 3. 测试
make test
# 或
bash test-verify.sh

# 4. 安装到系统（可选）
bash install.sh
```

### 发布新版本时

```bash
# 1. 构建所有平台
make build-all
# 或
bash build-all.sh

# 2. 验证构建产物
bash build-verify.sh

# 3. 提交构建产物
git add dist/
git commit -m "build: 发布新版本"
```

## 📝 注意事项

1. **开发脚本**: 这些脚本是**开发工具集时使用**的，不会输出到其他项目
2. **构建产物**: `dist/` 目录中的二进制文件会被 `core/scripts/install.sh` 复制到目标项目
3. **系统安装**: `install.sh` 是可选的，主要用于开发时方便测试

## 🔗 相关文档

- **工具使用**: `README.md`（本目录）
- **工具集安装**: `../../scripts/README.md`
- **设计文档**: `DESIGN.md`

