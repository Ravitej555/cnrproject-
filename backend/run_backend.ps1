# Launch FastAPI Backend for Smart Health Advisory System
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Smart Health Advisory System - FastAPI Backend" -ForegroundColor Green
Write-Host "  Host: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n[1/2] Verifying dependencies..." -ForegroundColor Gray
python -m pip install -r requirements.txt --quiet

Write-Host "`n[2/2] Launching Uvicorn Server..." -ForegroundColor Green
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
