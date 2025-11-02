import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { getDepartmentInfo, normalizeDepartment, getDepartmentDashboardPath } from '../../src/config/departments';
import ChatWidget from '../../src/components/chat/ChatWidget';
import type { ApiResponse, AssignmentSummary, DashboardStatsResponse, User } from '../../src/types';
import { dashboardAPIV2, assignmentsAPI, studentsAPI } from '../../src/services/api';

const DentalHygieneDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const info = getDepartmentInfo('dental_hygiene');

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [practiceHours, setPracticeHours] = useState<number>(0);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr) as User;
        setUser(parsedUser);
        const depKey = parsedUser?.department ? normalizeDepartment(parsedUser.department) : null;
        if (depKey && depKey !== 'dental_hygiene') {
          const path = getDepartmentDashboardPath(depKey);
          if (router.asPath !== path) router.replace(path).catch(() => void 0);
        }
      } catch {
        // ignore invalid persisted user data
      }
    }
  }, [router]);

  useEffect(() => {
    const safeFetch = async <T,>(fetcher: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
      try {
        return await fetcher();
      } catch {
        return { success: false };
      }
    };

    (async () => {
      try {
        const [statsRes, assignmentsRes, practiceRes] = await Promise.all([
          safeFetch(() => dashboardAPIV2.getStats()),
          safeFetch(() => assignmentsAPI.list()),
          safeFetch(() => studentsAPI.getMyPracticeHours()),
        ]);

        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (assignmentsRes.success && Array.isArray(assignmentsRes.data)) setAssignments(assignmentsRes.data);
        if (practiceRes.success && practiceRes.data) setPracticeHours(practiceRes.data.total_hours ?? 0);
      } catch {
        // ignore network errors so other data can still render
      }
    })();
  }, []);

  const totalAssignments = stats?.total_assignments ?? 0;
  const completedAssignments =
    stats && 'completed_assignments' in stats ? stats.completed_assignments ?? 0 : 0;
  const averageScore =
    stats && 'average_score' in stats ? Number(stats.average_score ?? 0) : 0;

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return assignments.filter((x) => new Date(x.due_date).getTime() > now).length;
  }, [assignments]);

  const quickStats = [
    { label: '전체 과제 수', value: String(totalAssignments), color: 'text-blue-600' },
    { label: '완료/다가오는 과제', value: `${completedAssignments} / ${upcomingCount}`, color: 'text-purple-600' },
    { label: '평균 점수', value: `${Math.round(averageScore)}%`, color: 'text-green-600' },
    { label: '실습 시간', value: `${practiceHours}시간`, color: 'text-orange-600' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className={`w-10 h-10 ${info.color} rounded-lg flex items-center justify-center text-white text-xl mr-3`}>
                  {info.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">CampusON</h1>
                  <p className="text-sm text-gray-600">{info.name} 대시보드</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">안녕하세요, {user?.name}님</span>
                <button onClick={() => { localStorage.clear(); router.push('/auth/login'); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">로그아웃</button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
            <h2 className="text-2xl font-bold mb-2">{info.name} 학생 대시보드</h2>
            <p className="text-green-100">{info.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickStats.map((s, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{s.label}</h3>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => router.push('/community/boards')} className="bg-white border hover:bg-gray-50 rounded-lg p-4 text-left">
              <div className="text-lg font-semibold mb-1">커뮤니티</div>
              <div className="text-sm text-gray-600">학과 커뮤니티 게시판으로 이동합니다.</div>
            </button>
            <button onClick={() => router.push('/notice-embed')} className="bg-white border hover:bg-gray-50 rounded-lg p-4 text-left">
              <div className="text-lg font-semibold mb-1">학교 공지</div>
              <div className="text-sm text-gray-600">학교 공지사항을 확인하세요.</div>
            </button>
            <button onClick={() => router.push('/student/assignments')} className="bg-white border hover:bg-gray-50 rounded-lg p-4 text-left">
              <div className="text-lg font-semibold mb-1">과제/학업</div>
              <div className="text-sm text-gray-600">과제와 학업 일정을 확인하세요.</div>
            </button>
            <button
              onClick={() => router.push('/student/diagnostic?department=dental_hygiene')}
              className="bg-white border hover:bg-gray-50 rounded-lg p-4 text-left"
            >
              <div className="text-lg font-semibold mb-1">진단 테스트</div>
              <div className="text-sm text-gray-600">학과에서 공개한 진단 테스트를 바로 응시하세요.</div>
            </button>
          </div>
        </main>

        <ChatWidget title="학사 도우미 봇" />
      </div>
    </ProtectedRoute>
  );
};

export default DentalHygieneDashboard;
