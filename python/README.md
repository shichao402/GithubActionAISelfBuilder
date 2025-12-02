# GitHub Action Builder - Python 版本

## 🚀 快速开始

### ⚠️ 重要：必须使用 Conda

本项目**要求使用 Conda**进行环境管理，以确保：
- ✅ 环境隔离，避免依赖冲突
- ✅ 版本管理一致性
- ✅ 跨平台一致性
- ✅ 可复现的环境配置

**不支持直接使用 pip 安装**，请先安装 Conda。

### 安装步骤

1. **安装 Conda**（如果还没有）
   
   **推荐：Miniconda**（体积小，速度快）
   ```bash
   # 下载并安装 Miniconda
   # macOS/Linux: https://docs.conda.io/en/latest/miniconda.html
   # Windows: https://docs.conda.io/en/latest/miniconda.html
   ```
   
   **或：Anaconda**（完整版，包含更多工具）
   ```bash
   # 下载并安装 Anaconda
   # https://www.anaconda.com/products/distribution
   ```

2. **运行安装脚本**
   ```bash
   # macOS/Linux
   cd python
   bash install.sh
   
   # Windows (PowerShell)
   cd python
   .\install.ps1
   ```

3. **激活环境**
   ```bash
   conda activate github-action-builder
   ```

4. **验证安装**
   ```bash
   python -m src.scaffold --help
   ```

## 📋 系统要求

- **Conda**: 必须安装（Miniconda 或 Anaconda）
- **Python**: 3.11+（由 Conda 自动安装）
- **操作系统**: macOS, Linux, Windows

## 🔍 验证安装

安装完成后，运行以下命令验证：

```bash
# 测试脚手架工具
python -m src.scaffold --help

# 测试导入核心模块
python -c "from src.base_pipeline import BasePipeline; print('✅ 导入成功')"
python -c "from src.workflow_config import create_workflow_config; print('✅ 导入成功')"
```

## 📚 使用文档

- [快速开始指南](QUICK_START.md)
- [安装指南](INSTALL.md)
- [迁移完成报告](MIGRATION_COMPLETE.md)
- [迁移状态](MIGRATION_STATUS.md)

## 🛠️ 故障排除

### 问题 1: Conda 未找到

**错误信息**：
```
❌ 错误: 未检测到 Conda
```

**解决方案**:
1. 安装 Miniconda: https://docs.conda.io/en/latest/miniconda.html
2. 重新打开终端/PowerShell
3. 重新运行安装脚本

### 问题 2: 环境已存在

**解决方案**:
- 选择 `y` 删除并重新创建
- 或选择 `N` 使用现有环境

### 问题 3: environment.yml 未找到

**解决方案**:
- 确保在 `python/` 目录下运行安装脚本
- 检查 `environment.yml` 文件是否存在

## 📝 为什么必须使用 Conda？

1. **环境一致性**: 确保所有用户使用相同的 Python 版本和依赖版本
2. **依赖管理**: Conda 自动处理复杂的依赖关系
3. **跨平台**: 在不同操作系统上提供一致的环境
4. **可复现性**: `environment.yml` 文件确保环境可复现

## 🎯 下一步

安装完成后，请查看 [快速开始指南](QUICK_START.md) 开始使用！
