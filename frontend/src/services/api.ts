import axios from 'axios';
import {
  LoginRequest,
  RegisterRequest,
  User,
  ApiResponse,
  ProfessorAnalyticsData,
  UserSettings,
  UpdateUserSettingsPayload,
  UpdateSocialLinkPayload,
  SocialLinkSettings,
  ChangePasswordPayload,
  Activity,
  DashboardStats,
  DashboardStatsResponse,
  UserGrade,
  AssignmentSummary,
  CreateAssignmentPayload,
  AdminStatsResponse,
  RagStatus,
  RagQueryResponse,
  RagIngestResponse,
  RagUploadResponse,
  RagBuildResponse,
  AdminAnalyticsOverview,
  AdminMonitorSnapshot,
  AdminReportsSummary,
  AdminSystemSettings,
  DiagnosticTestSummary,
  DiagnosticTestSession,
  DiagnosticTestResult,
  DiagnosticTestSessionInfo,
  DiagnosticQuestion,
  DiagnosticTestResultSummary,
} from '../types';
import { getApiUrl } from '../utils/config';
import type { ParsedQuestion, ParsedResult } from './parserService';
import { PARSER_API_URL } from './parserService';

// Dynamic API base URL from configuration
const API_BASE_URL = getApiUrl();

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const ragClient = axios.create({
  baseURL: PARSER_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const diagnosticClient = axios.create({
  baseURL: PARSER_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

diagnosticClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Diagnostic test mock fallback 데이터 (백엔드 미구현 시 사용)
// ---------------------------------------------------------------------------

const MOCK_TESTS: DiagnosticTestSummary[] = [
  {
    test_id: 'mock-physio-2024',
    title: '물리치료 국가고시 핵심 진단',
    description: '최근 물리치료 국가고시 기출을 기반으로 한 10문항 진단 테스트입니다.',
    department: 'physical_therapy',
    status: 'open',
    time_limit_minutes: 20,
    total_questions: 10,
    open_at: null,
    close_at: null,
    created_at: null,
  },
  {
    test_id: 'mock-nursing-2024',
    title: '간호학 국가고시 진단 테스트',
    description: '기본간호/성인간호 파트에서 선별한 10문항으로 현재 역량을 점검하세요.',
    department: 'nursing',
    status: 'open',
    time_limit_minutes: 25,
    total_questions: 10,
    open_at: null,
    close_at: null,
    created_at: null,
  },
  {
    test_id: 'mock-dental-2024',
    title: '치위생학 실무 역량 진단',
    description: '구강보건 교육 및 공중구강보건 파트에서 자주 출제되는 문항으로 구성되었습니다.',
    department: 'dental_hygiene',
    status: 'open',
    time_limit_minutes: 20,
    total_questions: 8,
    open_at: null,
    close_at: null,
    created_at: null,
  },
];

type MockTestBankItem = {
  info: DiagnosticTestSessionInfo;
  questions: DiagnosticQuestion[];
  answerKey: Record<string, string>;
};

const MOCK_TEST_BANK: Record<string, MockTestBankItem> = {
  'mock-physio-2024': {
    info: {
      title: '물리치료 국가고시 핵심 진단',
      department: 'physical_therapy',
      description: '근골격계/신경계 재활 핵심 문항으로 구성되었습니다.',
      time_limit: null,
      time_limit_minutes: 20,
      total_questions: 10,
    },
    questions: Array.from({ length: 10 }).map((_, idx) => ({
      id: `physio-q${idx + 1}`,
      prompt: `물리치료 국가고시 기출 문항 ${idx + 1}번. 해당 상황에서 가장 적절한 중재는?`,
      explanation: '물리치료 평가/중재 기준에 따라 선택합니다.',
      options: {
        A: '가. 관절가동범위 운동',
        B: '나. 근력 강화 운동',
        C: '다. 신경재교육',
        D: '라. 기능적 전기자극',
      },
    })),
    answerKey: Array.from({ length: 10 }).reduce<Record<string, string>>((acc, _, idx) => {
      const choices = ['A', 'B', 'C', 'D'];
      acc[`physio-q${idx + 1}`] = choices[idx % choices.length];
      return acc;
    }, {}),
  },
  'mock-nursing-2024': {
    info: {
      title: '간호학 국가고시 진단 테스트',
      department: 'nursing',
      description: '기본간호·성인간호학 복합 문항으로 구성된 진단 테스트입니다.',
      time_limit: null,
      time_limit_minutes: 25,
      total_questions: 10,
    },
    questions: Array.from({ length: 10 }).map((_, idx) => ({
      id: `nursing-q${idx + 1}`,
      prompt: `간호학 국가고시 기출 문항 ${idx + 1}번. 대상자 간호 중 우선순위는?`,
      explanation: 'ABCD, 기본 간호술 기준을 참고하여 답변합니다.',
      options: {
        A: 'A. 활력징후 측정',
        B: 'B. 통증 사정',
        C: 'C. 호흡 보조',
        D: 'D. 체위 변경',
      },
    })),
    answerKey: Array.from({ length: 10 }).reduce<Record<string, string>>((acc, _, idx) => {
      const choices = ['A', 'B', 'C', 'D'];
      acc[`nursing-q${idx + 1}`] = choices[(idx + 1) % choices.length];
      return acc;
    }, {}),
  },
  'mock-dental-2024': {
    info: {
      title: '치위생학 실무 역량 진단',
      department: 'dental_hygiene',
      description: '구강보건 교육 및 공중구강보건 파트 문제로 구성되었습니다.',
      time_limit: null,
      time_limit_minutes: 20,
      total_questions: 8,
    },
    questions: Array.from({ length: 8 }).map((_, idx) => ({
      id: `dental-q${idx + 1}`,
      prompt: `치위생 국가고시 기출 ${idx + 1}번. 대상자 구강보건 교육 시 강조해야 할 핵심은?`,
      explanation: '치위생 실무 기준과 보건 교육 원칙을 참고합니다.',
      options: {
        A: 'A. 칫솔질 방법 설명',
        B: 'B. 불소 활용',
        C: 'C. 식이 조절',
        D: 'D. 정기 검진 안내',
      },
    })),
    answerKey: Array.from({ length: 8 }).reduce<Record<string, string>>((acc, _, idx) => {
      const choices = ['A', 'B', 'C', 'D'];
      acc[`dental-q${idx + 1}`] = choices[(idx + 2) % choices.length];
      return acc;
    }, {}),
  },
};

const mockSessions = new Map<string, { testId: string; answers: Record<string, string> }>();
const mockResults = new Map<string, DiagnosticTestResult>();

const createMockSessionId = () => `mock-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createMockResultId = () => `mock-result-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// 요청 인터셉터 - 인증 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  // 로그인
  login: async (credentials: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  // 회원가입
  register: async (userData: RegisterRequest & { user_id?: string }): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // 로그아웃
  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // 프로필 조회
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // 사용자 설정 조회
  getSettings: async (): Promise<ApiResponse<UserSettings>> => {
    const response = await api.get('/api/auth/settings');
    return response.data;
  },

  // 사용자 설정 업데이트
  updateSettings: async (payload: UpdateUserSettingsPayload): Promise<ApiResponse<UserSettings>> => {
    const response = await api.patch('/api/auth/settings', payload);
    return response.data;
  },

  // 소셜 연동 업데이트
  updateSocialLink: async (payload: UpdateSocialLinkPayload): Promise<ApiResponse<SocialLinkSettings>> => {
    const response = await api.patch('/api/auth/social', payload);
    return response.data;
  },

  // 비밀번호 변경
  changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponse> => {
    const response = await api.patch('/api/auth/password', payload);
    return response.data;
  },
};

// 대시보드 API
export const dashboardAPI = {
  // 통계 조회
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  // 활동 조회
  getActivities: async (): Promise<ApiResponse<Activity[]>> => {
    const response = await api.get('/api/dashboard/activities');
    return response.data;
  },
};

// v2 Dashboard API with dynamic stats
export const dashboardAPIV2 = {
  getStats: async (): Promise<ApiResponse<DashboardStatsResponse>> => {
    try {
      const response = await api.get('/api/dashboard/v2/stats');
      return response.data;
    } catch (e) {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    }
  },
  getActivities: async (): Promise<ApiResponse<Activity[]>> => {
    try {
      const response = await api.get('/api/dashboard/v2/activities');
      return response.data;
    } catch (e) {
      const response = await api.get('/api/dashboard/activities');
      return response.data;
    }
  },
};

// Users API
export const usersAPI = {
  // List students by department (department key: 'nursing' | 'dental_hygiene' | 'physical_therapy')
  getStudents: async (department?: string): Promise<ApiResponse<User[]>> => {
    const params = department ? { department } : undefined;
    const response = await api.get('/api/users/students', { params });
    return response.data;
  },
  // Get user detail
  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },
  // Get user grades
  getUserGrades: async (userId: string): Promise<ApiResponse<UserGrade[]>> => {
    const response = await api.get(`/api/users/${userId}/grades`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getStats: async (): Promise<ApiResponse<AdminStatsResponse>> => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },
  getMonitor: async (): Promise<ApiResponse<AdminMonitorSnapshot>> => {
    const response = await api.get('/api/admin/monitor');
    return response.data;
  },
  getSettings: async (): Promise<ApiResponse<AdminSystemSettings>> => {
    const response = await api.get('/api/admin/settings');
    return response.data;
  },
  updateSettings: async (payload: Partial<AdminSystemSettings>): Promise<ApiResponse<AdminSystemSettings>> => {
    const response = await api.put('/api/admin/settings', payload);
    return response.data;
  },
  listUsers: async (params?: { role?: string; department?: string; q?: string }): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },
  getReports: async (): Promise<ApiResponse<AdminReportsSummary>> => {
    const response = await api.get('/api/admin/reports');
    return response.data;
  },
  getAnalyticsOverview: async (): Promise<ApiResponse<AdminAnalyticsOverview>> => {
    const response = await api.get('/api/admin/analytics/overview');
    return response.data;
  },
};

// RAG Management API
export const ragAPI = {
  getStatus: async (): Promise<{ success: boolean; status: RagStatus }> => {
    const response = await ragClient.get('/api/ai/rag/status');
    return response.data;
  },
  buildIndex: async (): Promise<RagBuildResponse> => {
    const response = await ragClient.post('/api/ai/rag/build');
    return response.data;
  },
  query: async (query: string, topK = 5): Promise<RagQueryResponse> => {
    const response = await ragClient.post('/api/ai/rag/query', { query, top_k: topK });
    return response.data;
  },
  ingestDocuments: async (
    documents: { text: string; meta?: Record<string, unknown> }[],
    options?: {
      chunkSize?: number;
      chunkOverlap?: number;
      defaultMeta?: Record<string, unknown>;
      buildIndex?: boolean;
    }
  ): Promise<RagIngestResponse> => {
    const payload = {
      documents,
      chunk_size: options?.chunkSize ?? 800,
      chunk_overlap: options?.chunkOverlap ?? 120,
      default_meta: options?.defaultMeta,
      build_index: options?.buildIndex ?? false,
    };
    const response = await ragClient.post('/api/ai/rag/ingest', payload);
    return response.data;
  },
  uploadDocument: async (
    file: File,
    options?: {
      department?: string;
      course?: string;
      chunkSize?: number;
      chunkOverlap?: number;
      buildIndex?: boolean;
    }
  ): Promise<RagUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.department) formData.append('department', options.department);
    if (options?.course) formData.append('course', options.course);
    if (options?.chunkSize != null) formData.append('chunk_size', String(options.chunkSize));
    if (options?.chunkOverlap != null) formData.append('chunk_overlap', String(options.chunkOverlap));
    formData.append('build_index', String(options?.buildIndex ?? false));
    const response = await ragClient.post('/api/ai/rag/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Professor API
export const professorAPI = {
  getAnalytics: async (): Promise<ApiResponse<ProfessorAnalyticsData>> => {
    const response = await api.get('/api/professor/analytics');
    return response.data;
  },
};

// Parser Import API
export const parserAPI = {
  importParsedQuestions: async (
    payload: {
      metadata?: ParsedResult['metadata'];
      questions: ParsedQuestion[];
    }
  ): Promise<ApiResponse<{ saved_question_ids?: number[] }>> => {
    const response = await api.post('/api/parser/import', payload);
    return response.data;
  },
};

// Students API
export const studentsAPI = {
  getMyPracticeHours: async (): Promise<ApiResponse<{ total_hours: number }>> => {
    const response = await api.get('/api/students/me/practice-hours');
    return response.data;
  },
};

// Diagnostic Test API
export const diagnosticAPI = {
  listAvailableTests: async (
    department?: string
  ): Promise<ApiResponse<DiagnosticTestSummary[]>> => {
    const params = department ? { department } : undefined;
    try {
      const response = await diagnosticClient.get('/api/universal-diagnosis/available', { params });
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data;
      }
    } catch (error) {
      // fall through to mock
    }

    const filtered = department
      ? MOCK_TESTS.filter((test) => String(test.department).toLowerCase() === department.toLowerCase())
      : MOCK_TESTS;
    return {
      success: true,
      data: filtered,
    };
  },
  startTest: async (
    department: string,
    testId: string
  ): Promise<ApiResponse<DiagnosticTestSession>> => {
    try {
      const response = await diagnosticClient.post(
        `/api/universal-diagnosis/department/${department}/start-test`,
        { test_id: testId }
      );
      if (response.data?.success && response.data.data) {
        return response.data;
      }
    } catch (error) {
      // fall through to mock
    }

    const mock = MOCK_TEST_BANK[testId];
    if (!mock) {
      return {
        success: false,
        message: '해당 테스트가 준비되어 있지 않습니다.',
      };
    }

    const sessionId = createMockSessionId();
    mockSessions.set(sessionId, { testId, answers: mock.answerKey });

    return {
      success: true,
      data: {
        test_session_id: sessionId,
        test_id: testId,
        test_info: mock.info,
        questions: mock.questions,
      },
    };
  },
  submitTest: async (
    department: string,
    payload: { test_session_id: string; answers: Record<string, string>; test_id: string }
  ): Promise<ApiResponse<{ result_id: string }>> => {
    try {
      const response = await diagnosticClient.post(
        `/api/universal-diagnosis/department/${department}/submit-test`,
        payload
      );
      if (response.data?.success && response.data.data) {
        return response.data;
      }
    } catch (error) {
      // fall through to mock
    }

    const sessionEntry = mockSessions.get(payload.test_session_id);
    const bankEntry = MOCK_TEST_BANK[payload.test_id];
    if (!sessionEntry || !bankEntry) {
      return {
        success: false,
        message: '제출 세션을 확인할 수 없습니다.',
      };
    }

    const answerKey = bankEntry.answerKey;
    const questions = bankEntry.questions;
    const total = questions.length;
    let correctCount = 0;
    const answerDetails = questions.map((question) => {
      const submitted = payload.answers[question.id];
      const correct = answerKey[question.id];
      const isCorrect = submitted ? submitted === correct : false;
      if (isCorrect) correctCount += 1;
      return {
        question_id: question.id,
        prompt: question.prompt,
        selected: submitted ?? undefined,
        correct_answer: correct,
        is_correct: submitted ? isCorrect : undefined,
      };
    });

    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const feedback: string[] = [];
    if (score >= 85) feedback.push('아주 우수한 결과입니다. 현재 학습 수준을 유지하세요.');
    if (score < 85 && score >= 60) feedback.push('추가 학습이 조금 더 필요합니다. 오답 문항을 중심으로 복습하세요.');
    if (score < 60) feedback.push('기초 개념을 중심으로 보충 학습이 필요합니다.');

    const resultId = createMockResultId();
    const summary: DiagnosticTestResultSummary = {
      overall_score: score,
      compressions_per_minute: null,
      average_depth: null,
      arm_angle: null,
    };

    const result: DiagnosticTestResult = {
      result_id: resultId,
      test_id: payload.test_id,
      test_title: bankEntry.info.title,
      department: bankEntry.info.department,
      completed_at: new Date().toISOString(),
      score,
      feedback,
      answers: answerDetails,
      summary,
      raw_metrics: {
        total_questions: total,
        correct_count: correctCount,
      },
    };

    mockResults.set(resultId, result);
    mockSessions.delete(payload.test_session_id);

    return {
      success: true,
      data: { result_id: resultId },
    };
  },
  getResult: async (resultId: string): Promise<ApiResponse<DiagnosticTestResult>> => {
    try {
      const response = await diagnosticClient.get(`/api/universal-diagnosis/result/${resultId}`);
      if (response.data?.success && response.data.data) {
        return response.data;
      }
    } catch (error) {
      // fall back to mock
    }

    const mock = mockResults.get(resultId);
    if (!mock) {
      return {
        success: false,
        message: '결과 정보를 찾을 수 없습니다.',
      };
    }

    return {
      success: true,
      data: mock,
    };
  },
};

// 유틸리티 함수들

// Assignments API
export const assignmentsAPI = {
  // List assignments (server filters by role)
  list: async (): Promise<ApiResponse<AssignmentSummary[]>> => {
    const response = await api.get('/api/assignments');
    return response.data;
  },
  // Create assignment (professor)
  create: async (payload: CreateAssignmentPayload): Promise<ApiResponse<AssignmentSummary>> => {
    const response = await api.post('/api/assignments', payload);
    return response.data;
  },
  // Get assignment detail
  get: async (id: string): Promise<ApiResponse<AssignmentSummary>> => {
    const response = await api.get(`/api/assignments/${id}`);
    return response.data;
  },
  // Update status
  updateStatus: async (id: string, status: 'draft' | 'published' | 'closed'): Promise<ApiResponse<AssignmentSummary>> => {
    const response = await api.patch(`/api/assignments/${id}/status`, { status });
    return response.data;
  },
  // Submit upload metadata
  submit: async (id: string, payload: { note?: string; url?: string }): Promise<ApiResponse<{ id: string }>> => {
    const response = await api.post(`/api/assignments/${id}/submissions`, payload);
    return response.data;
  },
};

export const apiUtils = {
  // 토큰 저장
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },

  // 토큰 제거
  removeToken: () => {
    localStorage.removeItem('token');
  },

  // 사용자 정보 저장
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // 사용자 정보 조회
  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 사용자 정보 제거
  removeUser: () => {
    localStorage.removeItem('user');
  },

  // 인증 상태 확인
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // 전체 로그아웃
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

export default api;
