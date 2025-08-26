import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import type { User, DashboardStats } from '../../src/types';

const StudentDashboard: React.FC = () => {
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

    // TODO: 학생 대시보드 통계 API 연동
    const fetchStats = async () => {
      try {
        // const response = await studentAPI.getStats();
        // if (response.success) {
        //   setStats(response.data);
        // }
        
        // 임시 데이터
        setStats({
          total_assignments: 15,
          completed_assignments: 12,
          average_score: 78.3,
          recent_activities: []
        });
        
        // 추가 학생 통계 정보는 별도로 관리
        // setPendingAssignments(3);
      } catch (error) {
        console.error('학생 대시보드 데이터 로딩 실패:', error);
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
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">CampusON:경복 - 학생</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-gray-700">안녕하세요, {user?.name || user?.user_id}님</span>
                  <p className="text-sm text-gray-500">학생</p>
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
                      {user?.name?.charAt(0) || '학'}
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
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        총 과제
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.total_assignments || 0}개
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
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        완료한 과제
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.completed_assignments || 0}개
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
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        대기중인 과제
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {((stats?.total_assignments || 0) - (stats?.completed_assignments || 0)) || 0}개
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
                        {stats?.average_score ? `${stats.average_score.toFixed(1)}점` : 'N/A'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* 학생 전용 액션 버튼 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => router.push('/student/diagnostic')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">진단 테스트</h3>
                <p className="text-blue-100">나의 학습 수준을 확인해보세요</p>
              </button>
              
              <button
                onClick={() => router.push('/student/assignments')}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">과제 목록</h3>
                <p className="text-green-100">할당된 과제를 확인하고 제출하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/student/practice')}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">문제 연습</h3>
                <p className="text-purple-100">다양한 문제로 연습해보세요</p>
              </button>
              
              <button
                onClick={() => router.push('/student/analysis')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">학습 분석</h3>
                <p className="text-indigo-100">나의 학습 패턴을 분석해보세요</p>
              </button>
              
              <button
                onClick={() => router.push('/student/grades')}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">성적 확인</h3>
                <p className="text-orange-100">나의 성적과 진도를 확인하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/student/settings')}
                className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">설정</h3>
                <p className="text-gray-100">학생 계정 설정을 관리하세요</p>
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDashboard;