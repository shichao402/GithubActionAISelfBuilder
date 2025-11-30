# 测试 Cursor 规则排除功能

## 测试目标

验证 `.cursorignore` 文件能否正确排除 `ProjectOnly/` 目录下的规则文件，确保：
- ✅ 共享规则（`rules.mdc`, `scripts-usage.mdc`）被 Cursor 加载
- ❌ 项目特有规则（`ProjectOnly/` 目录）被 Cursor 忽略

## 测试方法

### 方法 1: 使用测试脚本（推荐）

#### 步骤 1: 测试当前项目（本项目）

```bash
# 测试本项目（应该显示所有规则，包括 ProjectOnly）
npm run test:cursor-rules
# 或
ts-node scripts/test-cursor-rules.ts
```

**预期结果**：
- 找到所有规则文件（包括 ProjectOnly）
- `.cursorignore` 文件可能不存在（本项目不需要排除）
- 这是正常的，因为本项目需要所有规则

#### 步骤 2: 创建测试父项目

```bash
# 创建测试目录
mkdir -p /tmp/test-parent-project
cd /tmp/test-parent-project

# 初始化项目
npm init -y

# 创建子目录（模拟 Git Submodule）
mkdir -p Tools/GithubActionAISelfBuilder

# 复制本项目到子目录（或使用符号链接）
# 注意：实际使用时应该是 Git Submodule
cp -r <本项目路径> Tools/GithubActionAISelfBuilder/
# 或使用符号链接（更轻量）：
# ln -s <本项目路径> Tools/GithubActionAISelfBuilder
```

#### 步骤 3: 配置 .cursorignore

```bash
# 在测试父项目根目录创建 .cursorignore
cat > .cursorignore << 'EOF'
# 排除本项目特有的规则文件
Tools/GithubActionAISelfBuilder/.cursor/rules/ProjectOnly/
EOF
```

#### 步骤 4: 运行测试脚本

```bash
# 在测试父项目中运行测试脚本
cd /tmp/test-parent-project
ts-node Tools/GithubActionAISelfBuilder/scripts/test-cursor-rules.ts .
```

**预期结果**：
- ✅ 找到共享规则文件
- ✅ 找到项目特有规则文件
- ✅ `.cursorignore` 文件存在
- ✅ 所有项目特有规则都被正确排除
- ✅ 测试状态：PASS

#### 步骤 5: 使用注入脚本测试

```bash
# 使用注入脚本自动配置
cd Tools/GithubActionAISelfBuilder
npm run inject ..
```

然后再次运行测试脚本验证。

### 方法 2: 手动测试

#### 步骤 1: 在 Cursor 中打开测试父项目

1. 打开 Cursor
2. 打开测试父项目目录
3. 等待 Cursor 加载规则

#### 步骤 2: 检查规则列表

1. 打开 Cursor 设置
2. 找到规则（Rules）相关设置
3. 查看已加载的规则文件列表

**验证点**：
- ✅ 应该看到：`rules.mdc`, `scripts-usage.mdc`
- ❌ 不应该看到：`ProjectOnly/` 目录下的任何规则

#### 步骤 3: 功能测试

**测试共享规则是否生效**：
1. 尝试使用共享规则中的功能（如创建 Pipeline）
2. 验证 AI 助手是否遵循共享规则

**测试项目特有规则是否被排除**：
1. 尝试执行 Git 推送操作
2. 验证 AI 助手是否**不会**强制使用本项目的 Git 推送脚本
3. 如果项目特有规则被正确排除，AI 应该使用标准的 Git 命令

### 方法 3: 使用注入脚本测试

```bash
# 创建测试父项目
mkdir -p /tmp/test-parent-project
cd /tmp/test-parent-project
npm init -y

# 创建子目录结构
mkdir -p Tools
# 假设本项目在 Tools/GithubActionAISelfBuilder
# 实际使用时应该是 Git Submodule

# 运行注入脚本
cd <本项目路径>
npm run inject /tmp/test-parent-project

# 验证结果
cd /tmp/test-parent-project
cat .cursorignore
ls -la .cursor/rules/
```

## 测试检查清单

- [ ] 测试脚本能正确识别所有规则文件
- [ ] 测试脚本能正确识别 `.cursorignore` 文件
- [ ] 测试脚本能正确验证排除规则
- [ ] `.cursorignore` 文件格式正确
- [ ] 排除规则路径正确（相对于项目根目录）
- [ ] Cursor 中看不到 `ProjectOnly/` 目录下的规则
- [ ] Cursor 中能看到共享规则
- [ ] 共享规则功能正常
- [ ] 项目特有规则不会干扰父项目

## 常见问题排查

### 问题 1: 测试脚本显示规则未被排除

**可能原因**：
1. `.cursorignore` 文件路径不正确
2. 排除规则格式错误
3. 路径分隔符问题（Windows vs Unix）

**解决方案**：
1. 检查 `.cursorignore` 文件内容
2. 确保路径使用正斜杠 `/`（跨平台兼容）
3. 使用相对路径（相对于项目根目录）

### 问题 2: Cursor 仍然加载了 ProjectOnly 规则

**可能原因**：
1. Cursor 缓存未更新
2. `.cursorignore` 文件未被识别
3. 规则文件路径不在排除范围内

**解决方案**：
1. 重启 Cursor
2. 检查 `.cursorignore` 文件位置（应在项目根目录）
3. 验证排除规则路径是否正确
4. 检查 Cursor 的规则加载日志

### 问题 3: 注入脚本失败

**可能原因**：
1. 父项目路径不正确
2. 权限问题
3. 路径包含特殊字符

**解决方案**：
1. 使用绝对路径
2. 检查文件权限
3. 确保路径不包含特殊字符

## 自动化测试

可以创建一个 GitHub Action 工作流来自动测试：

```yaml
name: Test Cursor Rules

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Test cursor rules (current project)
        run: npm run test:cursor-rules
      
      - name: Create test parent project
        run: |
          mkdir -p /tmp/test-parent
          cd /tmp/test-parent
          npm init -y
          mkdir -p Tools
          cp -r ${{ github.workspace }} Tools/GithubActionAISelfBuilder
      
      - name: Configure .cursorignore
        run: |
          echo "Tools/GithubActionAISelfBuilder/.cursor/rules/ProjectOnly/" > /tmp/test-parent/.cursorignore
      
      - name: Test cursor rules (parent project)
        run: |
          cd /tmp/test-parent
          ts-node Tools/GithubActionAISelfBuilder/scripts/test-cursor-rules.ts .
```

## 相关文件

- `scripts/test-cursor-rules.ts` - 测试脚本
- `scripts/inject-to-parent.ts` - 注入脚本
- `docs/cursor-rules-management.md` - 规则管理文档
- `.cursorignore.example` - `.cursorignore` 文件模板


