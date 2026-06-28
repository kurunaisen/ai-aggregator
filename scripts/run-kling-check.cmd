@echo off
cd /d "%~dp0.."
echo.
echo Kling API check...
echo.
node "%~dp0check-kling.mjs"
echo.
pause
