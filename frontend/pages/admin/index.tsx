import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import ChatWidget from '../../src/components/chat/ChatWidget';
import FileUploader from '../../src/components/FileUploader';
import ParsedResultViewer from '../../src/components/ParsedResultViewer';
import type { User, DashboardStats } from '../../src/types';
import { ParsedResult } from '../../src/services/parserService';
import { adminAPI } from '../../src/services/api';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
  const [showParser, setShowParser] = useState<boolean>(false);

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // TODO: 관리자 대시보드 통계 API 연동
    const fetchStats = async () => {
      try {
        // const response = await adminAPI.getStats();
        // if (response.success) {
        //   setStats(response.data);
        // }
        
        // 임시 데이터
        setStats({
          total_users: 150,
          active_users: 132,
          total_courses: 25,
          system_health: 98.5,
          recent_activities: []
        } as any);
      } catch (error) {
        console.error('관리자 대시보드 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Load real admin stats (non-blocking fallback over initial placeholders)
  useEffect(() => {
    (async () => {
      try {
        const res = await adminAPI.getStats();
        if (res.success && res.data) setStats(res.data);
      } catch (e) {
        // ignore: keep placeholders
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const handleParseComplete = (result: ParsedResult) => {
    setParsedResult(result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">CampusON:경복 - 관리자</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-gray-700">안녕하세요, {user?.name || user?.user_id}님</span>
                  <p className="text-sm text-gray-500">관리자</p>
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
                      {user?.name?.charAt(0) || '관'}
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
            {/* PDF 파싱 결과 표시 */}
            {parsedResult && (
              <div className="mb-8 bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">파싱 결과</h2>
                  <button
                    onClick={() => setParsedResult(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    결과 닫기
                  </button>
                </div>
                <ParsedResultViewer result={parsedResult} />
              </div>
            )}

            {/* PDF 파서 섹션 */}
            {showParser && (
              <div className="mb-8 bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">PDF 문서 파싱</h2>
                  <button
                    onClick={() => setShowParser(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    파서 닫기
                  </button>
                </div>
                <FileUploader onParseComplete={handleParseComplete} />
              </div>
            )}
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
                        총 사용자
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(stats as any)?.total_users || 0}명
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
                        활성 사용자
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(stats as any)?.active_users || 0}명
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
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        총 과정
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(stats as any)?.total_courses || 0}개
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
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        시스템 상태
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {(stats as any)?.system_health ? `${(stats as any).system_health}%` : 'N/A'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* 관리자 전용 액션 버튼 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button
                onClick={() => setShowParser(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">PDF 문서 파싱</h3>
                <p className="text-indigo-100">문제 PDF 파일을 업로드하고 자동으로 분석하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/admin/users')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">사용자 관리</h3>
                <p className="text-blue-100">시스템 사용자들을 관리하고 권한을 설정하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/admin/courses')}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">과정 관리</h3>
                <p className="text-green-100">교육 과정과 커리큘럼을 관리하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/admin/system')}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">시스템 설정</h3>
                <p className="text-purple-100">시스템 환경과 설정을 관리하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/admin/reports')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">통계 리포트</h3>
                <p className="text-yellow-100">전체 시스템 통계와 분석 리포트를 확인하세요</p>
              </button>
              
              <button
                onClick={() => router.push('/admin/monitoring')}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-6 text-left transition duration-200"
              >
                <h3 className="text-lg font-medium mb-2">시스템 모니터링</h3>
                <p className="text-red-100">시스템 성능과 오류를 모니터링하세요</p>
              </button>
            </div>
          </div>
        </main>
        {/* Chat widget (school info bot) */}
        <ChatWidget title="학교 안내 봇" />
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
