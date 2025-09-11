import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { usersAPI } from '../../src/services/api';
import type { Department, User } from '../../src/types';
import { getDepartmentInfo, normalizeDepartment } from '../../src/config/departments';

export default function ProfessorStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser: User | null = useMemo(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const department: Department | undefined = useMemo(() => {
    const dep = currentUser?.department;
    return dep ? normalizeDepartment(dep) : undefined;
  }, [currentUser]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await usersAPI.getStudents(department);
        if (res.success && Array.isArray(res.data)) {
          setStudents(res.data as any);
        } else {
          setError(res.message || '학생 목록을 불러오지 못했습니다.');
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || '학생 목록 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (department) {
      fetchStudents();
    } else {
      setLoading(false);
      setStudents([]);
    }
  }, [department]);

  const deptName = department ? getDepartmentInfo(department).name : '학과 미지정';

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head><title>학생 관리 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">학생 관리</h1>
            <p className="text-gray-600 mt-1">{deptName} 소속 학생 목록</p>
          </div>

          {loading && (
            <div className="bg-white p-6 rounded border text-gray-600">불러오는 중...</div>
          )}

          {!loading && !department && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
              교수님의 학과 정보가 없습니다. 프로필 또는 설정에서 학과를 먼저 지정해 주세요.
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">{error}</div>
          )}

          {!loading && department && !error && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학번/ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden mr-3 flex items-center justify-center">
                              {s.profile_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={s.profile_image} alt={s.name} className="h-9 w-9 object-cover" />
                              ) : (
                                <span className="text-gray-600 text-sm font-medium">
                                  {(s.name || s.user_id || '?').charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{s.name || '-'}</div>
                              <div className="text-xs text-gray-500">{deptName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.user_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{(s as any).year || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => router.push(`/professor/students/${s.id}`)} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded">상세</button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-gray-500 text-sm" colSpan={5}>
                          표시할 학생이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
