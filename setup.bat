@echo off
echo ==========================================
echo NEBULAX - Setup Script
echo ==========================================
echo.

REM Check Python
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.9+
    exit /b 1
)
echo Python found.
echo.

REM Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 16+
    exit /b 1
)
echo Node.js found.
echo.

REM Setup Backend
echo ==========================================
echo Setting up Backend...
echo ==========================================
cd backend

echo Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    exit /b 1
)

echo Training ML model...
cd ..\ml_model
python train_aqi_model.py
if errorlevel 1 (
    echo WARNING: Failed to train ML model. You may need to run it manually.
)

cd ..

REM Setup Frontend
echo.
echo ==========================================
echo Setting up Frontend...
echo ==========================================
cd frontend

echo Installing npm dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)

echo Building Tailwind CSS...
npx tailwindcss init -p 2>nul || echo Tailwind already initialized

cd ..

REM Create .env file if it doesn't exist
echo.
echo ==========================================
echo Creating environment file...
echo ==========================================
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo Created backend\.env from template
    echo Please edit backend\.env and add your OpenWeather API key
) else (
    echo backend\.env already exists
)

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo To start the application:
echo.
echo 1. Start the backend:
echo    cd backend
echo    uvicorn main:app --reload
echo.
echo 2. In a new terminal, start the frontend:
echo    cd frontend
echo    npm start
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
echo Don't forget to add your OpenWeather API key to backend\.env
echo Get one at: https://openweathermap.org/api
echo.

pause
