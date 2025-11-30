# 一键推送 Git 脚本 (PowerShell)
#
# 自动添加、提交并推送更改到远程仓库，方便持续测试 GitHub Actions。
#
# 用法:
#   .\scripts\push-git.ps1 [提交信息]
#   或
#   .\scripts\push-git.ps1 "fix: update test"

param(
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 开始一键推送 Git...`n" -ForegroundColor Cyan

# 1. 检查是否有未提交的更改
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "ℹ️  没有未提交的更改，无需推送" -ForegroundColor Yellow
    exit 0
}

# 2. 显示当前状态
Write-Host "📋 当前 Git 状态:" -ForegroundColor Cyan
git status -s
Write-Host ""

# 3. 获取提交信息
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $CommitMessage = "chore: update for testing GitHub Actions [$timestamp]"
}

# 4. 添加所有更改
Write-Host "📦 添加所有更改..." -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 添加更改失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 更改已添加`n" -ForegroundColor Green

# 5. 提交
Write-Host "💾 提交更改: $CommitMessage" -ForegroundColor Cyan
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 提交失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 更改已提交`n" -ForegroundColor Green

# 6. 检查是否有远程仓库
$remotes = git remote
if ([string]::IsNullOrWhiteSpace($remotes)) {
    Write-Host "⚠️  警告: 未配置远程仓库，跳过推送" -ForegroundColor Yellow
    exit 0
}

# 7. 获取当前分支
$branch = git rev-parse --abbrev-ref HEAD
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 无法获取当前分支名" -ForegroundColor Red
    exit 1
}

# 8. 推送
Write-Host "📤 推送到远程仓库 (分支: $branch)..." -ForegroundColor Cyan
git push origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ 推送失败！" -ForegroundColor Red
    Write-Host "提示: 如果是因为远程分支不存在，可以运行:" -ForegroundColor Yellow
    Write-Host "   git push -u origin $branch" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 推送成功！`n" -ForegroundColor Green
Write-Host "🎉 所有操作完成！" -ForegroundColor Green

