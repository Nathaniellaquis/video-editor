@echo off
echo Setting up Video Editing Cursor...
echo.

echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to install dependencies.
    echo Please make sure Node.js is installed and try again.
    echo.
    echo You can also use the HTML version by opening index.html in your browser.
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo To start the development server, run:
echo npm run dev
echo.
echo Or use the HTML version by opening index.html in your browser.
echo.
pause 