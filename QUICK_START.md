# 快速开始指南

## 安装

### 1. 安装 Node.js

```bash
# 检查 Node.js 版本（需要 18+）
node --version

# 如果未安装，请访问 https://nodejs.org/
```

### 2. 安装 act（本地测试工具）

**macOS**:
```bash
brew install act
```

**Windows**:
```bash
choco install act-cli
```

**Linux**:
```bash
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### 3. 安装项目依赖

```bash
npm install
```

### 4. 构建 Actions

```bash
npm run build
```

## 本地测试

### 使用 act 测试工作流

```bash
# 列出所有工作流
npm run act:list

# 运行构建工作流
npm run act:build

# 运行发布工作流
npm run act:release
```

## 在其他项目中使用

### 方式 1: 本地路径引用

```yaml
# .github/workflows/build.yml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ./path/to/github-action-builder/actions/build-action
        with:
          build-command: npm run build
          artifact-path: dist/**
```

### 方式 2: 发布后使用

```yaml
# .github/workflows/build.yml
name: Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: your-org/build-action@v1.0.0
        with:
          build-command: npm run build
          artifact-path: dist/**
```

## 创建自定义 Action

### 1. 创建目录结构

```bash
mkdir -p actions/my-action/src
```

### 2. 创建 action.yml

```yaml
name: 'My Action'
description: 'My custom action'
inputs:
  my-input:
    description: 'My input'
    required: true
runs:
  using: 'node20'
  main: 'dist/index.js'
```

### 3. 创建 package.json

```json
{
  "name": "my-action",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "ncc build src/index.ts -o dist"
  },
  "dependencies": {
    "@actions/core": "^1.10.1"
  }
}
```

### 4. 实现 TypeScript 代码

```typescript
// src/index.ts
import * as core from '@actions/core'

async function run() {
  const input = core.getInput('my-input')
  core.info(`Input: ${input}`)
}

run()
```

### 5. 构建

```bash
cd actions/my-action
npm install
npm run build
```

## 优势

1. ✅ **TypeScript 类型安全**：编译时检查
2. ✅ **使用 act 本地测试**：完全模拟 GitHub Actions
3. ✅ **可复用 Actions**：可以发布到 GitHub Marketplace
4. ✅ **跨平台构建**：使用 GitHub Actions 的真实 runner


