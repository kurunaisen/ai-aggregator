@echo off
cd /d "%~dp0.."
echo.
echo Runway API check...
echo.
node "%~dp0check-runway.mjs"
echo.
pause
