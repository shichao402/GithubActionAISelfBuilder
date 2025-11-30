# GitHub Action AI Self Builder

一个通用的 GitHub Action 从零构建脚手架工具，通过 AI 协助快速生成和配置 GitHub Actions 工作流。

## 项目简介

本项目旨在为任意 GitHub 项目提供一套标准化的 GitHub Action 流水线构建方案。通过提供标准化的流水线脚本基类和脚手架工具，配合 AI 协助，可以快速为项目生成构建、测试、发布等功能的 GitHub Action 工作流。

## 技术栈

- **语言**: Python
- **环境**: venv (虚拟环境)
- **支持平台**: Windows, macOS, Linux

## 环境要求

- Python 3.7+
- Git

## 快速开始

### 1. 环境安装

本项目提供了跨平台的通用环境安装脚本，支持 Windows、macOS 和 Linux 三个平台。

#### Windows

```powershell
# 使用 PowerShell 执行安装脚本
.\scripts\install.ps1
```

或者使用批处理文件：

```cmd
.\scripts\install.bat
```

#### macOS / Linux

```bash
# 使用 bash 执行安装脚本
chmod +x scripts/install.sh
./scripts/install.sh
```

安装脚本会自动：
- 创建 Python 虚拟环境 (venv)
- 安装项目依赖
- 配置必要的环境变量

### 2. 激活虚拟环境

#### Windows

```powershell
.\venv\Scripts\Activate.ps1
```

或者：

```cmd
.\venv\Scripts\activate.bat
```

#### macOS / Linux

```bash
source venv/bin/activate
```

### 3. 验证安装

```bash
python --version
pip list
```

## 项目架构

### 核心概念

1. **流水线脚本基类**: 提供标准化的流水线脚本基类，每个派生类对应一个 GitHub Action 工作流
2. **配置文件**: 支持通过配置文件扩展和定制流水线行为
3. **脚手架生成器**: 根据脚本派生类自动生成对应的 GitHub Action YAML 文件
4. **流水线组合**: 支持将多个脚本流水线组合成更复杂的工作流

## 使用流程

### 步骤 0: 了解基础架构

本项目提供了标准化的流水线脚本基类。设计上，每一个脚本派生类都可以对应生成一个 GitHub Action 工作流。

### 步骤 1: 编写流水线脚本派生类

在 AI 的协助下，编写具体的流水线脚本派生类，完成特定功能（如构建、测试、部署等），并扩展相应的配置文件。

**示例结构**:

```python
from base_pipeline import BasePipeline

class BuildPipeline(BasePipeline):
    """构建流水线"""
    def execute(self):
        # 实现构建逻辑
        pass
```

### 步骤 2: 生成 GitHub Action 工作流

使用本项目提供的脚手架工具，根据脚本派生类自动生成对应的 GitHub Action 工作流 YAML 文件。

```bash
python scaffold.py --pipeline BuildPipeline --output .github/workflows/build.yml
```

### 步骤 3: 组织多个流水线

在 AI 的协助下，将多个脚本流水线组合成更复杂的 GitHub Action 工作流，实现完整的 CI/CD 流程。

## 项目结构

```
GithubActionAISelfBuilder/
├── README.md                 # 项目文档
├── requirements.txt          # Python 依赖
├── .github/
│   └── workflows/           # 生成的 GitHub Action 工作流
├── scripts/
│   ├── install.sh           # Linux/macOS 安装脚本
│   ├── install.bat          # Windows 批处理安装脚本
│   └── install.ps1          # Windows PowerShell 安装脚本
├── src/
│   ├── base_pipeline.py     # 流水线基类
│   ├── scaffold.py          # 脚手架生成器
│   └── pipelines/           # 流水线脚本派生类
│       └── __init__.py
├── config/                  # 配置文件目录
└── venv/                    # Python 虚拟环境（自动生成）
```

## 开发指南

### 创建新的流水线脚本

1. 在 `src/pipelines/` 目录下创建新的 Python 文件
2. 继承 `BasePipeline` 基类
3. 实现 `execute()` 方法
4. 定义必要的配置参数

### 配置文件格式

配置文件支持 JSON 或 YAML 格式，用于定义流水线的参数和行为。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

[待定]

## 联系方式

[待定]

