# Fix PostgreSQL Authentication for CampusON
# This script fixes common authentication issues

Write-Host "=======================================" -ForegroundColor Blue
Write-Host "CampusON Database Authentication Fix" -ForegroundColor Blue
Write-Host "=======================================" -ForegroundColor Blue
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$fixSqlFile = Join-Path $scriptDir "fix-pg-auth.sql"

Write-Host "Step 1: Fixing user permissions..." -ForegroundColor Yellow
Write-Host "Please enter your PostgreSQL superuser (postgres) password when prompted." -ForegroundColor Cyan
Write-Host ""

try {
    & psql -U postgres -h localhost -f $fixSqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ User permissions updated successfully!" -ForegroundColor Green
    } else {
        throw "Failed to update user permissions"
    }
} catch {
    Write-Host "✗ Failed to update permissions: $_" -ForegroundColor Red
    Read-Host "Press Enter to continue anyway"
}

Write-Host ""
Write-Host "Step 2: Testing connection with different methods..." -ForegroundColor Yellow

# Method 1: Try with trust authentication (most common solution)
Write-Host "Testing Method 1: Direct connection..." -ForegroundColor Cyan
try {
    $result1 = & psql -U campuson_user -h localhost -d campuson_db -c "SELECT 'Method 1 Success!' AS status;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Method 1 Success - Connection working!" -ForegroundColor Green
        $connectionWorking = $true
    } else {
        Write-Host "✗ Method 1 Failed" -ForegroundColor Red
        $connectionWorking = $false
    }
} catch {
    Write-Host "✗ Method 1 Error: $_" -ForegroundColor Red
    $connectionWorking = $false
}

# Method 2: Try with explicit password (if method 1 fails)
if (-not $connectionWorking) {
    Write-Host ""
    Write-Host "Testing Method 2: With password prompt..." -ForegroundColor Cyan
    Write-Host "Password should be: campuson_password_2024" -ForegroundColor Yellow
    
    try {
        $result2 = & psql -U campuson_user -h localhost -d campuson_db -c "SELECT 'Method 2 Success!' AS status;"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Method 2 Success - Connection working with password!" -ForegroundColor Green
            $connectionWorking = $true
        } else {
            Write-Host "✗ Method 2 Failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "✗ Method 2 Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Blue
Write-Host "Connection Test Results" -ForegroundColor Blue
Write-Host "=======================================" -ForegroundColor Blue

if ($connectionWorking) {
    Write-Host "✓ Database connection is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now proceed with Prisma setup:" -ForegroundColor Green
    Write-Host "1. cd backend\nodejs-api" -ForegroundColor Cyan
    Write-Host "2. npm run db:generate" -ForegroundColor Cyan
    Write-Host "3. npm run db:push" -ForegroundColor Cyan
    Write-Host "4. npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "⚠ Connection still not working." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual Solutions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1 - Modify pg_hba.conf (Recommended):" -ForegroundColor Cyan
    Write-Host "1. Find pg_hba.conf file (usually in C:\Program Files\PostgreSQL\17\data\)" -ForegroundColor White
    Write-Host "2. Add this line at the top:" -ForegroundColor White
    Write-Host "   host    campuson_db    campuson_user    127.0.0.1/32    trust" -ForegroundColor Yellow
    Write-Host "3. Restart PostgreSQL service" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2 - Use postgres user for development:" -ForegroundColor Cyan
    Write-Host "Update .env file to use:" -ForegroundColor White
    Write-Host 'DATABASE_URL="postgresql://postgres:your_password@localhost:5432/campuson_db?schema=public"' -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 3 - Reset PostgreSQL authentication:" -ForegroundColor Cyan
    Write-Host "1. Stop PostgreSQL service" -ForegroundColor White
    Write-Host "2. Edit pg_hba.conf to use 'trust' for local connections" -ForegroundColor White
    Write-Host "3. Start PostgreSQL service" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Blue
Read-Host "Press Enter to continue"