# Quick Database Connection Test
Write-Host "Testing Database Connections..." -ForegroundColor Blue
Write-Host ""

# Test 1: campuson_user
Write-Host "Test 1: Testing campuson_user..." -ForegroundColor Yellow
$env:PGPASSWORD = "campuson_password_2024"
try {
    $result1 = & psql -U campuson_user -h localhost -d campuson_db -c "SELECT 'campuson_user works!' AS status;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ campuson_user connection successful!" -ForegroundColor Green
        Write-Host "Use: postgresql://campuson_user:campuson_password_2024@localhost:5432/campuson_db?schema=public" -ForegroundColor Cyan
        $workingConnection = "campuson_user"
    }
} catch {
    Write-Host "✗ campuson_user failed" -ForegroundColor Red
}

# Test 2: postgres user (you'll need to enter password)
if (-not $workingConnection) {
    Write-Host ""
    Write-Host "Test 2: Testing postgres user..." -ForegroundColor Yellow
    Write-Host "Please enter your postgres password:" -ForegroundColor Cyan
    
    try {
        $result2 = & psql -U postgres -h localhost -d campuson_db -c "SELECT 'postgres user works!' AS status;"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ postgres user connection successful!" -ForegroundColor Green
            Write-Host "Update your .env with your postgres password" -ForegroundColor Cyan
            $workingConnection = "postgres"
        }
    } catch {
        Write-Host "✗ postgres user failed" -ForegroundColor Red
    }
}

# Clean up environment variable
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

Write-Host ""
if ($workingConnection) {
    Write-Host "✓ Found working connection: $workingConnection" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Update your .env file and run 'npm run db:push'" -ForegroundColor Cyan
} else {
    Write-Host "✗ No working connections found" -ForegroundColor Red
    Write-Host "You may need to check PostgreSQL installation or reset passwords" -ForegroundColor Yellow
}

Read-Host "Press Enter to continue"