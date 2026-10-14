@echo off
echo ========================================================
echo   Starting Smart Health Advisory System - FastAPI Backend
echo   Host: http://127.0.0.1:8000
echo   Docs: http://127.0.0.1:8000/docs
echo ========================================================

cd /d "%~dp0"
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
