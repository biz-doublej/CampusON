-- CampusON Database Setup Script for PostgreSQL 17
-- Run this script as postgres superuser

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

-- Display connection info
SELECT 'Database setup completed successfully!' AS status;
SELECT current_database() AS database_name, current_user AS current_user;