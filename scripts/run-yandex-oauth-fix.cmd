@echo off
cd /d "%~dp0.."
echo.
echo Starting Yandex OAuth fix (opens PowerShell)...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update-yandex-oauth-interactive.ps1"
echo.
pause
