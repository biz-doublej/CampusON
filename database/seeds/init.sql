-- PostgreSQL 초기화 스크립트
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 기본 데이터베이스 설정
ALTER DATABASE kb_learning_db SET timezone TO 'Asia/Seoul';

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON DATABASE kb_learning_db TO admin;

-- 스키마 설정
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO admin;

-- 벡터 인덱스 최적화 설정
SET maintenance_work_mem = '512MB';
SET max_parallel_workers_per_gather = 4;

-- 성능 최적화
ALTER DATABASE kb_learning_db SET shared_preload_libraries = 'vector';
ALTER DATABASE kb_learning_db SET max_connections = 100; 