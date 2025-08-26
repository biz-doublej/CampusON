# CampusON Database Setup Script for PostgreSQL 17
# PowerShell version with enhanced error handling

Write-Host "===========================================" -ForegroundColor Blue
Write-Host "CampusON Database Setup for PostgreSQL 17" -ForegroundColor Blue  
Write-Host "===========================================" -ForegroundColor Blue
Write-Host ""

# Check if PostgreSQL is accessible
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow

try {
    $pgVersion = & psql --version 2>$null
    if ($pgVersion) {
        Write-Host "✓ PostgreSQL found: $pgVersion" -ForegroundColor Green
    } else {
        throw "PostgreSQL not found in PATH"
    }
} catch {
    Write-Host "✗ PostgreSQL not found or not in PATH" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL 17 is installed and psql is in your PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "setup-database.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "✗ SQL setup file not found: $sqlFile" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 1: Setting up database and user..." -ForegroundColor Yellow
Write-Host "Please enter your PostgreSQL superuser (postgres) password when prompted." -ForegroundColor Cyan
Write-Host ""

# Execute the SQL setup script
try {
    & psql -U postgres -h localhost -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Database and user created successfully!" -ForegroundColor Green
    } else {
        throw "Database setup failed with exit code: $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "✗ Database setup failed!" -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. PostgreSQL 17 is running" -ForegroundColor White
    Write-Host "2. You have superuser access" -ForegroundColor White
    Write-Host "3. The postgres user exists and password is correct" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Blue
Write-Host "Step 2: Testing database connection..." -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Blue

# Test connection with new user
try {
    $testResult = & psql -U campuson_user -h localhost -d campuson_db -c "SELECT 'Connection successful!' AS status;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Connection test passed!" -ForegroundColor Green
        $setupSuccess = $true
    } else {
        Write-Host "⚠ Connection test failed!" -ForegroundColor Yellow
        Write-Host "The database was created but connection test failed." -ForegroundColor Yellow
        Write-Host "You may need to check pg_hba.conf file for authentication settings." -ForegroundColor Yellow
        $setupSuccess = $false
    }
} catch {
    Write-Host "⚠ Connection test encountered an error: $_" -ForegroundColor Yellow
    $setupSuccess = $false
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Blue
Write-Host "Database Setup Summary" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Blue
Write-Host "Database Name: campuson_db" -ForegroundColor White
Write-Host "Database User: campuson_user" -ForegroundColor White
Write-Host "Database Host: localhost:5432" -ForegroundColor White
Write-Host ""

if ($setupSuccess) {
    Write-Host "✓ Setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠ Setup completed with warnings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Blue
Write-Host "Next Steps:" -ForegroundColor Blue
Write-Host "===========================================" -ForegroundColor Blue
Write-Host "1. Navigate to: backend\nodejs-api" -ForegroundColor White
Write-Host "2. Run: npm run db:generate" -ForegroundColor Cyan
Write-Host "3. Run: npm run db:push" -ForegroundColor Cyan
Write-Host "4. Start server: npm run dev" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Blue

Read-Host "Press Enter to continue"