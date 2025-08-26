import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      // Prevent multiple redirects
      if (redirecting) {
        return;
      }

      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        console.log('ProtectedRoute check:', { hasToken: !!token, hasUser: !!userStr });

        if (!token || !userStr) {
          console.log('Missing token or user data, redirecting to login');
          setRedirecting(true);
          router.replace('/auth/login').catch(console.error);
          return;
        }

        const user: User = JSON.parse(userStr);
        console.log('ProtectedRoute user:', user);
        
        // 권한 확인
        if (allowedRoles && allowedRoles.length > 0) {
          const userRole = user.role?.toLowerCase();
          const hasPermission = allowedRoles.some(role => role.toLowerCase() === userRole);
          
          if (!hasPermission) {
            console.log('User does not have required permissions:', { userRole, allowedRoles });
            // 권한이 없는 경우 기본 대시보드로 리다이렉트
            setRedirecting(true);
            router.replace('/dashboard').catch(console.error);
            return;
          }
        }

        console.log('User authorized successfully');
        setAuthorized(true);
      } catch (error) {
        console.error('Authentication error:', error);
        // 사용자 데이터 오류 시 로그아웃 처리
        try {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        } catch (localStorageError) {
          console.error('LocalStorage error:', localStorageError);
        }
        setRedirecting(true);
        router.replace('/auth/login').catch(console.error);
      } finally {
        setLoading(false);
      }
    };

    // Delay the auth check to prevent hydration issues
    const timeoutId = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timeoutId);
  }, [router, allowedRoles, redirecting]);

  // SSR과 클라이언트 렌더링 간 일관성 유지
  if (!mounted || loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {redirecting ? 'Redirecting...' : 'Authenticating...'}
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setRedirecting(true);
                router.replace('/').catch(console.error);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200 mr-2"
            >
              Go Home
            </button>
            <button
              onClick={() => {
                setRedirecting(true);
                router.back();
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;