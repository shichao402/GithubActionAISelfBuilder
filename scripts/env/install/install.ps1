# GitHub Action Builder - 环境安装脚本 (PowerShell)
# 
# 此脚本用于安装 Python 环境和依赖
# 要求: 必须使用 Conda 进行环境管理

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ScriptDir))
$PythonDir = Join-Path $ProjectRoot "python"

Write-Host "🚀 GitHub Action Builder - 环境安装" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Conda
$condaCmd = Get-Command conda -ErrorAction SilentlyContinue
if (-not $condaCmd) {
    Write-Host "❌ 错误: 未找到 Conda" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 请先安装 Conda:" -ForegroundColor Yellow
    Write-Host "   - Miniconda: https://docs.conda.io/en/latest/miniconda.html"
    Write-Host "   - Anaconda: https://www.anaconda.com/products/distribution"
    Write-Host ""
    Write-Host "安装后，请重新运行此脚本。"
    exit 1
}

$condaVersion = conda --version
Write-Host "✅ 检测到 Conda: $condaVersion" -ForegroundColor Green
Write-Host ""

# 检查 environment.yml
$EnvFile = Join-Path $PythonDir "environment.yml"
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ 错误: 未找到 environment.yml 文件: $EnvFile" -ForegroundColor Red
    exit 1
}

Write-Host "📋 环境配置文件: $EnvFile" -ForegroundColor Cyan
Write-Host ""

# 创建/更新 Conda 环境
Write-Host "🔧 创建/更新 Conda 环境: github-action-builder" -ForegroundColor Cyan
Write-Host ""

Set-Location $PythonDir

conda env update -f environment.yml --name github-action-builder

Write-Host ""
Write-Host "✅ 环境安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 使用环境:" -ForegroundColor Cyan
Write-Host "   conda activate github-action-builder"
Write-Host ""

