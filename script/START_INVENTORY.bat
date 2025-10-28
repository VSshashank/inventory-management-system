@echo off
REM Biodegradable Bags Inventory System - Windows Startup Script
REM This script checks dependencies and starts the inventory system

title Biodegradable Bags Inventory System
color 0B

echo ================================================
echo   BIODEGRADABLE BAGS INVENTORY SYSTEM
echo ================================================
echo.

REM Check if Python is installed
echo [36mChecking Python installation...[0m
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [31mX Error: Python is not installed or not in PATH![0m
    echo.
    echo Please install Python 3.7 or higher from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH" during installation!
    echo.
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [32m+ Python %PYTHON_VERSION% found[0m

REM Check if virtual environment exists
if not exist "venv\" (
    echo.
    echo [33mCreating virtual environment...[0m
    python -m venv venv
    
    if errorlevel 1 (
        color 0C
        echo [31mX Failed to create virtual environment[0m
        pause
        exit /b 1
    )
    echo [32m+ Virtual environment created[0m
)

REM Activate virtual environment
echo.
echo [36mActivating virtual environment...[0m
call venv\Scripts\activate.bat

if errorlevel 1 (
    color 0C
    echo [31mX Failed to activate virtual environment[0m
    pause
    exit /b 1
)
echo [32m+ Virtual environment activated[0m

REM Check if requirements are installed
echo.
echo [36mChecking dependencies...[0m
python -c "import rich" 2>nul
if errorlevel 1 (
    echo [33mInstalling required packages...[0m
    echo This may take a few minutes...
    echo.
    pip install -r requirements.txt
    
    if errorlevel 1 (
        color 0C
        echo [31mX Failed to install dependencies[0m
        pause
        exit /b 1
    )
    echo [32m+ Dependencies installed successfully[0m
) else (
    echo [32m+ All dependencies are installed[0m
)

REM Check if config file exists
if not exist "config.json" (
    echo.
    echo [33mCreating default configuration file...[0m
    if exist "config.json.example" (
        copy config.json.example config.json >nul
        echo [32m+ Configuration file created[0m
        echo [36mYou can customize settings in config.json[0m
    )
)

REM Start the program
echo.
echo [36m================================================[0m
echo [32mStarting Inventory System...[0m
echo [36m================================================[0m
echo.
timeout /t 1 /nobreak >nul

python inventory_tracker.py

REM After program exits
set EXIT_CODE=%ERRORLEVEL%
echo.
if %EXIT_CODE% equ 0 (
    echo [32m+ Program closed successfully[0m
) else (
    color 0E
    echo [33m! Program exited with error code: %EXIT_CODE%[0m
    echo Check error_log.txt for details
)

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat

echo.
pause
