# 使用示例

## 在其他项目中使用 Actions

### 方式 1: 本地路径引用

```yaml
# .github/workflows/build.yml
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: ./path/to/github-action-builder/actions/build-action
        with:
          build-command: npm run build
```

### 方式 2: 发布后使用

```yaml
# .github/workflows/build.yml
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: your-org/build-action@v1.0.0
        with:
          build-command: npm run build
```

## 本地测试

```bash
# 使用 act 测试
act -j build
act -j release
```

## 优势

1. ✅ **类型安全**：TypeScript 编译时检查
2. ✅ **可复用**：可以在多个项目中使用
3. ✅ **本地测试**：使用 act 完全模拟 GitHub Actions


