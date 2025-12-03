# 工具集安装脚本

这个目录包含**工具集安装脚本**，用于将工具集安装到目标项目。

## 📋 脚本说明

### `install.sh`

**用途**: 将 GitHub Action Toolset 安装到目标项目

**使用场景**: 在其他项目中使用工具集时

**使用方式**:

```bash
# 在目标项目根目录运行
cd /path/to/your/project

# 方式 1: 使用 Git Submodule
git submodule add https://github.com/firoyang/github-action-toolset .toolsets/github-actions
bash .toolsets/github-actions/core/scripts/install.sh

# 方式 2: 直接使用路径
bash /path/to/github-action-toolset/core/scripts/install.sh
```

**安装内容**:

1. **AI 规则文件** → `.cursor/rules/github-actions/`
   - `github-actions.mdc`
   - `debugging.mdc`
   - `best-practices.mdc`

2. **Go 调试工具** → `scripts/toolsets/github-actions/gh-action-debug`
   - 从 `core/tools/go/dist/` 复制预编译的二进制文件

3. **Workflow 模板** → `.github/templates/`
   - `build/` - 构建模板
   - `test/` - 测试模板
   - `release/` - 发布模板
   - `deployment/` - 部署模板

**依赖要求**:
- Git
- GitHub CLI (gh)
- Go 工具二进制文件（预编译）

## 🆚 与其他安装脚本的区别

### `core/scripts/install.sh` (本脚本)
- **用途**: 将**整个工具集**安装到目标项目
- **目标**: 其他项目（通过 Git Submodule）
- **输出**: 规则文件、工具、模板到目标项目

### `core/tools/go/install.sh`
- **用途**: 将 `gh-action-debug` 安装到**系统 PATH**
- **目标**: 开发机器（全局安装）
- **输出**: `/usr/local/bin/gh-action-debug`
- **使用场景**: 开发工具集时，方便测试

### 对比表

| 脚本 | 用途 | 目标位置 | 使用场景 |
|------|------|---------|---------|
| `core/scripts/install.sh` | 安装工具集 | 目标项目 | 在其他项目中使用工具集 |
| `core/tools/go/install.sh` | 安装 Go 工具到系统 | `/usr/local/bin` | 开发工具集时测试 |

## 📝 工作流程

### 在其他项目中使用工具集

```bash
# 1. 添加 Submodule
cd /path/to/your/project
git submodule add https://github.com/firoyang/github-action-toolset .toolsets/github-actions

# 2. 运行安装脚本
bash .toolsets/github-actions/core/scripts/install.sh

# 3. 验证安装
ls -la .cursor/rules/github-actions/
ls -la scripts/toolsets/github-actions/
ls -la .github/templates/

# 4. 使用工具
./scripts/toolsets/github-actions/gh-action-debug workflow list
```

### 更新工具集

```bash
# 在目标项目中
cd .toolsets/github-actions
git pull origin main
cd ../..
bash .toolsets/github-actions/core/scripts/install.sh  # 重新安装
```

## 🔧 安装过程

1. **检查依赖**: 验证 Git、GitHub CLI 是否安装
2. **复制规则文件**: 从 `core/rules/` 到 `.cursor/rules/github-actions/`
3. **安装 Go 工具**: 从 `core/tools/go/dist/` 复制到 `scripts/toolsets/github-actions/`
4. **复制模板**: 从 `core/templates/` 到 `.github/templates/`
5. **配置 npm scripts**: 提示添加 npm scripts（如果项目使用 Node.js）

## 📚 相关文档

- [安装指南](../../docs/INSTALL.md)
- [使用指南](../../docs/USAGE.md)
- [Go 工具开发脚本](../tools/go/SCRIPTS.md)
