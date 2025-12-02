# Dev - 开发和测试目录

这个目录包含工具集开发过程中使用的测试项目和验证脚本。

**重要**: 此目录的内容**不会**被安装到目标项目，仅用于本工具集的开发和测试。

## 📁 目录结构

```
dev/
├── test-project/      # 测试项目（如 flutter-demo）
├── test-scripts/      # 测试脚本
└── validation/        # 验证工具
```

## 🎯 用途

### test-project/
存放用于测试工具集功能的示例项目。

**示例**：
- `flutter-demo/` - Flutter 项目测试
- `nodejs-demo/` - Node.js 项目测试
- `python-demo/` - Python 项目测试

### test-scripts/
存放测试工具集功能的脚本。

**示例**：
- 测试规则文件是否正确
- 测试工具脚本是否正常工作
- 测试模板生成是否符合预期

### validation/
存放验证工具集质量的脚本。

**示例**：
- YAML 语法验证
- 规则文件格式检查
- 链接完整性检查

## 🚀 使用方式

### 测试工具集

```bash
# 在测试项目中安装工具集
cd dev/test-project/flutter-demo
bash ../../../core/scripts/install.sh

# 验证安装结果
ls -la .cursor/rules/github-actions/
ls -la scripts/toolsets/github-actions/

# 测试工具脚本
npm run ai-debug -- .github/workflows/build.yml main
```

### 运行验证

```bash
# 验证所有模板的 YAML 语法
python dev/validation/validate_templates.py

# 检查规则文件格式
python dev/validation/check_rules.py
```

## 📝 开发工作流

1. **修改工具集内容**（core/ 目录）
2. **在 dev/test-project 中测试**
3. **运行验证脚本**
4. **确认无误后提交**

## ⚠️ 注意事项

- dev/ 目录不会被复制到目标项目
- 测试项目可能包含大量文件，建议添加到 .gitignore
- 验证脚本应该自动化，便于 CI/CD 集成

