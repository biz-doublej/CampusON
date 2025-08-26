# CampusON Database Setup Guide - PostgreSQL 17

## 🎯 Prerequisites
- ✅ PostgreSQL 17 installed
- ✅ PostgreSQL service running
- ✅ Access to PostgreSQL superuser (postgres)

## 🚀 Quick Setup (Recommended)

### Option 1: PowerShell Script (Recommended)
```powershell
# Navigate to scripts directory
cd scripts

# Run the PowerShell setup script
powershell -ExecutionPolicy Bypass .\setup-database.ps1
```

### Option 2: Batch Script
```cmd
# Navigate to scripts directory
cd scripts

# Run the batch setup script
setup-database.bat
```

## 🔧 Manual Setup

### Step 1: Create Database and User
1. Open Command Prompt or PowerShell as Administrator
2. Connect to PostgreSQL:
```cmd
psql -U postgres -h localhost
```

3. Execute the following SQL commands:
```sql
-- Create database user
CREATE USER campuson_user WITH PASSWORD 'campuson_password_2024';

-- Create database
CREATE DATABASE campuson_db WITH 
    OWNER = campuson_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TEMPLATE = template0;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campuson_db TO campuson_user;

-- Connect to the new database
\c campuson_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO campuson_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO campuson_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO campuson_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO campuson_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO campuson_user;

-- Exit psql
\q
```

### Step 2: Test Connection
```cmd
# Test connection with new user
psql -U campuson_user -h localhost -d campuson_db -c "SELECT 'Connection successful!' AS status;"
```

### Step 3: Setup Prisma
```cmd
# Navigate to Node.js API directory
cd backend\nodejs-api

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

## 📊 Database Configuration

### Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database**: campuson_db
- **Username**: campuson_user
- **Password**: campuson_password_2024

### Environment Variables
The `.env` file should contain:
```env
DATABASE_URL="postgresql://campuson_user:campuson_password_2024@localhost:5432/campuson_db?schema=public"
```

## 🏗️ Database Schema

### Core Tables
- **users**: User accounts with role and department information
- **assignments**: Academic assignments and tests
- **questions**: Individual questions with metadata
- **test_results**: Student test performance data
- **activities**: User activity logs
- **clinical_records**: Department-specific clinical practice records
- **practical_hours**: Practical training hours tracking

### Supported Departments
- **NURSING**: 간호학부
- **DENTAL_HYGIENE**: 치위생학부  
- **PHYSICAL_THERAPY**: 물리치료학과

## 🛠️ Management Tools

### Prisma Studio (Visual Database Editor)
```cmd
# Navigate to Node.js API directory
cd backend\nodejs-api

# Start Prisma Studio
npx prisma studio
```
Access at: http://localhost:5555

### Direct Database Access
```cmd
# Connect to database
psql -U campuson_user -h localhost -d campuson_db
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "psql: command not found"
**Solution**: Add PostgreSQL bin directory to PATH
- Default location: `C:\Program Files\PostgreSQL\17\bin`

#### 2. "password authentication failed"
**Solutions**:
- Verify PostgreSQL service is running
- Check username/password in connection string
- Verify user exists: `SELECT usename FROM pg_user;`

#### 3. "database does not exist"
**Solution**: Run the database setup scripts first

#### 4. Connection timeout
**Solutions**:
- Check PostgreSQL service status
- Verify pg_hba.conf allows local connections
- Ensure Windows Firewall allows PostgreSQL

### Verification Commands
```cmd
# Check PostgreSQL version
psql --version

# Check PostgreSQL service status (Windows)
sc query postgresql-x64-17

# Test basic connection
psql -U postgres -h localhost -c "SELECT version();"

# List databases
psql -U postgres -h localhost -c "\l"

# List users
psql -U postgres -h localhost -c "\du"
```

## 🚀 Next Steps

After successful database setup:

1. **Start Backend Services**:
   ```cmd
   # Node.js API
   cd backend\nodejs-api
   npm run dev

   # Python API (separate terminal)
   cd backend\python-api
   uvicorn app.main:app --reload --port 8001
   ```

2. **Start Frontend**:
   ```cmd
   cd frontend
   npm run dev
   ```

3. **Access Applications**:
   - Frontend: http://localhost:3000
   - Node.js API: http://localhost:3001
   - Python API: http://localhost:8001
   - Prisma Studio: http://localhost:5555

## 📝 Security Notes

- Change default passwords in production
- Use environment-specific credentials
- Configure proper pg_hba.conf for production
- Enable SSL connections for production deployment
- Regular database backups recommended

---

**Need Help?** Check the error logs or contact the development team.