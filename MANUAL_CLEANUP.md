# 手动清理清单

由于终端问题，以下文件需要手动清理（或运行 `bash cleanup.sh`）：

## 🗑️ 需要移到 legacy/ 的文件

### 1. 旧文档

```bash
mkdir -p legacy/docs
mv docs/python-example.py legacy/docs/
mv docs/config-projectonly.md legacy/docs/
mv docs/parent-project-pipelines.md legacy/docs/
mv docs/modularity.md legacy/docs/
mv docs/type-safety-vs-simplicity.md legacy/docs/
mv docs/technical-solutions.md legacy/docs/
mv docs/why-gh-token-required.md legacy/docs/
mv docs/github-actions-authentication.md legacy/docs/
mv docs/github-api-client-abstraction.md legacy/docs/
mv docs/local-build-script-unification.md legacy/docs/
mv docs/USAGE_GUIDE.md legacy/docs/
```

### 2. 旧配置

```bash
# config/ 目录已经存在，移到 legacy
mv config legacy/
```

### 3. 旧脚本

```bash
# scripts/tools/ 已存在，移到 legacy
mv scripts/tools legacy/
mv scripts/README.md legacy/scripts-readme.md
```

## 🧹 或者直接运行清理脚本

```bash
bash cleanup.sh
```

## ✅ 清理后的目录结构

```
GithubActionAISelfBuilder/
├── core/                         # ✅ 核心内容
│   ├── rules/                   # AI 规则
│   ├── scripts/                 # 工具脚本
│   ├── templates/               # Workflow 模板
│   └── tools/go/                # Go 调试工具
│
├── docs/                         # ✅ 文档（已清理）
│   ├── INSTALL.md
│   ├── USAGE.md
│   ├── README.md
│   └── guides/
│
├── legacy/                       # ✅ 旧版本归档
│   ├── python/                  # 旧 Python 实现
│   ├── old-cursor-rules/        # 旧规则文件
│   ├── docs/                    # 旧文档
│   ├── config/                  # 旧配置
│   ├── tools/                   # 旧工具脚本
│   └── scripts-readme.md        # 旧 README
│
├── dev/                          # ✅ 开发测试
│   ├── test-project/
│   └── README.md
│
├── README.md                     # ✅ 项目说明
├── toolset.json                  # ✅ 工具集描述
├── CHANGELOG.md                  # ✅ 更新日志
├── PROJECT_STRUCTURE.md          # ✅ 结构说明
├── QUICK_START.md                # ✅ 快速开始
├── FINAL_SUMMARY.md              # ✅ 最终总结
├── END_TO_END_TEST.md            # ✅ 测试计划
├── COMPLETION_CHECKLIST.md       # ✅ 完成检查清单
└── .gitignore                    # ✅ 已更新
```

## 🎯 验证清理结果

清理后验证：

```bash
# 检查 core/ 目录（应该完整）
ls -la core/rules/
ls -la core/scripts/
ls -la core/templates/
ls -la core/tools/go/

# 检查 docs/ 目录（应该只剩新文档）
ls docs/

# 检查 legacy/ 目录（应该包含所有旧文件）
ls legacy/
```

## 📝 注意事项

1. **不要删除 legacy/**
   - 保留作为历史参考
   - Git 历史中已经记录

2. **保留 Python 脚本备选**
   - `core/scripts/` 中的 Python 脚本保留
   - 作为 Go 工具的备选方案

3. **更新 .gitignore**
   - 已添加 Go 构建产物
   - 已添加测试覆盖率文件

## ✅ 完成

执行完清理后，项目结构就清晰整洁了！

---

**运行 `bash cleanup.sh` 或手动执行上述命令即可完成清理。**

