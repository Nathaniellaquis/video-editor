Write-Host "Setting up Video Editing Cursor..." -ForegroundColor Green
Write-Host ""

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error: Failed to install dependencies." -ForegroundColor Red
    Write-Host "Please make sure Node.js is installed and try again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can also use the HTML version by opening index.html in your browser." -ForegroundColor Cyan
    Read-Host "Press Enter to continue"
    exit 1
}

Write-Host ""
Write-Host "Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Or use the HTML version by opening index.html in your browser." -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue" 