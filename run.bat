@echo off
setlocal
echo ========================================================
echo         Hamster Reaction Cam — Launching...
echo ========================================================

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" main.py %*
) else (
    echo [ERROR] Virtual environment not found at .venv\Scripts\python.exe
    echo Please install dependencies first:
    echo     python -m venv .venv
    echo     .venv\Scripts\pip install -r requirements.txt
    pause
)
