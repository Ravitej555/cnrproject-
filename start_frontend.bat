@echo off
echo ========================================================
echo   Starting Smart Health Advisory System - Frontend
echo   URL: http://localhost:5173
echo ========================================================

cd /d "%~dp0\frontend"
npm run dev
pause
