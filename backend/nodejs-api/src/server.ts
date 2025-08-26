import dotenv from 'dotenv';
import app from './app';

// 환경 변수 로드
dotenv.config();

const PORT = process.env.PORT || 3001;

// Vercel 환경에서는 app을 직접 내보내기
export default app;

// 로컬 환경에서만 서버 시작
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 CampusON Node.js API 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📖 API 문서: http://localhost:${PORT}/api-docs`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}
