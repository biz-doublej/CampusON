import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { getDepartmentInfo } from '../../src/config/departments';
import type { User } from '../../src/types';

const DentalHygieneDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const departmentInfo = getDepartmentInfo('dental_hygiene');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // 치위생학부가 아닌 사용자는 접근 제한
      if (userData.department !== 'dental_hygiene') {
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

  // 치위생학부 전용 메뉴
  const dentalHygieneMenus = [
    {
      title: '임상 치위생 실습',
      description: '치과 임상 실습 및 환자 케어',
      icon: '🦷',
      color: 'bg-green-500',
      items: ['스케일링 실습', '환자 상담', '구강 검진']
    },
    {
      title: '구강 보건 교육',
      description: '구강 건강 교육 및 예방 프로그램',
      icon: '📚',
      color: 'bg-blue-500',
      items: ['칫솔질 교육', '불소 도포', '구강 건강 상담']
    },
    {
      title: '방사선 촬영',
      description: '구강 방사선 촬영 및 판독',
      icon: '📷',
      color: 'bg-purple-500',
      items: ['파노라마 촬영', '덴탈 X-ray', '방사선 안전']
    },
    {
      title: '치위생 연구',
      description: '치위생학 연구 및 임상 데이터 분석',
      icon: '🔬',
      color: 'bg-orange-500',
      items: ['임상 연구', '통계 분석', '논문 작성']
    }
  ];

  const quickStats = [
    { label: '완료한 실습 시간', value: '180시간', color: 'text-green-600' },
    { label: '환자 치료 건수', value: '45건', color: 'text-blue-600' },
    { label: '방사선 촬영', value: '28회', color: 'text-purple-600' },
    { label: '구강 교육 횟수', value: '12회', color: 'text-orange-600' }
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
          <div className="mb-8 p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
            <h2 className="text-2xl font-bold mb-2">
              {departmentInfo.name}에 오신 것을 환영합니다! 🦷
            </h2>
            <p className="text-green-100">
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

          {/* 치위생학부 전용 메뉴 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dentalHygieneMenus.map((menu, index) => (
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
                <div className="flex items-center p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    치
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">스케일링 실습 완료</p>
                    <p className="text-sm text-gray-600">환자 3명에 대한 스케일링 치료를 성공적으로 완료했습니다.</p>
                  </div>
                  <span className="text-sm text-gray-500">3시간 전</span>
                </div>
                
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    교
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">구강 보건 교육 실시</p>
                    <p className="text-sm text-gray-600">초등학생 대상 칫솔질 교육을 진행했습니다.</p>
                  </div>
                  <span className="text-sm text-gray-500">1일 전</span>
                </div>

                <div className="flex items-center p-4 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    촬
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">방사선 촬영 실습</p>
                    <p className="text-sm text-gray-600">파노라마 촬영 및 덴탈 X-ray 촬영을 완료했습니다.</p>
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

export default DentalHygieneDashboard;