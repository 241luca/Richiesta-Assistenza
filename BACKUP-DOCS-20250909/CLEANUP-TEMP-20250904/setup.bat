@echo off
setlocal enabledelayedexpansion

echo ================================================
echo    SISTEMA RICHIESTA ASSISTENZA - SETUP
echo ================================================
echo.

:: Check if Docker is running
echo Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo Docker is running

:: Start Docker containers
echo Starting PostgreSQL and Redis...
docker-compose up -d

:: Wait for PostgreSQL
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

:: Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install

:: Generate Prisma Client
echo Generating Prisma Client...
call npm run prisma:generate

:: Push schema to database
echo Creating database schema...
call npm run prisma:push

:: Seed database
echo Seeding database with sample data...
call npm run prisma:seed

:: Go back to root
cd ..

:: Install frontend dependencies
echo Installing frontend dependencies...
call npm install

echo.
echo ================================================
echo    SETUP COMPLETED SUCCESSFULLY!
echo ================================================
echo.

echo USER CREDENTIALS:
echo -----------------------------------------
echo SUPER ADMIN:
echo   Email: admin@sistema-assistenza.it
echo   Password: Password123!
echo -----------------------------------------
echo PROFESSIONAL:
echo   Email: professionista@esempio.it
echo   Password: Password123!
echo -----------------------------------------
echo CLIENT:
echo   Email: cliente@esempio.it
echo   Password: Password123!
echo -----------------------------------------
echo.

echo TO START THE APPLICATION:
echo Terminal 1 - Backend:
echo   cd backend ^&^& npm run dev
echo Terminal 2 - Frontend:
echo   npm run dev
echo.
echo URLs:
echo   Frontend: http://localhost:5193
echo   Backend:  http://localhost:3200
echo   Prisma Studio: cd backend ^&^& npm run prisma:studio
echo.
echo ================================================
echo    Happy coding!
echo ================================================

pause
