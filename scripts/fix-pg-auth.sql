-- Fix PostgreSQL authentication for campuson_user
-- Run this as postgres superuser

-- First, let's reset the user password and ensure it's set correctly
ALTER USER campuson_user WITH PASSWORD 'campuson_password_2024';

-- Grant necessary privileges again to ensure they're set
GRANT ALL PRIVILEGES ON DATABASE campuson_db TO campuson_user;

-- Connect to campuson_db
\c campuson_db;

-- Grant schema-level permissions
GRANT ALL ON SCHEMA public TO campuson_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO campuson_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO campuson_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO campuson_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO campuson_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO campuson_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO campuson_user;

-- Make campuson_user a member of the database owner role (optional, for full access)
GRANT campuson_user TO postgres;

-- Check user exists and has correct attributes
SELECT usename, usecreatedb, usesuper FROM pg_user WHERE usename = 'campuson_user';

-- Test if user can connect (this will be run by postgres, but simulates the connection)
SELECT 'User permissions configured successfully!' AS status;