@echo off
echo ========================================================
echo   Starting Smart Health Advisory System - Backend
echo   API:  http://127.0.0.1:8000
echo   Docs: http://127.0.0.1:8000/docs
echo ========================================================

cd /d "%~dp0\backend"
call run_backend.bat
