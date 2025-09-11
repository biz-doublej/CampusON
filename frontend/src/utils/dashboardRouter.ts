/**
 * Dynamic Dashboard Router
 * Routes users to appropriate dashboards based on their real role and department data
 * No hardcoding - all routing decisions are based on user data from authentication
 */

import type { User, Department } from '../types';
import { getDepartmentDashboardPath, normalizeDepartment } from '../config/departments';

interface DashboardRoute {
  path: string;
  name: string;
  description: string;
}

export class DynamicDashboardRouter {
  /**
   * Get the appropriate dashboard route for a user based on their authenticated data
   */
  static getRouteForUser(user: User): DashboardRoute {
    const { role, department } = user;

    // Route based on role hierarchy (case-insensitive)
    const normalizedRole = role?.toLowerCase();
    
    switch (normalizedRole) {
      case 'admin':
        return {
          path: '/admin',
          name: '관리자 대시보드',
          description: '시스템 관리 및 사용자 관리'
        };

      case 'professor':
        return {
          path: '/professor',
          name: '교수 대시보드', 
          description: '강의 관리 및 학생 평가'
        };

      case 'student':
        // Students are routed based on their department
        if (department) {
          try {
            const depKey = normalizeDepartment(department as any);
            const departmentPath = getDepartmentDashboardPath(depKey);
            const departmentName = this.getDepartmentDisplayName(depKey);
            
            return {
              path: departmentPath,
              name: `${departmentName} 학생 대시보드`,
              description: `${departmentName} 전용 학습 관리`
            };
          } catch (error) {
            console.warn('Department routing failed, using general student dashboard:', error);
            // Fallback to general student dashboard if department routing fails
            return {
              path: '/student',
              name: '학생 대시보드',
              description: '일반 학습 관리'
            };
          }
        } else {
          // Fallback for students without department assignment
          return {
            path: '/student',
            name: '학생 대시보드',
            description: '일반 학습 관리'
          };
        }

      default:
        // Fallback for unrecognized roles
        console.warn('Unrecognized role, using default dashboard:', normalizedRole);
        return {
          path: '/dashboard',
          name: '기본 대시보드',
          description: '기본 사용자 인터페이스'
        };
    }
  }

  /**
   * Get display name for department
   */
  static getDepartmentDisplayName(department: Department): string {
    const departmentNames: Record<Department, string> = {
      'nursing': '간호학부',
      'dental_hygiene': '치위생학부',
      'physical_therapy': '물리치료학과'
    };

    return departmentNames[department] || department;
  }

  /**
   * Validate if user has access to a specific dashboard route
   */
  static canAccessRoute(user: User, targetPath: string): boolean {
    const userRoute = this.getRouteForUser(user);
    
    // Admin can access all routes
    if (user.role?.toLowerCase() === 'admin') {
      return true;
    }

    // Check if the target path matches user's authorized route
    return userRoute.path === targetPath;
  }

  /**
   * Get all available routes for a user
   */
  static getAvailableRoutes(user: User): DashboardRoute[] {
    const routes: DashboardRoute[] = [];
    const userRoute = this.getRouteForUser(user);
    
    // Always include user's primary route
    routes.push(userRoute);

    // Admin can access additional routes
    if (user.role?.toLowerCase() === 'admin') {
      routes.push(
        {
          path: '/professor',
          name: '교수 대시보드',
          description: '교수용 인터페이스'
        },
        {
          path: '/student',
          name: '학생 대시보드',
          description: '학생용 인터페이스'
        }
      );
    }

    return routes;
  }

  /**
   * Dynamic redirect based on user authentication state
   */
  static getDynamicRedirect(user: User | null): string {
    if (!user) {
      return '/auth/login';
    }

    return this.getRouteForUser(user).path;
  }

  /**
   * Get dashboard metadata for dynamic loading
   */
  static getDashboardMetadata(user: User): {
    title: string;
    features: string[];
    permissions: string[];
  } {
    const { role, department } = user;

    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          title: 'CampusON:경복 관리자',
          features: ['사용자 관리', 'PDF 파싱', '시스템 모니터링', '학과 관리'],
          permissions: ['read', 'write', 'delete', 'admin']
        };

      case 'professor':
        return {
          title: 'CampusON:경복 교수',
          features: ['강의 관리', '학생 평가', '과제 출제', '성적 관리'],
          permissions: ['read', 'write']
        };

      case 'student':
        const departmentName = department ? this.getDepartmentDisplayName(department) : '일반';
        return {
          title: `CampusON:경복 ${departmentName}`,
          features: ['과제 제출', '시험 응시', '성적 조회', '학습 분석'],
          permissions: ['read']
        };

      default:
        return {
          title: 'CampusON:경복',
          features: ['기본 기능'],
          permissions: ['read']
        };
    }
  }
}
