#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 CampusON 데이터베이스 설정을 시작합니다...\n');

// 환경 변수 체크
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  console.error('   .env 파일을 확인해주세요.');
  process.exit(1);
}

console.log('✓ 환경 변수 확인 완료');
console.log('📊 데이터베이스 URL:', process.env.DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));

// 1. Prisma Client 생성
console.log('\n1. Prisma Client 생성 중...');
exec('npx prisma generate', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Prisma Client 생성 실패:', error);
    console.error('stderr:', stderr);
    return;
  }
  console.log('✅ Prisma Client 생성 완료');
  if (stdout) console.log(stdout);
  
  // 2. 데이터베이스 연결 테스트
  console.log('\n2. 데이터베이스 연결 테스트 중...');
  exec('npx prisma db push --accept-data-loss', (error, stdout, stderr) => {
    if (error) {
      console.log('⚠️  데이터베이스 연결 실패');
      console.log('   다음을 확인해주세요:');
      console.log('   1. PostgreSQL 17이 실행 중인지 확인');
      console.log('   2. 데이터베이스와 사용자가 생성되었는지 확인');
      console.log('   3. scripts/setup-database.bat 또는 setup-database.ps1 실행');
      console.log('\n   오류 상세:');
      console.error('   ', error.message);
      if (stderr) console.error('   ', stderr);
    } else {
      console.log('✅ 데이터베이스 스키마 동기화 완료');
      if (stdout) console.log(stdout);
      
      // 3. 데이터베이스 스튜디오 안내
      console.log('\n📊 데이터베이스 관리 도구:');
      console.log('   npx prisma studio 명령어로 데이터베이스를 시각적으로 관리할 수 있습니다.');
    }
    
    console.log('\n🎉 데이터베이스 설정이 완료되었습니다!');
    console.log('\n📝 다음 단계:');
    console.log('1. 프론트엔드: cd frontend && npm run dev');
    console.log('2. 백엔드: npm run dev (현재 디렉토리에서)');
    console.log('3. 파이썬 API: cd ../python-api && uvicorn app.main:app --reload --port 8001');
    console.log('\n🔗 서비스 URL:');
    console.log('- 프론트엔드: http://localhost:3000');
    console.log('- Node.js API: http://localhost:3001');
    console.log('- Python API: http://localhost:8001');
    console.log('- Prisma Studio: npx prisma studio');
  });
});

// .env 파일 체크
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n⚠️  .env 파일이 없습니다.');
  console.log('   .env.example을 참고하여 .env 파일을 생성하세요.');
}