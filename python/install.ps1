# Python 环境安装脚本 (PowerShell)
# 
# 要求：必须使用 Conda 进行环境管理，确保一致性

Write-Host "🚀 GitHub Action Builder - Python 环境安装" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否使用 conda
$condaExists = Get-Command conda -ErrorAction SilentlyContinue
if (-not $condaExists) {
    Write-Host "❌ 错误: 未检测到 Conda" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 本项目要求使用 Conda 进行环境管理，以确保一致性。" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📥 请安装 Conda：" -ForegroundColor Yellow
    Write-Host "   1. Miniconda（推荐，体积小）:" -ForegroundColor Yellow
    Write-Host "      https://docs.conda.io/en/latest/miniconda.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   2. Anaconda（完整版）:" -ForegroundColor Yellow
    Write-Host "      https://www.anaconda.com/products/distribution" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 安装步骤：" -ForegroundColor Yellow
    Write-Host "   1. 下载对应平台的安装包" -ForegroundColor White
    Write-Host "   2. 运行安装程序" -ForegroundColor White
    Write-Host "   3. 重新打开 PowerShell" -ForegroundColor White
    Write-Host "   4. 重新运行此脚本: .\install.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ 检测到 Conda" -ForegroundColor Green
Write-Host ""

# 检查 Conda 版本
$condaVersion = conda --version 2>&1
Write-Host "📋 Conda 版本: $condaVersion" -ForegroundColor White
Write-Host ""

# 检查环境是否已存在
$envExists = conda env list | Select-String "github-action-builder"
if ($envExists) {
    Write-Host "⚠️  环境 'github-action-builder' 已存在" -ForegroundColor Yellow
    $response = Read-Host "是否删除并重新创建？(y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host "🗑️  删除现有环境..."
        conda env remove -n github-action-builder -y
        Write-Host "✅ 环境已删除" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "📝 使用现有环境"
        Write-Host ""
        Write-Host "✅ 安装完成！" -ForegroundColor Green
        Write-Host ""
        Write-Host "📚 下一步："
        Write-Host "   conda activate github-action-builder"
        Write-Host "   python -m src.scaffold --help"
        exit 0
    }
}

# 检查 environment.yml 文件是否存在
if (-not (Test-Path "environment.yml")) {
    Write-Host "❌ 错误: 未找到 environment.yml 文件" -ForegroundColor Red
    Write-Host "   请确保在 python/ 目录下运行此脚本" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 创建 Conda 环境..." -ForegroundColor Cyan
Write-Host "   使用配置文件: environment.yml" -ForegroundColor White
Write-Host ""

# 创建环境
conda env create -f environment.yml

Write-Host ""
Write-Host "✅ Conda 环境创建成功！" -ForegroundColor Green
Write-Host ""
Write-Host "📚 下一步：" -ForegroundColor Cyan
Write-Host "   1. 激活环境:"
Write-Host "      conda activate github-action-builder" -ForegroundColor White
Write-Host ""
Write-Host "   2. 验证安装:"
Write-Host "      python -m src.scaffold --help" -ForegroundColor White
Write-Host ""
Write-Host "   3. 查看文档:"
Write-Host "      cat QUICK_START.md" -ForegroundColor White
Write-Host ""
Write-Host "🎉 安装完成！" -ForegroundColor Green
