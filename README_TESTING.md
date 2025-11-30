# 测试指南

## 概述

本项目包含完整的测试套件，包括单元测试和 GitHub Actions 集成测试。

## 测试结构

```
├── src/__tests__/          # 单元测试
│   ├── base-pipeline.test.ts
│   ├── workflow-config.test.ts
│   ├── workflow-manager.test.ts
│   └── scaffold.test.ts
├── .github/workflows/
│   ├── test.yml            # 单元测试和基础集成测试
│   └── test-real.yml       # 真实环境集成测试
└── jest.config.js          # Jest 配置
```

## 运行测试

### 本地运行

```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### GitHub Actions 运行

测试会在以下情况自动运行：
- Push 到 main 或 develop 分支
- Pull Request
- 手动触发 workflow_dispatch

## 测试类型

### 1. 单元测试

**位置**: `src/__tests__/`

**覆盖范围**:
- ✅ BasePipeline 基类
- ✅ WorkflowConfig 配置构建器
- ✅ WorkflowManager 工作流管理器
- ✅ Scaffold 脚手架工具

**运行**:
```bash
npm test
```

### 2. 集成测试

**位置**: `.github/workflows/test.yml`

**测试内容**:
- ✅ 单元测试执行
- ✅ 代码覆盖率
- ✅ Action 构建和加载
- ✅ 脚手架工具功能

### 3. 真实环境测试

**位置**: `.github/workflows/test-real.yml`

**测试内容**:
- ✅ 脚手架生成真实 workflow YAML
- ✅ WorkflowManager 与 GitHub CLI 集成
- ✅ Build Action 真实执行
- ✅ Release Action 真实执行
- ✅ Debug Action 真实执行
- ✅ Pipeline 真实执行

**运行**:
```bash
# 在 GitHub Actions 中手动触发
gh workflow run test-real.yml
```

## 测试场景

### 场景 1: BasePipeline 测试

```typescript
// src/__tests__/base-pipeline.test.ts
describe('BasePipeline', () => {
  test('应该正确初始化', () => {
    const pipeline = new TestPipeline({ 'test-input': 'value' });
    expect(pipeline).toBeInstanceOf(BasePipeline);
  });

  test('execute 应该返回成功结果', async () => {
    const pipeline = new TestPipeline({ 'test-input': 'value' });
    const result = await pipeline.execute();
    expect(result.success).toBe(true);
  });
});
```

### 场景 2: WorkflowConfig 测试

```typescript
// src/__tests__/workflow-config.test.ts
describe('WorkflowConfig', () => {
  test('addInput 应该添加输入参数', () => {
    const config = createWorkflowConfig();
    config.addInput('version', 'Version', true);
    const dict = config.toDict();
    expect(dict.inputs).toHaveProperty('version');
  });
});
```

### 场景 3: 脚手架生成测试

```bash
# 在 GitHub Actions 中测试
# .github/workflows/test-real.yml
- name: Generate workflow YAML
  run: npm run scaffold -- --pipeline TestPipeline --output test.yml
```

### 场景 4: Pipeline 执行测试

```yaml
# .github/workflows/test-real.yml
- name: Test Build Pipeline
  run: node -e "const { BuildPipeline } = require('./dist/src/pipelines/build-pipeline'); const pipeline = new BuildPipeline(); pipeline.run();"
  env:
    INPUT_BUILD_COMMAND: "echo Test"
```

## 覆盖率目标

- **单元测试覆盖率**: > 80%
- **集成测试覆盖率**: 所有核心功能

## 添加新测试

### 1. 添加单元测试

```typescript
// src/__tests__/new-feature.test.ts
import { NewFeature } from '../new-feature';

describe('NewFeature', () => {
  test('应该工作正常', () => {
    const feature = new NewFeature();
    expect(feature.doSomething()).toBe(true);
  });
});
```

### 2. 添加集成测试

在 `.github/workflows/test-real.yml` 中添加新的 job：

```yaml
test-new-feature:
  name: Test New Feature
  runs-on: ubuntu-latest
  steps:
    - name: Test
      run: npm test -- new-feature
```

## 持续集成

所有测试都会在以下情况自动运行：

1. **Push 到主分支** - 运行所有测试
2. **Pull Request** - 运行所有测试
3. **手动触发** - 可以选择特定测试场景

## 测试最佳实践

1. ✅ **每个功能都要有测试**
2. ✅ **测试应该独立** - 不依赖其他测试
3. ✅ **使用描述性的测试名称**
4. ✅ **Mock 外部依赖** - GitHub CLI、文件系统等
5. ✅ **测试边界情况** - 错误处理、空值等

## 故障排查

### 测试失败

1. 检查本地环境：
   ```bash
   node --version  # 应该是 18+
   npm --version
   ```

2. 清理并重新安装：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. 检查测试输出：
   ```bash
   npm test -- --verbose
   ```

### GitHub Actions 测试失败

1. 查看 workflow 日志
2. 检查 secrets 配置（GITHUB_TOKEN）
3. 验证 GitHub CLI 认证

## 相关文档

- [Jest 文档](https://jestjs.io/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

