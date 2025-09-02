@echo off
echo ========================================
echo Video Editing Cursor - Server Setup
echo ========================================
echo.

echo Step 1: Checking FFmpeg installation...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ FFmpeg is not installed or not in PATH
    echo.
    echo Installing FFmpeg using winget...
    winget install FFmpeg
    echo.
    echo Please restart your computer and run this script again.
    echo This ensures FFmpeg is properly added to your PATH.
    echo.
    pause
    exit /b 1
)

echo ✅ FFmpeg is installed!
echo.

echo Step 2: Installing npm dependencies...
npm install
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to install dependencies
    echo.
    echo Trying to fix package.json...
    echo.
    echo Please check if you have Node.js installed:
    echo node --version
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.

echo Step 3: Starting the development server...
echo.
echo 🌐 The application will open at: http://localhost:3000
echo 📁 You can also use the HTML version: open index.html
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev 