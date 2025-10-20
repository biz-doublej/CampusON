// CampusON Frontend 타입 정의

// 지원되는 학과 타입
export type Department = 'nursing' | 'dental_hygiene' | 'physical_therapy';

export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string; // 경복대학교 이메일 (@kbu.ac.kr) 필수
  role: 'student' | 'professor' | 'admin';
  profile_image?: string;
  department?: Department;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string; // 경복대학교 이메일 (@kbu.ac.kr) 필수
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string; // 경복대학교 이메일 (@kbu.ac.kr) 필수
  password: string;
  role: 'student' | 'professor';
  department?: Department;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  category: string;
  difficulty: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  due_date: string;
  created_by: string;
  status: 'draft' | 'published' | 'closed';
}

export interface TestResult {
  id: string;
  user_id: string;
  assignment_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent: number;
  completed_at: string;
}

export interface DashboardStats {
  total_assignments: number;
  completed_assignments: number;
  average_score: number;
  recent_activities: Activity[];
}

export interface Activity {
  id: string;
  type: 'assignment' | 'test' | 'grade' | 'login' | 'upload';
  title: string;
  description: string;
  timestamp: string;
}

// 권한별 대시보드 통계 타입
export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  total_courses: number;
  system_health: number;
  recent_activities: Activity[];
}

export interface ProfessorDashboardStats {
  total_students: number;
  total_assignments: number;
  pending_reviews: number;
  average_score: number;
  recent_activities: Activity[];
}

export interface StudentDashboardStats {
  total_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  average_score: number;
  recent_activities: Activity[];
}

// 네비게이션 메뉴 타입
export interface NavigationItem {
  name: string;
  href: string;
  icon?: string;
  current?: boolean;
  children?: NavigationItem[];
}

export interface RoleBasedNavigation {
  admin: NavigationItem[];
  professor: NavigationItem[];
  student: NavigationItem[];
}

// 권한 체크 타입
export type UserRole = 'student' | 'professor' | 'admin';
export type PermissionLevel = 'read' | 'write' | 'admin';

export interface Permission {
  resource: string;
  level: PermissionLevel;
  roles: UserRole[];
}

// 파일 업로드 관련 타입
export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploaded_at: string;
  uploaded_by: string;
}

// 시스템 설정 타입
export interface SystemSettings {
  site_name: string;
  site_description: string;
  max_file_size: number;
  allowed_file_types: string[];
  email_notifications: boolean;
  maintenance_mode: boolean;
}

// 알림 타입
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  user_id: string;
}

export interface ProfessorAnalyticsSummary {
  totalStudents: number;
  totalAssignments: number;
  assignmentsPublished: number;
  pendingReviews: number;
  averageScore: number;
  completionRate: number;
  submissions: number;
  expectedSubmissions: number;
}

export interface ProfessorScoreDistributionBucket {
  label: string;
  count: number;
  percentage: number;
}

export interface ProfessorAssignmentPerformance {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  submissionCount: number;
  averageScore: number;
  completionRate: number;
}

export interface ProfessorCompletionTrendPoint {
  key: string;
  label: string;
  submissions: number;
}

export interface ProfessorTopStudent {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string | null;
  averageScore: number;
  submissions: number;
}

export interface ProfessorAnalyticsData {
  summary: ProfessorAnalyticsSummary;
  scoreDistribution: ProfessorScoreDistributionBucket[];
  assignmentPerformance: ProfessorAssignmentPerformance[];
  completionTrend: ProfessorCompletionTrendPoint[];
  topStudents: ProfessorTopStudent[];
}
