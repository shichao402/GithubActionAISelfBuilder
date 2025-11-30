# Actions 目录

本目录包含所有可复用的 GitHub Actions。

## 结构

```
actions/
├── build-action/          # 构建 Action
├── release-action/        # 发布 Action
└── common/                # 通用 Actions
    ├── setup/             # 环境设置
    └── artifact/          # 产物管理
```

## 使用方式

### 1. 本地使用

```yaml
# .github/workflows/build.yml
jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - uses: ./actions/build-action
        with:
          build-command: npm run build
```

### 2. 发布后使用

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

## 开发新 Action

1. 创建目录：`mkdir -p actions/my-action/src`
2. 创建 `action.yml`
3. 创建 `package.json`
4. 实现 TypeScript 代码
5. 构建：`npm run build`

## 测试

```bash
# 使用 act 测试
act -j build

# 或直接运行
cd actions/build-action
npm run build
node dist/index.js
```


