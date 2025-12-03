# Scripts 目录

此目录包含**项目特定的脚本**，用于维护工具集项目本身。

## 📁 目录结构

```
scripts/
├── maintenance/          # 项目维护脚本（不输出）
│   ├── cleanup.sh      # 清理旧文件脚本
│   └── README.md       # 维护脚本说明
└── README.md           # 本文件
```

## 🎯 脚本分类

### 项目维护脚本 (`maintenance/`)

用于维护工具集项目本身的脚本：

- `cleanup.sh` - 清理旧文件和过时内容

**特点**:
- ✅ 项目特定，不输出到其他项目
- ✅ 用于项目维护和重构

## 🆚 与其他脚本目录的区别

### `scripts/` (本目录)
- **用途**: 项目维护脚本
- **目标**: 工具集项目本身
- **输出**: ❌ 不输出到其他项目

### `core/scripts/`
- **用途**: 工具集安装脚本
- **目标**: 其他项目（通过 Git Submodule）
- **输出**: ✅ 会输出到其他项目

### `core/tools/go/`
- **用途**: Go 工具开发脚本
- **目标**: 开发 `gh-action-debug` 工具
- **输出**: ❌ 不输出（但构建产物会被 `core/scripts/install.sh` 使用）

## 📊 脚本层级图

```
工具集项目
│
├── scripts/                    # 项目维护脚本（不输出）
│   └── maintenance/
│       └── cleanup.sh
│
├── core/scripts/               # 工具集安装脚本（会输出）
│   └── install.sh              # 安装工具集到目标项目
│
└── core/tools/go/              # Go 工具开发脚本（不输出）
    ├── install.sh              # 安装工具到系统 PATH
    ├── build-all.sh            # 跨平台构建
    ├── build-verify.sh         # 构建验证
    └── test-verify.sh          # 测试验证
```

## 🔗 相关文档

- **维护脚本**: `maintenance/README.md`
- **工具集安装**: `../core/scripts/README.md`
- **Go 工具开发**: `../core/tools/go/SCRIPTS.md`
- **项目文档**: `../README.md`
