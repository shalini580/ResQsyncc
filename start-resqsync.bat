@echo off
setlocal
cd /d "%~dp0"
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0open-resqsync.ps1"
npm run dev
pause
