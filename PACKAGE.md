# 包管理器集成指南

本工具集遵循现代包管理器设计理念（类似 Homebrew、pip），可以通过 [CursorToolset](https://github.com/firoyang/CursorToolset) 包管理器轻松安装和管理。

## 📦 设计理念

### 类比说明

| 包管理器 | 源码位置 | 二进制/资源位置 | 配置位置 |
|---------|---------|---------------|---------|
| **Homebrew** | `/usr/local/Cellar/` | `/usr/local/bin/` | `/usr/local/etc/` |
| **pip** | `~/.local/lib/python*/site-packages/` | `~/.local/bin/` | `~/.config/` |
| **CursorToolset** | `~/.cursortoolsets/repos/` | 项目相关目录 | `~/.cursortoolsets/config/` |

### 目录结构

```
~/.cursortoolsets/                          # 用户级工具集环境（类似 ~/.local）
├── repos/                                  # 工具集源码仓库（类似 Cellar）
│   └── github-action-toolset/              
│       ├── core/
│       │   ├── rules/                      # AI 规则源文件
│       │   └── tools/go/dist/              # 构建产物
│       ├── install.sh                      # 构建脚本
│       └── toolset.json                    # 包元数据
├── bin/                                    # 可执行文件（未来）
│   └── cursortoolset
└── config/                                 # 配置文件
    └── available-toolsets.json

<项目目录>/                                 # 用户项目
├── .cursor/rules/github-actions/           # 安装的 AI 规则（项目级）
│   ├── github-actions.mdc
│   ├── debugging.mdc
│   └── best-practices.mdc
└── scripts/toolsets/github-actions/        # 安装的工具（项目级）
    └── gh-action-debug                     # 符号链接或复制的二进制
```

## 🔧 toolset.json 规范

`toolset.json` 是工具集的元数据文件，定义了如何安装和使用工具集：

```json
{
  "name": "github-action-toolset",
  "displayName": "GitHub Action AI 工具集",
  "version": "1.0.0",
  "description": "...",
  
  "scripts": {
    "install": "bash install.sh",      // 🔨 构建脚本（在 repos/ 目录中执行）
    "validate": "bash test.sh"         // ✅ 验证脚本（可选）
  },
  
  "install": {
    "targets": {
      ".cursor/rules/github-actions/": {
        "source": "core/rules/",       // 📂 源目录（相对于工具集根目录）
        "files": ["*.mdc"],            // 📄 文件模式
        "merge": true,                 // 🔄 是否合并到已有目录
        "overwrite": false,            // ⚠️ 是否覆盖已存在文件
        "description": "AI 规则文件"
      },
      "scripts/toolsets/github-actions/": {
        "source": "core/tools/go/dist/",
        "files": ["gh-action-debug-*"],
        "executable": true,            // 🔐 标记为可执行文件
        "description": "Go 调试工具"
      }
    }
  }
}
```

### 关键字段说明

#### `scripts.install`
- **目的**：在安装前构建工具
- **执行目录**：工具集根目录（`~/.cursortoolsets/repos/github-action-toolset/`）
- **要求**：必须幂等（可重复执行）
- **示例**：
  - `bash install.sh` - 构建 Go 二进制文件
  - `make build` - 使用 Makefile 构建
  - `npm install && npm run build` - 构建 Node.js 工具

#### `install.targets`
- **目的**：定义如何复制文件到项目
- **source**：相对于工具集根目录的源路径
- **files**：文件模式（支持 glob）
  - `*.mdc` - 所有 .mdc 文件
  - `gh-action-debug-*` - 平台特定二进制（CursorToolset 自动选择当前平台）
- **executable**：标记为可执行（自动处理平台选择和权限）

## 🚀 安装流程

### 用户视角

```bash
# 1. 用户执行安装命令
cursortoolset install github-action-toolset

# 2. 自动完成以下步骤：
#    a. 克隆仓库到 ~/.cursortoolsets/repos/github-action-toolset/
#    b. 执行 bash install.sh（构建 Go 工具）
#    c. 复制 core/rules/*.mdc 到项目 .cursor/rules/github-actions/
#    d. 复制 core/tools/go/dist/gh-action-debug-darwin-arm64 到 scripts/toolsets/github-actions/gh-action-debug
#    e. 设置可执行权限

# 3. 完成！开始使用
gh-action-debug workflow list
```

### 开发者视角

作为工具集开发者，你需要：

1. **提供 `install.sh`**（或其他构建脚本）
   ```bash
   #!/bin/bash
   set -e
   
   # 检查依赖
   if ! command -v go &> /dev/null; then
       echo "警告：未安装 Go，跳过构建"
       exit 0  # 不报错，允许只安装规则文件
   fi
   
   # 构建工具
   cd core/tools/go
   bash build-all.sh
   ```

2. **确保构建产物在正确位置**
   - `toolset.json` 中 `install.targets.source` 指向的位置必须在构建后存在
   - 例如：`core/tools/go/dist/gh-action-debug-*`

3. **支持可选依赖**
   - 如果构建失败（如未安装 Go），不应阻止 AI 规则文件的安装
   - 返回 exit 0，但输出警告信息

## 🎯 最佳实践

### 1. 构建脚本设计

```bash
#!/bin/bash
set -e

# ✅ 好的做法：检查依赖并友好降级
if ! command -v go &> /dev/null; then
    echo "⚠️  未检测到 Go，跳过 Go 工具构建"
    echo "ℹ️  AI 规则文件将正常安装"
    exit 0  # 不阻止安装
fi

# ✅ 好的做法：清晰的输出
echo "🔨 开始构建 Go 工具..."
cd core/tools/go
bash build-all.sh
echo "✅ 构建完成"
```

### 2. 跨平台二进制文件

```bash
# 构建所有平台
GOOS=darwin GOARCH=amd64 go build -o dist/tool-darwin-amd64
GOOS=darwin GOARCH=arm64 go build -o dist/tool-darwin-arm64
GOOS=linux GOARCH=amd64 go build -o dist/tool-linux-amd64
GOOS=windows GOARCH=amd64 go build -o dist/tool-windows-amd64.exe
```

CursorToolset 会自动选择当前平台的二进制文件。

### 3. 目录结构

```
github-action-toolset/
├── install.sh              # 🔨 构建脚本（顶层）
├── toolset.json            # 📋 元数据
├── README.md               # 📖 用户文档
├── PACKAGE.md              # 📦 包管理器集成文档
├── core/                   # 核心资源
│   ├── rules/              # AI 规则源文件
│   │   ├── *.mdc
│   │   └── README.md
│   └── tools/              # 工具源码
│       └── go/
│           ├── cmd/
│           ├── dist/       # ⚡ 构建产物（由 install.sh 生成）
│           ├── build-all.sh
│           └── Makefile
├── docs/                   # 文档
└── .github/                # GitHub 配置
```

## 🔄 更新和卸载

### 更新工具集

```bash
# CursorToolset 会自动 git pull 并重新构建
cursortoolset update github-action-toolset
```

### 卸载工具集

```bash
# 自动清理所有安装的文件和源码
cursortoolset uninstall github-action-toolset
```

## 🐛 常见问题

### Q: 构建失败怎么办？

A: 确保 `install.sh` 在依赖缺失时友好退出（exit 0），而不是报错（exit 1）。这样至少可以安装规则文件。

### Q: 如何支持多个工具？

A: 在 `install.targets` 中添加多个目标：

```json
"install": {
  "targets": {
    ".cursor/rules/xxx/": { "source": "rules/" },
    "scripts/toolsets/xxx/tool1": { "source": "dist/tool1" },
    "scripts/toolsets/xxx/tool2": { "source": "dist/tool2" }
  }
}
```

### Q: 可以不构建二进制吗？

A: 可以！如果你的工具集只有 AI 规则文件（.mdc），不需要 `scripts.install`，也不需要 `install.sh`。

```json
{
  "scripts": {},  // 空的也可以
  "install": {
    "targets": {
      ".cursor/rules/my-rules/": {
        "source": "rules/",
        "files": ["*.mdc"]
      }
    }
  }
}
```

## 📚 参考资料

- [CursorToolset 文档](https://github.com/firoyang/CursorToolset)
- [Homebrew Formula 指南](https://docs.brew.sh/Formula-Cookbook)
- [Python Packaging](https://packaging.python.org/en/latest/)

---

**让你的工具集像 brew 包一样易于安装和使用！** 🎉
