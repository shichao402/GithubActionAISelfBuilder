# 使用示例

## 🎯 场景 1: 完整的自动调试

### 问题
GitHub Actions 工作流失败了，需要找出原因并修复。

### 传统方式（复杂）

```bash
# 1. 手动触发
gh workflow run build.yml --ref main

# 2. 等待
sleep 30

# 3. 查看状态
gh run list --limit 1

# 4. 获取 run ID 并查看日志
gh run view 123456789 --log-failed

# 5. 手动分析错误...
# 6. 修复代码
# 7. 重复 1-6
```

### 使用 gh-action-debug（简单）

```bash
# 一个命令完成所有步骤
gh-action-debug workflow debug .github/workflows/build.yml main --output json
```

**输出**：
```json
{
  "success": false,
  "run_id": 123456789,
  "run_url": "https://github.com/user/repo/actions/runs/123456789",
  "status": "failure",
  "duration": 45,
  "errors": [
    {
      "job": "build",
      "step": "Install dependencies",
      "error_type": "missing_dependency",
      "message": "Cannot find module 'express'",
      "suggestions": [
        "Add 'express' to package.json dependencies",
        "Run: npm install express --save",
        "Check if package-lock.json is committed"
      ]
    }
  ],
  "suggestions": [
    "Add 'express' to package.json",
    "Run: npm install express --save"
  ]
}
```

## 🤖 AI 使用示例

### 场景：AI 自动修复工作流错误

```
用户: "调试 build.yml 工作流"

AI 执行:
1. 推送最新代码（如果有修改）
2. 运行: gh-action-debug workflow debug .github/workflows/build.yml main --output json
3. 解析 JSON 输出
4. 发现: missing_dependency 错误，缺少 'express'
5. 应用建议:
   - 在 package.json 添加 express 依赖
   - 运行: npm install express --save
6. 推送修复
7. 重新运行调试命令
8. 确认: success: true
9. 完成！

AI 回复:
"✅ 工作流已修复！问题是缺少 express 依赖，已添加到 package.json 并验证通过。"
```

## 📝 场景 2: 带参数的工作流

### 发布新版本

```bash
# 触发 release 工作流
gh-action-debug workflow debug .github/workflows/release.yml main \
  --input version=1.0.0 \
  --input prerelease=false \
  --output json
```

**输出**（成功）：
```json
{
  "success": true,
  "run_id": 123456790,
  "run_url": "https://github.com/user/repo/actions/runs/123456790",
  "status": "success",
  "duration": 180,
  "jobs": [
    {
      "name": "build",
      "status": "completed",
      "conclusion": "success",
      "duration": 90
    },
    {
      "name": "release",
      "status": "completed",
      "conclusion": "success",
      "duration": 90
    }
  ],
  "errors": [],
  "suggestions": []
}
```

## 🔍 场景 3: 批量测试多个工作流

```bash
# 列出所有工作流
gh-action-debug workflow list

# 输出：
# 📋 列出所有工作流...
# 
# 找到 3 个工作流:
# 
# 1. Build and Test
#    路径: .github/workflows/build.yml
# 
# 2. Release
#    路径: .github/workflows/release.yml
# 
# 3. Deploy
#    路径: .github/workflows/deploy.yml

# 测试每个工作流
for workflow in build.yml test.yml deploy.yml; do
  echo "Testing $workflow..."
  gh-action-debug workflow debug .github/workflows/$workflow main --output json
done
```

## 💡 场景 4: Human 输出（给人类看）

```bash
# 默认输出格式（人类可读）
gh-action-debug workflow debug .github/workflows/build.yml main
```

**输出**：
```
==============================================
  GitHub Actions 调试结果
==============================================

🆔 Run ID: 123456789
🔗 URL: https://github.com/user/repo/actions/runs/123456789
⏱️  Duration: 45s

❌ 状态: 失败

📋 任务状态:
  ❌ build (45s)

❌ 错误详情:

1. 任务: build / 步骤: Install dependencies
   类型: missing_dependency
   消息: Cannot find module 'express'
   建议:
     • Add 'express' to package.json dependencies
     • Run: npm install express --save
     • Check if package-lock.json is committed

💡 修复建议:
  • Add 'express' to package.json
  • Run: npm install express --save

==============================================
```

## 🎨 场景 5: 详细输出（调试模式）

```bash
# 使用 --verbose 查看详细信息
gh-action-debug workflow debug .github/workflows/build.yml main --verbose
```

**输出**：
```
✅ 配置加载成功
   仓库: user/repo
   输出格式: human

🚀 触发工作流: .github/workflows/build.yml (ref: main)
✅ 工作流已触发
🆔 Run ID: 123456789
🔗 URL: https://github.com/user/repo/actions/runs/123456789

⏳ 监控工作流执行状态 (Run ID: 123456789)...
  状态: queued
    ⏸️ build: queued
  状态: in_progress
    🔄 build: in_progress

❌ 工作流执行失败
总耗时: 45s

任务状态:
  ❌ build (45s)

📋 收集失败日志...
🔍 分析错误...

❌ 错误详情:

任务: build
步骤: Install dependencies
类型: missing_dependency
消息: Cannot find module 'express'
建议:
  • Add 'express' to package.json dependencies
  • Run: npm install express --save
  • Check if package-lock.json is committed

==============================================
  GitHub Actions 调试结果
==============================================
...
```

## 🚀 场景 6: 快速触发（不等待结果）

```bash
# 只触发，不等待
gh-action-debug workflow trigger .github/workflows/build.yml main

# 输出：
# 🚀 触发工作流: .github/workflows/build.yml (ref: main)
# ✅ Workflow triggered successfully, run ID: 123456789
# 🔗 URL: https://github.com/user/repo/actions/runs/123456789
# 🆔 Run ID: 123456789
```

## 🔧 配置文件示例

创建 `~/.gh-action-debug.yaml`:

```yaml
github:
  # Token 可选，优先使用 gh CLI 的认证
  # token: ghp_xxxxxxxxxxxx
  
  # Owner 和 Repo 可选，会自动从 git 仓库获取
  # owner: your-username
  # repo: your-repo

output:
  # 默认输出格式
  format: json  # 或 human

debug:
  # 最长等待时间（秒）
  timeout: 1800  # 30 分钟
  
  # 轮询间隔（秒）
  poll_interval: 3
```

## 📊 错误类型和建议

工具会自动识别以下常见错误：

| 错误类型 | 检测模式 | 建议 |
|---------|---------|------|
| `missing_dependency` | Cannot find module 'xxx' | 添加到 package.json |
| `missing_python_module` | ModuleNotFoundError | 添加到 requirements.txt |
| `permission_error` | permission denied | 检查 workflow permissions |
| `auth_error` | 401 Unauthorized | 检查 GITHUB_TOKEN |
| `file_not_found` | No such file | 确认文件已提交 |
| `command_not_found` | command not found | 安装缺失的工具 |
| `test_failure` | Tests failed | 检查测试日志 |
| `build_error` | build failed | 修复编译错误 |
| `network_error` | ETIMEDOUT | 检查网络连接 |
| `docker_error` | docker: Error | 检查 Docker 配置 |

## 🎯 最佳实践

### 1. 使用 JSON 输出给 AI

```bash
# AI 脚本中
result=$(gh-action-debug workflow debug .github/workflows/build.yml main --output json)
echo "$result" | jq '.suggestions[]'
```

### 2. 使用 Human 输出给人类

```bash
# 交互式使用
gh-action-debug workflow debug .github/workflows/build.yml main
```

### 3. 自动化脚本

```bash
#!/bin/bash
set -e

# 推送代码
git push

# 等待一会儿
sleep 3

# 调试工作流
result=$(gh-action-debug workflow debug .github/workflows/build.yml main --output json)

# 检查结果
if echo "$result" | jq -e '.success' > /dev/null; then
    echo "✅ 工作流成功！"
    exit 0
else
    echo "❌ 工作流失败"
    echo "$result" | jq '.suggestions[]'
    exit 1
fi
```

## 💬 AI 集成示例

### Python 脚本

```python
import subprocess
import json

def debug_workflow(workflow_file, ref='main', inputs=None):
    """使用 gh-action-debug 调试工作流"""
    cmd = [
        'gh-action-debug', 'workflow', 'debug',
        workflow_file, ref,
        '--output', 'json'
    ]
    
    # 添加输入参数
    if inputs:
        for key, value in inputs.items():
            cmd.extend(['--input', f'{key}={value}'])
    
    # 运行命令
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # 解析 JSON
    data = json.loads(result.stdout)
    
    return data

# 使用
result = debug_workflow('.github/workflows/build.yml')

if not result['success']:
    print("❌ 工作流失败")
    for error in result['errors']:
        print(f"  {error['step']}: {error['message']}")
    
    print("\n💡 建议:")
    for suggestion in result['suggestions']:
        print(f"  • {suggestion}")
else:
    print("✅ 工作流成功！")
```

---

**核心优势**: 一个命令完成所有步骤，返回结构化的结果，让 AI 和自动化脚本更容易处理！


