import React from 'react';
import { useRouter } from 'next/router';
import { DynamicDashboardRouter } from '../src/utils/dashboardRouter';
import type { User } from '../src/types';

const HomePage: React.FC = () => {
  const router = useRouter();
  
  // 로그인 체크 및 리다이렉트 함수
  const handleLoginClick = () => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Home page login check:', { hasToken: !!token, hasUser: !!userStr });
    
    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        console.log('User found on homepage:', user);
        
        // 로그인한 사용자를 동적 라우팅으로 적절한 대시보드로 리다이렉트
        const route = DynamicDashboardRouter.getRouteForUser(user);
        console.log('Redirecting from homepage to:', route.path);
        router.push(route.path);
        return;
      } catch (error) {
        console.error('User data parsing error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    // 로그인되지 않은 경우 로그인 페이지로 이동
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 rounded-lg w-10 h-10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">CampusON:경복</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleLoginClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => router.push('/auth/register')}
                className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 transition-colors"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 히어로 섹션 */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            경복대학교 교육 플랫폼
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            전문적이고 혁신적인 교육 환경을 제공하여 학생들의 학습 성과를 극대화합니다.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleLoginClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              지금 시작하기
            </button>
            <button
              onClick={() => router.push('/auth/register')}
              className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium border-2 border-gray-300 transition-colors"
            >
              회원가입
            </button>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">주요 기능</h3>
            <p className="text-gray-600">각 역할별로 최적화된 교육 도구를 제공합니다</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">학생 학습 관리</h3>
              <p className="text-gray-600">
                개인별 학습 진도 추적, 과제 및 시험 관리를 통해 체계적인 학습을 지원합니다.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">교수 교육 도구</h3>
              <p className="text-gray-600">
                강의 관리, 학생 평가, 문제 은행 및 출제 등 교수 업무를 효율적으로 지원합니다.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">관리자 대시보드</h3>
              <p className="text-gray-600">
                시스템 전체 관리, 사용자 계정 관리, 통계 및 보고서 제공으로 운영을 지원합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 학교 소개 */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <div className="text-center">
            <h4 className="text-2xl font-semibold text-gray-900 mb-4">경복대학교와 함께하는 디지털 교육</h4>
            <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
              체계적인 커리큘럼과 최신 기술을 통해 학생들의 성공적인 미래를 지원합니다
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>전문적인 교육</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>체계적인 관리</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>안전한 시스템</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;

