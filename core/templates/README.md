# GitHub Actions 模板库

这个目录包含常用的 GitHub Actions 工作流模板。

## 📋 模板分类

### build/ - 构建模板

#### nodejs-build.yml
Node.js 项目的构建和测试工作流。

**特性**：
- 多平台支持（Ubuntu, Windows, macOS）
- 多版本测试（Node 16, 18, 20）
- 自动缓存依赖
- 代码检查和测试
- 构建产物上传

**适用项目**：Node.js, TypeScript, React, Vue, Angular 等

#### python-build.yml
Python 项目的构建和测试工作流。

**特性**：
- 多平台支持
- 多版本测试（Python 3.8-3.11）
- Pip 缓存
- Flake8 代码检查
- pytest 测试和覆盖率

**适用项目**：Python, Django, Flask 等

#### flutter-build.yml
Flutter 项目的构建工作流。

**特性**：
- 多平台支持（Android, iOS, Web, Windows, Linux, macOS）
- 自动依赖管理
- 代码分析和测试
- 构建产物上传
- 支持手动触发和自定义参数

**适用项目**：Flutter, Dart 移动应用

### test/ - 测试模板

#### pytest.yml
Python 项目的详细测试工作流。

**特性**：
- pytest 测试
- 覆盖率报告
- HTML 测试报告
- PR 评论覆盖率

**适用项目**：Python 项目

### release/ - 发布模板

#### github-release.yml
创建 GitHub Release 的工作流。

**特性**：
- 自动构建产物
- 生成 changelog
- 创建 Release
- 上传构建产物

**适用项目**：需要发布到 GitHub Releases 的项目

### deployment/ - 部署模板

#### deploy-npm.yml
发布到 npm 的工作流。

**特性**：
- 自动发布到 npm
- 支持不同的标签（latest, next, beta）
- provenance 支持
- 发布前测试

**适用项目**：npm 包

## 🚀 使用方式

### 1. 复制模板

```bash
# 复制到项目的 .github/workflows/ 目录
cp .github/templates/build/nodejs-build.yml .github/workflows/

# 或者使用符号链接（不推荐，不便于自定义）
ln -s .github/templates/build/nodejs-build.yml .github/workflows/build.yml
```

### 2. 自定义配置

根据项目需求修改模板：

```yaml
# 修改 Node.js 版本
env:
  NODE_VERSION: '20'  # 从 18 改为 20

# 修改测试矩阵
strategy:
  matrix:
    os: [ubuntu-latest]  # 只在 Linux 上测试
    node: [20]           # 只测试 Node 20
```

### 3. 添加项目特定的步骤

```yaml
steps:
  # ... 现有步骤
  
  # 添加自定义步骤
  - name: Custom build step
    run: npm run custom-build
  
  - name: Deploy to staging
    if: github.ref == 'refs/heads/develop'
    run: npm run deploy:staging
```

## 📝 模板说明

### 通用配置

所有模板都包含以下通用配置：

1. **触发条件**：
   - push 到主分支
   - PR 到主分支
   - 手动触发（workflow_dispatch）

2. **缓存策略**：
   - 使用 setup-* actions 的内置缓存
   - 加快依赖安装速度

3. **错误处理**：
   - fail-fast: false（不因单个失败停止所有任务）
   - continue-on-error（可选，特定步骤）

4. **产物管理**：
   - 上传构建产物
   - 保留期限（默认 7 天）

### 自定义建议

1. **修改触发条件**：
   ```yaml
   on:
     push:
       branches: [main, develop, feature/*]  # 添加 feature 分支
   ```

2. **调整测试矩阵**：
   ```yaml
   strategy:
     matrix:
       os: [ubuntu-latest]  # 只在 Linux 测试，节省时间
       node: [18]           # 只测试一个版本
   ```

3. **添加环境变量**：
   ```yaml
   env:
     API_URL: https://api.example.com
     BUILD_ENV: production
   ```

4. **使用 secrets**：
   ```yaml
   env:
     API_KEY: ${{ secrets.API_KEY }}
     DATABASE_URL: ${{ secrets.DATABASE_URL }}
   ```

## 🎯 最佳实践

1. **从简单开始**：先使用基础模板，逐步添加功能
2. **测试本地**：确保本地能构建，CI 才能构建
3. **使用缓存**：合理使用缓存加快构建速度
4. **最小权限**：只授予必要的权限
5. **清晰命名**：工作流和步骤使用描述性名称
6. **添加注释**：解释特殊配置的原因

## 🔧 调试

如果工作流失败，使用调试工具：

```bash
# 使用 AI 调试脚本
npm run ai-debug -- .github/workflows/build.yml main

# 批量测试
npm run test-pipeline -- --all --trigger --watch
```

## 📚 参考

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [工作流语法](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Actions Marketplace](https://github.com/marketplace?type=actions)

