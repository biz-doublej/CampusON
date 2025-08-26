@echo off
echo ==========================================
echo CampusON Database Setup for PostgreSQL 17
echo ==========================================
echo.

echo Step 1: Setting up database and user...
echo Please enter your PostgreSQL superuser password when prompted.
echo.

:: Execute the SQL setup script
psql -U postgres -h localhost -f "%~dp0setup-database.sql"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Database setup failed!
    echo Please check:
    echo 1. PostgreSQL 17 is running
    echo 2. You have superuser access
    echo 3. The postgres user exists
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Step 2: Testing database connection...
echo ==========================================

:: Test connection with new user
psql -U campuson_user -h localhost -d campuson_db -c "SELECT 'Connection successful!' AS status;"

if %errorlevel% neq 0 (
    echo.
    echo WARNING: Connection test failed!
    echo The database was created but connection test failed.
    echo You may need to check pg_hba.conf file.
) else (
    echo.
    echo ✓ Database setup completed successfully!
)

echo.
echo ==========================================
echo Next Steps:
echo ==========================================
echo 1. Navigate to backend/nodejs-api folder
echo 2. Run: npm run db:generate
echo 3. Run: npm run db:push
echo 4. Start the development server: npm run dev
echo ==========================================

pause