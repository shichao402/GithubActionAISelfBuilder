# Windows PowerShell script: Install Node.js

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Node.js Installation Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is already installed
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
} catch {
    # Node.js not installed
}

if ($nodeVersion) {
    Write-Host "Node.js is already installed: $nodeVersion" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current version: $nodeVersion" -ForegroundColor Yellow
    
    # Check if version meets requirement (18+)
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -ge 18) {
        Write-Host "Version meets requirement (needs 18+)" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Version is too old, needs 18+, current: $majorVersion" -ForegroundColor Yellow
        Write-Host "Recommend upgrading to latest LTS version" -ForegroundColor Yellow
    }
} else {
    Write-Host "Node.js is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please choose installation method:" -ForegroundColor Cyan
    Write-Host "1. Official installer (Recommended)" -ForegroundColor Yellow
    Write-Host "2. Using Chocolatey (requires admin)" -ForegroundColor Yellow
    Write-Host "3. Using Scoop (requires Scoop installed)" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host "Enter option (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "Please follow these steps:" -ForegroundColor Cyan
            Write-Host "1. Visit https://nodejs.org/" -ForegroundColor Yellow
            Write-Host "2. Download LTS version (recommend 18.x or 20.x)" -ForegroundColor Yellow
            Write-Host "3. Run installer, make sure to check 'Add to PATH'" -ForegroundColor Yellow
            Write-Host "4. After installation, restart terminal and verify" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Open download page now? (Y/N)" -ForegroundColor Cyan
            $openBrowser = Read-Host
            if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
                Start-Process "https://nodejs.org/"
            }
        }
        "2" {
            Write-Host ""
            Write-Host "Checking Chocolatey..." -ForegroundColor Cyan
            $chocoInstalled = $null
            try {
                $chocoInstalled = choco --version 2>$null
            } catch {
                # Chocolatey not installed
            }
            
            if ($chocoInstalled) {
                Write-Host "Chocolatey is installed: $chocoInstalled" -ForegroundColor Green
                Write-Host "Installing Node.js LTS..." -ForegroundColor Cyan
                choco install nodejs-lts -y
            } else {
                Write-Host "Chocolatey is not installed" -ForegroundColor Red
                Write-Host "Please install Chocolatey first: https://chocolatey.org/install" -ForegroundColor Yellow
            }
        }
        "3" {
            Write-Host ""
            Write-Host "Checking Scoop..." -ForegroundColor Cyan
            $scoopInstalled = $null
            try {
                $scoopInstalled = scoop --version 2>$null
            } catch {
                # Scoop not installed
            }
            
            if ($scoopInstalled) {
                Write-Host "Scoop is installed" -ForegroundColor Green
                Write-Host "Installing Node.js LTS..." -ForegroundColor Cyan
                scoop install nodejs-lts
            } else {
                Write-Host "Scoop is not installed" -ForegroundColor Red
                Write-Host "Please install Scoop first: https://scoop.sh/" -ForegroundColor Yellow
            }
        }
        default {
            Write-Host "Invalid option" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "After installation, please run these commands to verify:" -ForegroundColor Cyan
Write-Host "  node --version" -ForegroundColor Yellow
Write-Host "  npm --version" -ForegroundColor Yellow
