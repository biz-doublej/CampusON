/**
 * Dynamic Dashboard Component
 * Renders different dashboard layouts and content based on user authentication data
 * Eliminates hardcoding by using real user data to determine dashboard features
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { DynamicDashboardRouter } from '../../src/utils/dashboardRouter';
import { authAPI, dashboardAPI } from '../../src/services/api';
import type { User, DashboardStats } from '../../src/types';

interface DashboardFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  available: boolean;
}

const DynamicDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [features, setFeatures] = useState<DashboardFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      
      // Get user data from storage or API
      const userData = await getCurrentUser();
      if (!userData) {
        router.push('/auth/login');
        return;
      }

      setUser(userData);
      
      // Load dashboard-specific data
      await Promise.all([
        loadDashboardStats(userData),
        loadDashboardFeatures(userData)
      ]);

    } catch (error) {
      console.error('Dashboard initialization error:', error);
      setError('대시보드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async (): Promise<User | null> => {
    // Try to get user from localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }

    // If not in storage, try to get from API
    try {
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.error('Failed to get user profile:', error);
    }

    return null;
  };

  const loadDashboardStats = async (userData: User) => {
    try {
      const response = await dashboardAPI.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      // Use default stats based on user role
      setStats(getDefaultStats(userData));
    }
  };

  const loadDashboardFeatures = (userData: User) => {
    const metadata = DynamicDashboardRouter.getDashboardMetadata(userData);
    const dynamicFeatures = generateFeaturesForUser(userData, metadata);
    setFeatures(dynamicFeatures);
  };

  const getDefaultStats = (userData: User): DashboardStats => {
    // Generate appropriate default stats based on user role
    switch (userData.role?.toLowerCase()) {
      case 'admin':
        return {
          total_assignments: 0,
          completed_assignments: 0,
          average_score: 0,
          recent_activities: []
        };
      case 'professor':
        return {
          total_assignments: 0,
          completed_assignments: 0,
          average_score: 0,
          recent_activities: []
        };
      case 'student':
        return {
          total_assignments: 0,
          completed_assignments: 0,
          average_score: 0,
          recent_activities: []
        };
      default:
        return {
          total_assignments: 0,
          completed_assignments: 0,
          average_score: 0,
          recent_activities: []
        };
    }
  };

  const generateFeaturesForUser = (userData: User, metadata: any): DashboardFeature[] => {
    const baseFeatures: DashboardFeature[] = [];

    // Admin features
    if (userData.role?.toLowerCase() === 'admin') {
      baseFeatures.push(
        {
          id: 'user-management',
          title: '사용자 관리',
          description: '시스템 사용자 관리 및 권한 설정',
          icon: '👥',
          action: () => router.push('/admin/users'),
          available: true
        },
        {
          id: 'pdf-parsing',
          title: 'PDF 파싱',
          description: '국가고시 문제 PDF 파싱 및 관리',
          icon: '📄',
          action: () => router.push('/admin/parsing'),
          available: true
        },
        {
          id: 'system-monitoring',
          title: '시스템 모니터링',
          description: '시스템 상태 및 성능 모니터링',
          icon: '📊',
          action: () => router.push('/admin/monitoring'),
          available: true
        }
      );
    }

    // Professor features
    if (userData.role?.toLowerCase() === 'professor') {
      baseFeatures.push(
        {
          id: 'course-management',
          title: '강의 관리',
          description: '담당 강의 및 커리큘럼 관리',
          icon: '📚',
          action: () => router.push('/professor/courses'),
          available: true
        },
        {
          id: 'student-evaluation',
          title: '학생 평가',
          description: '학생 성적 입력 및 평가 관리',
          icon: '📝',
          action: () => router.push('/professor/evaluation'),
          available: true
        },
        {
          id: 'assignment-creation',
          title: '과제 출제',
          description: '과제 및 시험 문제 출제',
          icon: '✏️',
          action: () => router.push('/professor/assignments'),
          available: true
        }
      );
    }

    // Student features
    if (userData.role?.toLowerCase() === 'student') {
      baseFeatures.push(
        {
          id: 'assignments',
          title: '과제 관리',
          description: '할당된 과제 확인 및 제출',
          icon: '📋',
          action: () => router.push('/student/assignments'),
          available: true
        },
        {
          id: 'practice-tests',
          title: '모의고사',
          description: '국가고시 대비 모의고사 응시',
          icon: '📊',
          action: () => router.push('/student/tests'),
          available: true
        },
        {
          id: 'learning-analytics',
          title: '학습 분석',
          description: '개인 학습 패턴 및 성과 분석',
          icon: '📈',
          action: () => router.push('/student/analytics'),
          available: true
        }
      );

      // Department-specific features for students
      if (userData.department) {
        const departmentFeatures = getDepartmentSpecificFeatures(userData.department);
        baseFeatures.push(...departmentFeatures);
      }
    }

    return baseFeatures;
  };

  const getDepartmentSpecificFeatures = (department: string): DashboardFeature[] => {
    switch (department) {
      case 'nursing':
        return [
          {
            id: 'clinical-practice',
            title: '임상 실습',
            description: '병원 실습 일정 및 평가',
            icon: '🏥',
            action: () => router.push('/department/nursing/clinical'),
            available: true
          }
        ];
      case 'dental_hygiene':
        return [
          {
            id: 'dental-practice',
            title: '치과 실습',
            description: '치과 임상 실습 관리',
            icon: '🦷',
            action: () => router.push('/department/dental-hygiene/practice'),
            available: true
          }
        ];
      case 'physical_therapy':
        return [
          {
            id: 'therapy-practice',
            title: '재활 실습',
            description: '물리치료 실습 및 평가',
            icon: '🏃‍♂️',
            action: () => router.push('/department/physical-therapy/practice'),
            available: true
          }
        ];
      default:
        return [];
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={initializeDashboard}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const metadata = DynamicDashboardRouter.getDashboardMetadata(user);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Dynamic Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{metadata.title}</h1>
                <p className="text-sm text-gray-600">
                  {user.name}님, {user.role} • {user.department && DynamicDashboardRouter.getDepartmentDisplayName(user.department)}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Stats Section */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">총 과제</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.total_assignments}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">완료 과제</h3>
                <p className="text-2xl font-bold text-green-600">{stats.completed_assignments}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">평균 점수</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.average_score.toFixed(1)}점</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">최근 활동</h3>
                <p className="text-2xl font-bold text-orange-600">{stats.recent_activities.length}</p>
              </div>
            </div>
          )}

          {/* Dynamic Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`bg-white rounded-lg p-6 shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                  feature.available ? 'hover:border-blue-300' : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={feature.available ? feature.action : undefined}
              >
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-3">{feature.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{feature.description}</p>
                {!feature.available && (
                  <p className="text-gray-400 text-xs mt-2">준비 중입니다</p>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default DynamicDashboard;