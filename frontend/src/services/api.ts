import axios from 'axios';
import { LoginRequest, RegisterRequest, User, ApiResponse, ProfessorAnalyticsData } from '@/types';
import { getApiUrl } from '../utils/config';

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
};

// 대시보드 API
export const dashboardAPI = {
  // 통계 조회
  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  // 활동 조회
  getActivities: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/api/dashboard/activities');
    return response.data;
  },
};

// v2 Dashboard API with dynamic stats
export const dashboardAPIV2 = {
  getStats: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/api/dashboard/v2/stats');
      return response.data;
    } catch (e) {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    }
  },
  getActivities: async (): Promise<ApiResponse<any[]>> => {
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
  getStudents: async (department?: string): Promise<ApiResponse<any[]>> => {
    const params = department ? { department } : undefined;
    const response = await api.get('/api/users/students', { params });
    return response.data;
  },
  // Get user detail
  getUser: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },
  // Get user grades
  getUserGrades: async (userId: string): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/api/users/${userId}/grades`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },
  getMonitor: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/admin/monitor');
    return response.data;
  },
  getSettings: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/admin/settings');
    return response.data;
  },
  updateSettings: async (payload: any): Promise<ApiResponse<any>> => {
    const response = await api.put('/api/admin/settings', payload);
    return response.data;
  },
  listUsers: async (params?: { role?: string; department?: string; q?: string }): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },
  getReports: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/admin/reports');
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

// Students API
export const studentsAPI = {
  getMyPracticeHours: async (): Promise<ApiResponse<{ total_hours: number }>> => {
    const response = await api.get('/api/students/me/practice-hours');
    return response.data;
  },
};

// 유틸리티 함수들

// Assignments API
export const assignmentsAPI = {
  // List assignments (server filters by role)
  list: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/api/assignments');
    return response.data;
  },
  // Create assignment (professor)
  create: async (payload: { title: string; description: string; due_date: string; status?: 'draft' | 'published' }): Promise<ApiResponse<any>> => {
    const response = await api.post('/api/assignments', payload);
    return response.data;
  },
  // Get assignment detail
  get: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/api/assignments/${id}`);
    return response.data;
  },
  // Update status
  updateStatus: async (id: string, status: 'draft' | 'published' | 'closed'): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/api/assignments/${id}/status`, { status });
    return response.data;
  },
  // Submit upload metadata
  submit: async (id: string, payload: { note?: string; url?: string }): Promise<ApiResponse<any>> => {
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
