import React, { useState } from 'react';
import { useRouter } from 'next/router';
import type { NavigationItem, UserRole } from '../types';

interface NavigationProps {
  role: UserRole;
  currentPath: string;
}

const Navigation: React.FC<NavigationProps> = ({ role, currentPath }) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 권한별 네비게이션 메뉴 정의
  const getNavigationItems = (role: UserRole): NavigationItem[] => {
    switch (role) {
      case 'admin':
        return [
          { name: '대시보드', href: '/admin', current: currentPath === '/admin' },
          { name: '사용자 관리', href: '/admin/users', current: currentPath === '/admin/users' },
          { name: '시스템 설정', href: '/admin/system', current: currentPath === '/admin/system' },
          { name: '통계 리포트', href: '/admin/reports', current: currentPath === '/admin/reports' },
        ];
      case 'professor':
        return [
          { name: '대시보드', href: '/professor', current: currentPath === '/professor' },
          { name: '학생 관리', href: '/professor/students', current: currentPath === '/professor/students' },
          { name: '문제 관리', href: '/professor/questions', current: currentPath === '/professor/questions' },
          { name: 'PDF 업로드', href: '/professor/upload', current: currentPath === '/professor/upload' },
        ];
      case 'student':
        return [
          { name: '대시보드', href: '/student', current: currentPath === '/student' },
          { name: '진단 테스트', href: '/student/diagnostic', current: currentPath === '/student/diagnostic' },
          { name: '과제 목록', href: '/student/assignments', current: currentPath === '/student/assignments' },
          { name: '성적 확인', href: '/student/grades', current: currentPath === '/student/grades' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems(role);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'admin': return '관리자';
      case 'professor': return '교수';
      case 'student': return '학생';
      default: return '사용자';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <button
                onClick={() => router.push(`/${role}`)}
                className="text-xl font-bold text-gray-900"
              >
                CampusON:경복
              </button>
              <span className="ml-3 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-full">
                {getRoleDisplayName(role)}
              </span>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    item.current
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;