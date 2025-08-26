import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { getDepartmentInfo } from '../../src/config/departments';
import type { User } from '../../src/types';

const PhysicalTherapyDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const departmentInfo = getDepartmentInfo('physical_therapy');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // 물리치료학과가 아닌 사용자는 접근 제한
      if (userData.department !== 'physical_therapy') {
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

  // 물리치료학과 전용 메뉴
  const physicalTherapyMenus = [
    {
      title: '재활 치료 실습',
      description: '환자 재활 치료 및 운동 처방',
      icon: '🏃‍♂️',
      color: 'bg-purple-500',
      items: ['운동 치료', '재활 평가', '기능 회복 훈련']
    },
    {
      title: '운동 기능 평가',
      description: '환자 운동 능력 평가 및 분석',
      icon: '📊',
      color: 'bg-blue-500',
      items: ['관절 가동범위', '근력 검사', '균형 평가']
    },
    {
      title: '물리 치료 기기',
      description: '치료 장비 사용법 및 실습',
      icon: '⚡',
      color: 'bg-yellow-500',
      items: ['전기 치료', '초음파 치료', '레이저 치료']
    },
    {
      title: '스포츠 재활',
      description: '운동선수 부상 예방 및 재활',
      icon: '🏅',
      color: 'bg-green-500',
      items: ['스포츠 마사지', '테이핑', '컨디셔닝']
    }
  ];

  const quickStats = [
    { label: '치료 세션 수', value: '156회', color: 'text-purple-600' },
    { label: '환자 만족도', value: '96%', color: 'text-blue-600' },
    { label: '재활 성공률', value: '88%', color: 'text-green-600' },
    { label: '실습 시간', value: '220시간', color: 'text-yellow-600' }
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
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white">
            <h2 className="text-2xl font-bold mb-2">
              {departmentInfo.name}에 오신 것을 환영합니다! 🏃‍♂️
            </h2>
            <p className="text-purple-100">
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

          {/* 물리치료학과 전용 메뉴 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {physicalTherapyMenus.map((menu, index) => (
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
                <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    재
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">재활 치료 실습 완료</p>
                    <p className="text-sm text-gray-600">뇌졸중 환자의 보행 훈련을 성공적으로 진행했습니다.</p>
                  </div>
                  <span className="text-sm text-gray-500">2시간 전</span>
                </div>
                
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    평
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">기능 평가 완료</p>
                    <p className="text-sm text-gray-600">어깨 관절 가동범위 측정 및 평가를 완료했습니다.</p>
                  </div>
                  <span className="text-sm text-gray-500">5시간 전</span>
                </div>

                <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    기
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">물리치료 기기 실습</p>
                    <p className="text-sm text-gray-600">전기 자극 치료 및 초음파 치료 실습을 진행했습니다.</p>
                  </div>
                  <span className="text-sm text-gray-500">1일 전</span>
                </div>

                <div className="flex items-center p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    스
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">스포츠 재활 워크샵</p>
                    <p className="text-sm text-gray-600">축구선수 부상 예방 및 테이핑 기법 교육을 받았습니다.</p>
                  </div>
                  <span className="text-sm text-gray-500">2일 전</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default PhysicalTherapyDashboard;