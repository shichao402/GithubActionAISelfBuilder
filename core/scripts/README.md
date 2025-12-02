# 脚本目录

这个目录包含工具集的安装脚本。

## 📋 文件说明

### install.sh

工具集安装脚本，用于将工具集安装到目标项目。

**功能**：
- 复制 AI 规则文件到 `.cursor/rules/github-actions/`
- 安装 Go 调试工具到 `scripts/toolsets/github-actions/`
- 复制 Workflow 模板到 `.github/templates/`
- 配置 npm scripts（如果项目使用 Node.js）

**使用方式**：

```bash
# 在目标项目根目录运行
bash /path/to/github-action-toolset/core/scripts/install.sh

# 或使用 Git Submodule
cd /path/to/your/project
git submodule add https://github.com/firoyang/github-action-toolset .toolsets/github-actions
bash .toolsets/github-actions/core/scripts/install.sh
```

**安装内容**：

1. **AI 规则文件** (`.cursor/rules/github-actions/`)
   - `github-actions.mdc` - GitHub Actions 规则
   - `debugging.mdc` - 调试规则
   - `best-practices.mdc` - 最佳实践

2. **Go 调试工具** (`scripts/toolsets/github-actions/`)
   - `gh-action-debug` - 单一可执行文件

3. **Workflow 模板** (`.github/templates/`)
   - `build/` - 构建模板
   - `test/` - 测试模板
   - `release/` - 发布模板
   - `deployment/` - 部署模板

## 🔧 依赖要求

- **Git**: 用于版本控制
- **GitHub CLI (gh)**: 用于调试和触发工作流
- **Go 工具二进制文件**: 需要预编译的 `gh-action-debug`（或从源码构建）

## 📝 注意事项

1. **安装位置**: 脚本会检测当前工作目录作为目标项目根目录
2. **权限**: 某些操作可能需要写入权限
3. **覆盖**: 默认不会覆盖已存在的文件（除非使用 `--force`）

## 🎯 验证安装

安装完成后，验证：

```bash
# 检查规则文件
ls -la .cursor/rules/github-actions/

# 检查 Go 工具
./scripts/toolsets/github-actions/gh-action-debug version

# 检查模板
ls -la .github/templates/
```

## 📚 相关文档

- [安装指南](../../docs/INSTALL.md)
- [使用指南](../../docs/USAGE.md)
- [Go 工具文档](../tools/go/README.md)
