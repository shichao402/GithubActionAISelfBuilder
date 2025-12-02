# 安装指南

## ⚠️ 重要：必须使用 Conda

本项目**严格要求使用 Conda**进行环境管理，**不支持直接使用 pip 安装**。

### 为什么必须使用 Conda？

1. **环境一致性** ✅
   - 确保所有用户使用相同的 Python 版本（3.11）
   - 确保所有依赖版本一致

2. **依赖管理** ✅
   - Conda 自动处理复杂的依赖关系
   - 避免版本冲突

3. **跨平台一致性** ✅
   - 在不同操作系统上提供一致的环境
   - 确保开发和生产环境一致

4. **可复现性** ✅
   - `environment.yml` 文件确保环境可复现
   - 团队成员可以轻松复现相同的环境

## 📥 安装 Conda

### 方式 1: Miniconda（推荐）⭐⭐⭐

**优势**：
- 体积小（~50MB）
- 安装快速
- 只包含 Conda 和 Python

**下载地址**：
- https://docs.conda.io/en/latest/miniconda.html

**安装步骤**：
1. 下载对应平台的安装包
2. 运行安装程序
3. 重新打开终端/PowerShell
4. 验证安装：`conda --version`

### 方式 2: Anaconda

**优势**：
- 包含更多预装工具
- 适合数据科学项目

**下载地址**：
- https://www.anaconda.com/products/distribution

## 🚀 快速安装

### macOS/Linux

```bash
cd python
bash install.sh
```

### Windows (PowerShell)

```powershell
cd python
.\install.ps1
```

## 📝 安装脚本行为

安装脚本会：

1. **检查 Conda**
   - ✅ 如果检测到 Conda：创建环境
   - ❌ 如果未检测到 Conda：提示安装并退出

2. **检查环境**
   - 如果环境已存在，询问是否重新创建

3. **创建环境**
   - 使用 `environment.yml` 创建 Conda 环境
   - 自动安装所有依赖

4. **提供下一步指南**
   - 激活环境
   - 验证安装

## 🔍 验证安装

安装完成后，运行：

```bash
# 激活环境
conda activate github-action-builder

# 测试脚手架工具
python -m src.scaffold --help

# 测试导入
python -c "from src.base_pipeline import BasePipeline; print('✅ 成功')"
```

## 🛠️ 故障排除

### 问题 1: Conda 未找到

**错误信息**：
```
❌ 错误: 未检测到 Conda
```

**解决方案**：
1. 安装 Miniconda: https://docs.conda.io/en/latest/miniconda.html
2. 重新打开终端/PowerShell
3. 验证：`conda --version`
4. 重新运行安装脚本

### 问题 2: 环境创建失败

**可能原因**：
- 网络问题
- Conda 配置问题

**解决方案**：
1. 检查网络连接
2. 使用国内镜像源（如需要）：
   ```bash
   conda config --add channels conda-forge
   conda config --set show_channel_urls yes
   ```
3. 重新运行安装脚本

### 问题 3: 环境已存在

**解决方案**：
- 选择 `y` 删除并重新创建
- 或选择 `N` 使用现有环境

## 📚 更多信息

- [快速开始指南](QUICK_START.md)
- [迁移完成报告](MIGRATION_COMPLETE.md)
