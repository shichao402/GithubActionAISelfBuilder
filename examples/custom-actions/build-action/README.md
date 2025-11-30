# Build Action

一个标准化的构建流程 GitHub Action，可以封装复杂的构建逻辑。

## 功能

- ✅ 环境设置（可选）
- ✅ 执行构建命令
- ✅ 自动上传构建产物
- ✅ 类型安全（TypeScript）

## 使用方法

```yaml
- uses: your-org/build-action@v1
  with:
    setup-command: npm ci
    build-command: npm run build
    artifact-path: dist/**
    build-type: release
    upload-artifacts: true
```

## 输入参数

| 参数 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `build-command` | ✅ | - | 构建命令 |
| `setup-command` | ❌ | '' | 环境设置命令 |
| `artifact-path` | ❌ | `artifacts/**` | 构建产物路径 |
| `build-type` | ❌ | `release` | 构建类型 |
| `upload-artifacts` | ❌ | `true` | 是否上传产物 |

## 输出参数

| 参数 | 说明 |
|------|------|
| `build-status` | 构建状态（success/failed） |
| `artifact-path` | 产物路径 |
| `build-type` | 构建类型 |

## 开发

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

## 发布

1. 构建 Action：
   ```bash
   npm run package
   ```

2. 提交到仓库：
   ```bash
   git add dist/
   git commit -m "Release v1.0.0"
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. 在其他项目中使用：
   ```yaml
   - uses: your-org/build-action@v1.0.0
   ```


