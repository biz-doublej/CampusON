import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './auth/routes';
import usersRoutes from './users/routes';
import dashboardRoutes from './dashboard/routes';
import { authenticateToken } from './auth/middleware';
import assignmentsRoutes from './assignments/routes';
import adminRoutes from './admin/routes';
import aiRoutes from './ai/routes';
import professorRoutes from './professor/routes';
import studentsRoutes from './students/routes';

const app = express();

// 보안 미들웨어
app.use(helmet({
  contentSecurityPolicy: false, // Vercel에서 문제가 될 수 있음
}));

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://frontend-gabrieljung0727s-projects.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 로깅
app.use(morgan('combined'));

// Body 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'CampusON Node.js API is running',
    version: '1.0.0',
    status: 'healthy',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      dashboard: '/api/dashboard/*',
      docs: '/api-docs'
    }
  });
});

// API 문서 라우트 (임시)
app.get('/api-docs', (req, res) => {
  res.json({
    title: 'CampusON API Documentation',
    version: '1.0.0',
    description: 'CampusON 백엔드 API 문서',
    endpoints: {
      auth: {
        'POST /api/auth/login': { description: '로그인' },
        'POST /api/auth/register': { description: '회원가입' },
        'POST /api/auth/logout': { description: '로그아웃' },
        'GET /api/auth/profile': { description: '프로필 조회' }
      },
      dashboard: {
        'GET /api/dashboard/stats': { description: '대시보드 통계' },
        'GET /api/dashboard/activities': { description: '최근 활동' }
      }
    }
  });
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CampusON Node.js API'
  });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Users Routes (protected)
app.use('/api/users', usersRoutes);
// Dashboard Routes v2 (dynamic)
app.use('/api/dashboard', dashboardRoutes);
// Assignments Routes
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/professor', professorRoutes);
// Students Routes
app.use('/api/students', studentsRoutes);

// Protected Dashboard API 엔드포인트들 (인증 필요)
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      total_assignments: 12,
      completed_assignments: 8,
      average_score: 85.5,
      recent_activities: [
        {
          id: '1',
          type: 'assignment',
          title: '과제 제출',
          description: '컴퓨터공학 과제를 제출했습니다.',
          timestamp: new Date().toISOString()
        }
      ]
    }
  });
});

app.get('/api/dashboard/activities', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        type: 'login',
        description: '로그인했습니다.',
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `요청하신 리소스 ${req.originalUrl}를 찾을 수 없습니다.`,
    available_endpoints: ['/', '/health', '/api-docs', '/api/auth', '/api/dashboard']
  });
});

// 에러 처리
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '서버 내부 오류가 발생했습니다.'
  });
});

export default app;
