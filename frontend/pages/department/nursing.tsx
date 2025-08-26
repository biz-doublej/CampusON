import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { getDepartmentInfo } from '../../src/config/departments';
import type { User } from '../../src/types';

const NursingDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const departmentInfo = getDepartmentInfo('nursing');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // 간호학부가 아닌 사용자는 접근 제한
      if (userData.department !== 'nursing') {
        router.push('/dashboard');
        return;
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  // 간호학부 전용 메뉴
  const nursingMenus = [
    {
      title: '임상 실습 관리',
      description: '병원 실습 일정 및 평가 관리',
      icon: '🏥',
      color: 'bg-blue-500',
      items: ['실습 일정', '실습 평가', '실습 보고서']
    },
    {
      title: '간호 시뮬레이션',
      description: '가상 환자 케어 시뮬레이션 및 훈련',
      icon: '🩺',
      color: 'bg-green-500',
      items: ['시뮬레이션 시나리오', '케어 플랜', '응급 처치']
    },
    {
      title: '약물 관리 학습',
      description: '약물 투여 및 관리 교육',
      icon: '💊',
      color: 'bg-purple-500',
      items: ['약물 계산', '투여 방법', '부작용 관리']
    },
    {
      title: '간호 연구',
      description: '간호학 연구 프로젝트 및 논문',
      icon: '📊',
      color: 'bg-orange-500',
      items: ['연구 방법론', '데이터 분석', '논문 작성']
    }
  ];

  const quickStats = [
    { label: '완료한 실습 시간', value: '240시간', color: 'text-blue-600' },
    { label: '시뮬레이션 점수', value: '95점', color: 'text-green-600' },
    { label: '이번 학기 과제', value: '8개', color: 'text-purple-600' },
    { label: '실습 평가', value: 'A등급', color: 'text-orange-600' }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className={`w-10 h-10 ${departmentInfo.color} rounded-lg flex items-center justify-center text-white text-xl mr-3`}>
                  {departmentInfo.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">CampusON:경복</h1>
                  <p className="text-sm text-gray-600">{departmentInfo.name} 대시보드</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  안녕하세요, {user?.name}님
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* 웰컴 섹션 */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
            <h2 className="text-2xl font-bold mb-2">
              {departmentInfo.name}에 오신 것을 환영합니다! 🏥
            </h2>
            <p className="text-blue-100">
              {departmentInfo.description}
            </p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{stat.label}</h3>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* 간호학부 전용 메뉴 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nursingMenus.map((menu, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${menu.color} rounded-lg flex items-center justify-center text-white text-xl mr-4`}>
                      {menu.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{menu.title}</h3>
                      <p className="text-sm text-gray-600">{menu.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {menu.items.map((item, itemIndex) => (
                      <div 
                        key={itemIndex}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700">{item}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 최근 활동 */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    실
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">임상 실습 완료</p>
                    <p className="text-sm text-gray-600">내과 병동 실습을 성공적으로 완료했습니다.</p>
                  </div>
                  <span className="text-sm text-gray-500">2시간 전</span>
                </div>
                
                <div className="flex items-center p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    시
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">시뮬레이션 훈련 완료</p>
                    <p className="text-sm text-gray-600">응급실 시나리오 시뮬레이션에서 A등급을 받았습니다.</p>
                  </div>
                  <span className="text-sm text-gray-500">1일 전</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default NursingDashboard;