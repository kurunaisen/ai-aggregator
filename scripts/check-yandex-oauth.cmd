@echo off
cd /d "%~dp0.."
echo.
echo Yandex OAuth diagnostics...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check-yandex-oauth.ps1"
echo.
pause
