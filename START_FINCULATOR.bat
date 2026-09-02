@echo off
title Finculator — Institutional Financial Computation Suite
echo ============================================================
echo   FINCULATOR — Smart Decisions. Stronger Futures.
echo   Architected by Prakhar Rai
echo ============================================================
echo.
echo [1/2] Launching Finculator Web App in your default browser...
start http://localhost:3000
echo [2/2] Starting local Python HTTP server on port 3000...
echo.
echo Press Ctrl+C in this window when you want to stop the server.
echo.
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Python was not found in PATH or encountered an error.
    echo If Python is not installed, you can also open index.html directly in any browser!
    pause
)
