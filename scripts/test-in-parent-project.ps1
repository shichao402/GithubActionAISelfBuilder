# 测试脚本：在模拟的父项目中测试 Cursor 规则排除功能（PowerShell 版本）
#
# 使用方法：
#   .\scripts\test-in-parent-project.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$TestParentDir = "$env:TEMP\test-cursor-rules-parent"

Write-Host "🧪 创建测试父项目..." -ForegroundColor Cyan
Write-Host "   测试目录: $TestParentDir" -ForegroundColor Gray
Write-Host ""

# 清理旧的测试目录
if (Test-Path $TestParentDir) {
    Write-Host "清理旧的测试目录..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $TestParentDir
}

# 创建测试父项目结构
Write-Host "1️⃣  初始化测试父项目..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $TestParentDir | Out-Null
Set-Location $TestParentDir

# 初始化 npm 项目
npm init -y | Out-Null

# 创建子目录结构（模拟 Git Submodule）
Write-Host "2️⃣  创建子目录结构..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "Tools\GithubActionAISelfBuilder" | Out-Null

# 复制规则文件（模拟 Git Submodule 中的规则）
Write-Host "3️⃣  复制规则文件..." -ForegroundColor Cyan
$RulesSource = Join-Path $ProjectRoot ".cursor\rules"
$RulesTarget = "Tools\GithubActionAISelfBuilder\.cursor\rules"
New-Item -ItemType Directory -Force -Path (Split-Path $RulesTarget -Parent) | Out-Null
Copy-Item -Recurse -Force $RulesSource $RulesTarget

# 复制测试脚本
Write-Host "4️⃣  复制测试脚本..." -ForegroundColor Cyan
$ScriptsTarget = "Tools\GithubActionAISelfBuilder\scripts"
New-Item -ItemType Directory -Force -Path $ScriptsTarget | Out-Null
Copy-Item "$ProjectRoot\scripts\test-cursor-rules.ts" $ScriptsTarget
Copy-Item "$ProjectRoot\package.json" "Tools\GithubActionAISelfBuilder\"

# 创建 .cursorignore 文件
Write-Host "5️⃣  创建 .cursorignore 文件..." -ForegroundColor Cyan
@"
# 排除本项目特有的规则文件（ProjectOnly 目录）
Tools/GithubActionAISelfBuilder/.cursor/rules/ProjectOnly/
"@ | Out-File -FilePath ".cursorignore" -Encoding UTF8

Write-Host "   ✓ .cursorignore 内容:" -ForegroundColor Green
Get-Content ".cursorignore"
Write-Host ""

# 运行测试脚本
Write-Host "6️⃣  运行测试脚本..." -ForegroundColor Cyan
Write-Host ""

# 检查是否有 ts-node
$TsNodePath = "$ProjectRoot\node_modules\.bin\ts-node.cmd"
if (-not (Test-Path $TsNodePath)) {
    Write-Host "   ⚠️  ts-node 未找到，请先运行: npm install" -ForegroundColor Yellow
    exit 1
}

& $TsNodePath "Tools\GithubActionAISelfBuilder\scripts\test-cursor-rules.ts" $TestParentDir

Write-Host ""
Write-Host "✅ 测试完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步：" -ForegroundColor Cyan
Write-Host "   1. 在 Cursor 中打开测试父项目: $TestParentDir"
Write-Host "   2. 验证规则列表，应该只看到共享规则"
Write-Host "   3. 清理测试目录: Remove-Item -Recurse -Force $TestParentDir"


