import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import type { User, DashboardStats } from '../../src/types';

const ProfessorDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // TODO: 교수 대시보드 통계 API 연동
    const fetchStats = async () => {
      try {
        // const response = await professorAPI.getStats();
        // if (response.success) {
        //   setStats(response.data);
        // }
        
        // 임시 데이터
        setStats({
          total_students: 45,
          total_assignments: 12,
          pending_reviews: 8,
          average_score: 82.5,
          recent_activities: []
        } as any);
      } catch (error) {
        console.error('교수 대시보드 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">CampusON:경복 - 교수</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-gray-700">안녕하세요, {user?.name || user?.user_id}님</span>
                  <p className="text-sm text-gray-500">교수</p>
                </div>
                
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  {user?.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt="Profile"
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <span className="text-gray-600 font-medium">
                      {user?.name?.charAt(0) || '교'}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition duration-200"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        담당 학생
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(stats as any)?.total_students || 0}명
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        출제한 과제
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(stats as any)?.total_assignments || 0}개
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        검토 대기
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(stats as any)?.pending_reviews || 0}건
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        평균 점수
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(stats as any)?.average_score ? `${(stats as any).average_score.toFixed(1)}점` : 'N/A'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* 교수 전용 액션 버튼 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => router.push('/professor/students')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">학생 관리</h3>
                <p className="text-blue-100">담당 학생들의 학습 현황을 관리하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/professor/questions')}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">문제 관리</h3>
                <p className="text-green-100">PDF 파싱 결과를 검토하고 문제를 관리하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/professor/assignments')}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">과제 출제</h3>
                <p className="text-purple-100">새로운 과제를 출제하고 관리하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/professor/analytics')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">분석 리포트</h3>
                <p className="text-indigo-100">학생들의 학습 데이터를 분석하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/professor/upload')}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">PDF 업로드</h3>
                <p className="text-orange-100">문제 PDF를 업로드하고 파싱하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/professor/settings')}
                className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">설정</h3>
                <p className="text-gray-100">교수 계정 설정을 관리하세요</p>
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ProfessorDashboard;