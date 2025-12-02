# 单元测试最佳实践规则

## 核心原则

### 1. 测试行为，而非实现细节

**❌ 错误做法**：测试实现细节
```typescript
// 错误：测试 protected 方法
test('setupEnvironment 应该执行设置命令', async () => {
  const result = await (pipeline as any).setupEnvironment();
  expect(mockExec).toHaveBeenCalled(); // 测试内部实现
});
```

**✅ 正确做法**：测试公共接口和行为
```typescript
// 正确：测试 execute() 的完整流程和结果
test('应该成功执行完整的构建流程', async () => {
  process.env.INPUT_BUILD_COMMAND = 'npm run build';
  const pipeline = new BuildPipeline();
  const result = await pipeline.execute();
  
  // 验证结果：应该成功
  expect(result.success).toBe(true);
  expect(result.exitCode).toBe(0);
  expect(result.message).toContain('构建成功');
});
```

### 2. 端到端测试优先

**原则**：优先测试公共接口（如 `execute()` 方法）的完整流程，而不是测试内部方法。

**好处**：
- 测试更稳定：重构内部实现时，测试不需要修改
- 测试更有意义：验证的是用户实际使用的功能
- 测试更全面：覆盖整个流程，包括错误处理

### 3. 基于输入输出验证

**原则**：给定输入，验证输出是否符合预期。

**测试结构**：
```typescript
test('应该正确递增 patch 版本号', async () => {
  // 1. 设置输入
  process.env.INPUT_VERSION_FILE = 'package.json';
  process.env.INPUT_VERSION_TYPE = 'patch';
  
  // 2. 执行
  const pipeline = new VersionBumpPipeline();
  const result = await pipeline.execute();
  
  // 3. 验证输出
  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty('old-version', '1.0.0');
  expect(result.data).toHaveProperty('new-version', '1.0.1');
});
```

### 4. 测试边界情况和错误场景

**必须测试的场景**：
- ✅ 正常流程（成功场景）
- ✅ 缺少必需输入
- ✅ 无效输入
- ✅ 外部依赖失败（如命令执行失败）
- ✅ 异常情况

**示例**：
```typescript
// 正常流程
test('应该成功执行完整的构建流程', async () => { ... });

// 错误场景
test('应该在环境设置失败时返回失败', async () => { ... });
test('应该在缺少版本号时返回失败', async () => { ... });
test('应该在文件不存在时返回失败', async () => { ... });
```

## 禁止的做法

### ❌ 禁止测试 protected/private 方法

**原因**：
- 这些是实现细节，不应该暴露给外部
- 重构时会导致大量测试需要修改
- 测试失去了验证公共接口的意义

**错误示例**：
```typescript
// ❌ 不要这样做
test('setupEnvironment 应该执行设置命令', async () => {
  const result = await (pipeline as any).setupEnvironment();
  expect(result).toBe(true);
});
```

### ❌ 禁止根据实现推断测试结果

**问题**：如果测试只是验证实现细节（如"调用了某个方法"），那么测试就失去了意义。

**错误示例**：
```typescript
// ❌ 不要这样做
test('应该调用 exec', async () => {
  await pipeline.execute();
  expect(mockExec).toHaveBeenCalled(); // 这只是验证实现细节
});
```

**正确做法**：验证行为结果
```typescript
// ✅ 正确做法
test('应该成功执行构建', async () => {
  const result = await pipeline.execute();
  expect(result.success).toBe(true); // 验证行为结果
});
```

### ❌ 禁止过度 Mock

**原则**：只 Mock 外部依赖（文件系统、网络、命令执行等），不要 Mock 被测试的类本身。

**正确使用 Mock**：
```typescript
// ✅ 正确：Mock 外部依赖
jest.mock('fs', () => ({ ... }));
jest.mock('child_process', () => ({ ... }));

// ❌ 错误：不要 Mock 被测试的类
jest.mock('../build-pipeline', () => ({ ... }));
```

## 测试组织

### 测试文件结构

```typescript
describe('ClassName', () => {
  describe('静态配置方法', () => {
    test('应该定义工作流输入参数', () => { ... });
    test('应该定义工作流触发条件', () => { ... });
  });

  describe('execute() - 完整流程', () => {
    test('应该成功执行完整流程', () => { ... });
    test('应该处理各种输入组合', () => { ... });
  });

  describe('错误处理', () => {
    test('应该捕获并报告异常', () => { ... });
  });
});
```

### 测试命名

**命名规范**：
- 使用中文描述测试意图（项目特定）
- 描述应该清晰表达"应该做什么"
- 格式：`应该[在什么情况下][做什么]`

**示例**：
```typescript
test('应该成功执行完整的构建流程', () => { ... });
test('应该在环境设置失败时返回失败', () => { ... });
test('应该在没有产物时也能成功（构建可能不产生产物）', () => { ... });
```

## Mock 使用规范

### Mock 初始化

**原则**：在 `jest.mock()` 内部定义 mock 函数，避免初始化顺序问题。

**正确做法**：
```typescript
// ✅ 正确：在 jest.mock 内部定义
jest.mock('fs', () => {
  const mockExistsSync = jest.fn(() => true);
  return {
    existsSync: mockExistsSync,
    // ...
  };
});

// 在测试中使用
beforeEach(() => {
  const fs = require('fs');
  fs.existsSync.mockReturnValue(true);
});
```

**错误做法**：
```typescript
// ❌ 错误：在外部定义会导致初始化顺序问题
const mockExistsSync = jest.fn();
jest.mock('fs', () => ({
  existsSync: mockExistsSync, // 可能无法访问
}));
```

### Mock 验证

**原则**：只在必要时验证 mock 调用，优先验证行为结果。

**示例**：
```typescript
// ✅ 正确：验证行为结果
test('应该成功执行构建', async () => {
  const result = await pipeline.execute();
  expect(result.success).toBe(true);
  expect(result.data).toHaveProperty('artifact-path');
});

// ✅ 必要时验证 mock（如验证文件被写入）
test('应该更新版本号文件', async () => {
  const result = await pipeline.execute();
  expect(result.success).toBe(true);
  
  const fs = require('fs');
  expect(fs.writeFileSync).toHaveBeenCalled();
  const writtenContent = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
  expect(writtenContent.version).toBe('1.0.1');
});
```

## 覆盖率目标

### 覆盖率指标

- **语句覆盖率（Statements）**：目标 80%+
- **分支覆盖率（Branches）**：目标 70%+
- **函数覆盖率（Functions）**：目标 75%+
- **行覆盖率（Lines）**：目标 80%+

### 优先级

1. **高优先级**：核心业务逻辑（Pipeline 的 execute 方法）
2. **中优先级**：配置方法、工具函数
3. **低优先级**：边缘情况、错误处理

## 示例：好的测试 vs 坏的测试

### ❌ 坏的测试（测试实现细节）

```typescript
test('setupEnvironment 应该执行设置命令', async () => {
  const pipeline = new BuildPipeline({ 'setup-command': 'npm install' });
  const result = await (pipeline as any).setupEnvironment();
  
  expect(result).toBe(true);
  expect(mockExec).toHaveBeenCalled(); // ❌ 测试实现细节
});
```

**问题**：
- 测试了 protected 方法
- 验证了实现细节（调用了 exec）
- 如果重构内部实现，测试会失败

### ✅ 好的测试（测试行为）

```typescript
test('应该成功执行完整的构建流程', async () => {
  process.env.INPUT_SETUP_COMMAND = 'npm install';
  process.env.INPUT_BUILD_COMMAND = 'npm run build';
  
  const pipeline = new BuildPipeline();
  const result = await pipeline.execute();
  
  // 验证行为结果
  expect(result.success).toBe(true);
  expect(result.exitCode).toBe(0);
  expect(result.message).toContain('构建成功');
  expect(result.data).toHaveProperty('build-status', 'success');
});
```

**优点**：
- 测试公共接口
- 验证行为结果
- 测试完整流程
- 重构时更稳定

## 总结

### 核心规则

1. **测试行为，而非实现**：验证输出和行为，不验证内部实现
2. **端到端优先**：优先测试公共接口的完整流程
3. **基于输入输出**：给定输入，验证输出
4. **覆盖边界情况**：测试成功、失败、错误等场景
5. **避免测试实现细节**：不测试 protected/private 方法

### 测试的价值

好的单元测试应该：
- ✅ 验证功能是否正确
- ✅ 在重构时提供信心
- ✅ 作为代码文档
- ✅ 捕获回归问题

坏的单元测试会：
- ❌ 测试实现细节，失去意义
- ❌ 在重构时频繁失败
- ❌ 增加维护成本
- ❌ 提供虚假的安全感

## 参考

- [Jest 文档](https://jestjs.io/docs/getting-started)
- [测试驱动开发（TDD）](https://en.wikipedia.org/wiki/Test-driven_development)
- [行为驱动开发（BDD）](https://en.wikipedia.org/wiki/Behavior-driven_development)


