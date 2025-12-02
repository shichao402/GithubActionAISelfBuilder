# 项目结构

## 📁 核心目录结构

```
github-action-toolset/
├── toolset.json              # 工具集自描述文件（元数据、安装配置）
├── README.md                 # 项目主文档
├── CHANGELOG.md              # 更新日志
│
├── core/                     # 核心可复用内容（会被安装到目标项目）
│   ├── rules/               # AI 规则文件
│   │   ├── github-actions.mdc    # GitHub Actions 基础规则
│   │   ├── debugging.mdc          # 调试规则
│   │   ├── best-practices.mdc     # 最佳实践
│   │   └── README.md
│   │
│   ├── scripts/             # 工具脚本
│   │   ├── install.sh            # 安装脚本
│   │   ├── ai_debug_workflow.py  # AI 调试工具
│   │   ├── test_pipelines.py     # 批量测试工具
│   │   ├── run_pipeline.py       # 手动触发工具
│   │   └── README.md
│   │
│   └── templates/           # Workflow 模板库
│       ├── build/               # 构建模板
│       │   ├── nodejs-build.yml
│       │   └── python-build.yml
│       ├── test/                # 测试模板
│       │   └── pytest.yml
│       ├── release/             # 发布模板
│       │   └── github-release.yml
│       ├── deployment/          # 部署模板
│       │   └── deploy-npm.yml
│       └── README.md
│
├── docs/                    # 文档目录
│   ├── README.md           # 文档导航
│   ├── INSTALL.md          # 安装指南
│   ├── USAGE.md            # 使用指南
│   ├── guides/             # 使用指南
│   │   ├── quickstart.md            # 快速开始
│   │   ├── ai-self-debug.md         # AI 自我调试
│   │   ├── testing-best-practices.md # 测试最佳实践
│   │   └── local-ci-consistency.md   # 本地 CI 一致性
│   ├── reference/          # 参考文档
│   └── examples/           # 示例
│
├── dev/                     # 开发测试目录（不会被安装）
│   ├── test-project/       # 测试项目
│   ├── test-scripts/       # 测试脚本
│   └── validation/         # 验证工具
│
└── legacy/                  # 旧版本实现（已废弃）
    ├── python/             # 旧的 Python 框架实现
    ├── old-cursor-rules/   # 旧的规则文件
    └── README.md
```

## 🎯 目录说明

### core/ - 核心内容

**用途**: 包含所有可以复用到其他项目的内容

**安装目标**:
- `core/rules/` → 目标项目的 `.cursor/rules/github-actions/`
- `core/scripts/` → 目标项目的 `scripts/toolsets/github-actions/`
- `core/templates/` → 目标项目的 `.github/templates/`

**特点**:
- ✅ 通用性：不包含项目特定的配置
- ✅ 可移植：可以直接复制使用
- ✅ 自包含：不依赖外部文件

### docs/ - 文档

**用途**: 提供完整的文档体系

**内容**:
- 安装指南
- 使用指南
- 快速开始
- 参考文档
- 示例代码

### dev/ - 开发测试

**用途**: 工具集开发过程中使用的测试内容

**内容**:
- 测试项目（如 flutter-demo）
- 测试脚本
- 验证工具

**特点**: 不会被安装到目标项目

### legacy/ - 旧版本

**用途**: 存放已废弃的旧版本实现

**内容**:
- 旧的 Python 框架（BasePipeline 等）
- 旧的规则文件
- 旧的脚本

**特点**: 仅供参考，不建议继续使用

## 📦 安装后的目标项目结构

当用户安装工具集后，目标项目会包含：

```
用户项目/
├── .cursor/
│   └── rules/
│       └── github-actions/          # 来自 core/rules/
│           ├── github-actions.mdc
│           ├── debugging.mdc
│           └── best-practices.mdc
│
├── scripts/
│   └── toolsets/
│       └── github-actions/          # 来自 core/scripts/
│           ├── ai_debug_workflow.py
│           ├── test_pipelines.py
│           └── run_pipeline.py
│
└── .github/
    └── templates/                   # 来自 core/templates/
        ├── build/
        ├── test/
        ├── release/
        └── deployment/
```

## 🔄 文件流向

```
工具集项目                    目标项目
─────────────                ─────────
core/rules/                  → .cursor/rules/github-actions/
core/scripts/                → scripts/toolsets/github-actions/
core/templates/              → .github/templates/

dev/                         ✗ 不复制
legacy/                      ✗ 不复制
docs/                        ✗ 不复制（但用户可以查看）
```

## 🎨 设计原则

### 1. 清晰的职责分离

- **core/**: 可复用的核心内容
- **dev/**: 开发测试内容
- **docs/**: 文档
- **legacy/**: 旧版本

### 2. 自描述性

- `toolset.json`: 描述工具集的元数据
- 每个目录都有 `README.md` 说明用途

### 3. 最小依赖

- 核心内容不依赖复杂的框架
- 工具脚本独立可用
- 模板可以直接使用

### 4. 易于扩展

- 添加新模板：在 `core/templates/` 添加 YAML 文件
- 添加新规则：在 `core/rules/` 添加 MDC 文件
- 添加新工具：在 `core/scripts/` 添加脚本

## 📊 文件统计

### 核心文件

- AI 规则文件: 3 个
- 工具脚本: 4 个（含安装脚本）
- Workflow 模板: 5 个

### 文档文件

- 主要文档: 3 个（INSTALL, USAGE, README）
- 指南: 4 个
- 参考文档: 待完善
- 示例: 待完善

### 代码行数（核心部分）

- AI 规则: ~800 行
- 工具脚本: ~600 行
- 模板: ~300 行
- 文档: ~2000 行

**总计**: 约 3700 行（不含旧代码）

## 🚀 维护指南

### 添加新模板

1. 在 `core/templates/` 适当的子目录创建 YAML 文件
2. 更新 `core/templates/README.md`
3. 更新 `docs/reference/templates.md`（待创建）

### 修改规则

1. 编辑 `core/rules/` 中的 MDC 文件
2. 确保规则通用，不包含项目特定内容
3. 更新版本号（`toolset.json`）

### 更新工具脚本

1. 编辑 `core/scripts/` 中的脚本
2. 确保脚本独立可用，不依赖外部模块
3. 更新 `core/scripts/README.md`

### 发布新版本

1. 更新 `CHANGELOG.md`
2. 更新 `toolset.json` 中的版本号
3. 创建 Git 标签
4. 推送到远程仓库

## 📝 注意事项

1. **core/ 目录**: 保持通用性，避免项目特定的配置
2. **docs/ 目录**: 保持文档同步，及时更新
3. **dev/ 目录**: 大文件添加到 .gitignore
4. **legacy/ 目录**: 可以考虑在未来版本删除

---

**记住**: 这个项目的核心价值在于 `core/` 目录的内容，其他都是辅助。


