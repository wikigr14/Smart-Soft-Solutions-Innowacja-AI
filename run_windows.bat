@echo off
TITLE AI Transcriber Launcher
echo ==========================================
echo    Uruchamianie Projektu AI Transcriber
echo ==========================================

:: 1. Sprawdź czy Docker działa
docker info >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [BLAD] Docker Desktop nie jest uruchomiony!
    echo Wlacz Docker Desktop i sprobuj ponownie.
    pause
    exit
)

echo [1/3] Uruchamianie Backendu i Bazy Danych...
docker-compose up -d --build

echo [2/3] Instalacja zaleznosci Frontendu (jesli trzeba)...
cd frontend
if not exist node_modules (
    call npm install
)

echo [3/3] Uruchamianie Frontendu...
echo Aplikacja bedzie dostepna pod adresem: http://localhost:5173
echo Backend API dostepne pod adresem: http://localhost:8000
echo.
echo Wcisnij Ctrl+C w tym oknie, aby zatrzymac frontend.
echo.

:: Otwórz przeglądarkę automatycznie (opcjonalne)
start http://localhost:5173

:: Uruchom Reacta
npm run dev
