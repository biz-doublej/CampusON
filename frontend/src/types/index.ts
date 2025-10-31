// CampusON Frontend 타입 정의

// 지원되는 학과 타입
export type Department = 'nursing' | 'dental_hygiene' | 'physical_therapy';

export type SocialProvider = 'kakao' | 'google';

export interface SocialLinkSettings {
  connected: boolean;
  externalEmail: string | null;
  linkedAt: string | null;
}

export interface UserNotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  digest: boolean;
}

export interface UserAccountPreferences {
  language: string;
  timezone: string;
}

export interface UserSettings {
  account: UserAccountPreferences;
  notifications: UserNotificationPreferences;
  social: {
    kakao: SocialLinkSettings;
    google: SocialLinkSettings;
  };
}

export interface UserGrade {
  id: string;
  assignment_id: string;
  assignment_title: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent: number;
  completed_at: string;
  status: string;
  due_date: string | null;
}

export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string; // 경복대학교 이메일 (@kbu.ac.kr) 필수
  role: 'student' | 'professor' | 'admin';
  profile_image?: string;
  department?: Department;
  settings?: UserSettings;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UpdateUserSettingsPayload {
  account?: Partial<UserAccountPreferences>;
  notifications?: Partial<UserNotificationPreferences>;
}

export interface UpdateSocialLinkPayload {
  provider: SocialProvider;
  connected: boolean;
  externalEmail?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export type AssignmentType =
  | 'UPLOAD'
  | 'QUIZ'
  | 'PROJECT'
  | 'PRACTICAL'
  | 'PRESENTATION'
  | 'REFLECTION'
  | 'CLINICAL';

export type SubmissionMethod =
  | 'file'
  | 'link'
  | 'quiz'
  | 'presentation'
  | 'in_person'
  | 'lab_report'
  | 'portfolio'
  | 'simulation';

export interface AssignmentResource {
  title: string;
  url: string;
  description?: string;
  type?: string;
}

export interface AssignmentConfig {
  instructions?: string;
  submissionMethod?: SubmissionMethod | string;
  deliverables?: string[];
  checklist?: string[];
  allowLate?: boolean;
  latePolicy?: string;
  groupWork?: {
    enabled: boolean;
    minSize?: number;
    maxSize?: number;
  };
  grading?: {
    maxScore?: number;
    rubric?: string;
  };
  evaluationCriteria?: string[];
  notifyBeforeDays?: number;
  additionalNotes?: string;
}

export interface AssignmentSummary {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'draft' | 'published' | 'closed';
  type: AssignmentType;
  config?: AssignmentConfig | null;
  tags?: string[];
  resources?: AssignmentResource[];
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  due_date: string;
  status?: 'draft' | 'published' | 'closed';
  type: AssignmentType;
  config?: AssignmentConfig | null;
  tags?: string[];
  resources?: AssignmentResource[];
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
  type: AssignmentType;
  config?: AssignmentConfig | null;
  tags?: string[];
  resources?: AssignmentResource[];
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

export interface StudentDashboardSummary {
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

export interface AdminStatsResponse {
  total_users: number;
  active_users: number;
  total_students: number;
  total_professors: number;
  total_assignments: number;
  average_score: number;
  system_health: number;
  total_courses?: number;
  recent_activities: Activity[];
}

export interface UserGrowthPoint {
  period: string;
  count: number;
}

export interface AssignmentTrendPoint {
  period: string;
  submissions: number;
  average_score: number;
}

export interface DepartmentPerformancePoint {
  department: string;
  average_score: number;
  test_count: number;
}

export interface ActivityHeatmapPoint {
  date: string;
  count: number;
}

export interface PracticeHoursPoint {
  department: string;
  hours: number;
}

export interface ScoreDistributionBucket {
  bucket: string;
  count: number;
}

export interface RecentAssignmentStat {
  title: string;
  submissions: number;
  average_score: number;
}

export interface AdminAnalyticsOverview {
  userGrowth: UserGrowthPoint[];
  assignmentTrend: AssignmentTrendPoint[];
  departmentPerformance: DepartmentPerformancePoint[];
  activityHeatmap: ActivityHeatmapPoint[];
  practiceHours: PracticeHoursPoint[];
  scoreDistribution: ScoreDistributionBucket[];
  recentAssignments: RecentAssignmentStat[];
}

export interface AdminReportsSummary {
  roleCounts: Record<string, number>;
  deptCounts: Record<string, number>;
  assignmentCounts: Record<string, number>;
}

export interface KnowledgeListItem {
  id: number;
  text_preview: string;
  meta?: Record<string, unknown> | null;
  created_at?: string | null;
}

export interface AdminMonitorNode {
  uptime_sec: number;
  version: string;
  latency_ms: number;
  memory_mb: number;
  cpu_load: number;
}

export interface AdminMonitorDatabase {
  ok: boolean;
  latency_ms?: number | null;
}

export interface AdminMonitorPythonApi {
  ok: boolean;
  version?: string | null;
  latency_ms?: number | null;
  base: string;
}

export interface AdminMonitorWebServer {
  ok: boolean;
  latency_ms?: number | null;
  url: string;
}

export interface AdminMonitorFileServer {
  ok: boolean;
  note?: string;
}

export interface AdminMonitorStats {
  total_assignments: number;
  average_score: number;
}

export interface AdminMonitorSnapshot {
  node: AdminMonitorNode;
  database: AdminMonitorDatabase;
  api_server: { ok: boolean; port: string };
  python_api: AdminMonitorPythonApi;
  web_server: AdminMonitorWebServer;
  file_server: AdminMonitorFileServer;
  stats: AdminMonitorStats;
}

export interface CommunityBoardSummary {
  id: number;
  name: string;
  is_anonymous?: boolean;
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

export type DashboardStatsResponse =
  | DashboardStats
  | ProfessorDashboardStats
  | StudentDashboardSummary;

// 권한 체크 타입
export type UserRole = 'student' | 'professor' | 'admin';
export type PermissionLevel = 'read' | 'write' | 'admin';

export interface Permission {
  resource: string;
  level: PermissionLevel;
  roles: UserRole[];
}

export interface RagStatus {
  total_chunks: number;
  index_exists: boolean;
  vector_count: number;
  dimension?: number | null;
  index_size: number;
  last_built?: string | null;
  index_path?: string | null;
  ids_path?: string | null;
  faiss_available: boolean;
}

export interface RagQueryResult {
  text: string;
  meta?: Record<string, unknown> | null;
  score?: number | null;
}

export interface RagBuildResponse {
  success: boolean;
  error?: string;
  count?: number;
  index_path?: string;
  ids_path?: string;
  status: RagStatus;
}

export interface RagQueryResponse {
  success: boolean;
  results: RagQueryResult[];
}

export interface RagIngestResponse {
  success: boolean;
  ingested: number;
  index_build?: RagBuildResponse | null;
  status: RagStatus;
}

export type RagUploadResponse = RagIngestResponse;

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

export interface AdminSystemSettings {
  enablePdfParsing?: boolean;
  enableGlobalChat?: boolean;
  defaultTheme?: 'light' | 'dark' | 'auto';
  analytics?: { enabled: boolean };
  compactMode?: boolean;
  animation?: boolean;
  showSystemBanner?: boolean;
  language?: string;
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
