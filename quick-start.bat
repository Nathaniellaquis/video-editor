@echo off
echo ========================================
echo Video Editing Cursor - Quick Start
echo ========================================
echo.

echo Checking FFmpeg installation...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ FFmpeg is not installed!
    echo.
    echo Please install FFmpeg first:
    echo 1. Run: choco install ffmpeg
    echo 2. Or follow instructions in FFMPEG_SETUP.md
    echo.
    echo You can still use the HTML version by opening index.html
    echo.
    pause
    exit /b 1
)

echo ✅ FFmpeg is installed!
echo.

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to install dependencies
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.
echo Starting development server...
echo.
echo 🌐 Open http://localhost:3000 in your browser
echo 📁 Or use the HTML version: open index.html
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev 