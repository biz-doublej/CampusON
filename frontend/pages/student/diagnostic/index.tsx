import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../src/components/ProtectedRoute';
import type { DiagnosticTestSummary, Department, User } from '../../../src/types';
import { diagnosticAPI } from '../../../src/services/api';
import { getDepartmentInfo, DEPARTMENT_LIST } from '../../../src/config/departments';

interface GroupedTests {
  [department: string]: DiagnosticTestSummary[];
}

const isKnownDepartment = (value: string): value is Department => {
  return DEPARTMENT_LIST.some((dept) => dept.key === value);
};

const getDepartmentDisplayName = (value?: string | null): string | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/\s+/g, '').replace(/-/g, '_');
  if (isKnownDepartment(normalized)) {
    return getDepartmentInfo(normalized).name;
  }
  return value;
};

const StudentDiagnosticHome: React.FC = () => {
  const router = useRouter();
  const [tests, setTests] = useState<DiagnosticTestSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ name?: string; department?: Department | string } | null>(null);
  const { department: filterDepartmentParam } = router.query as { department?: string };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    try {
      const parsed: User = JSON.parse(storedUser);
      if (parsed) {
        setUserInfo({
          name: parsed.name,
          department: parsed.department,
        });
      }
    } catch {
      setUserInfo(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await diagnosticAPI.listAvailableTests();
        if (cancelled) return;
        if (response.success && Array.isArray(response.data)) {
          setTests(response.data);
        } else {
          setError(response.message || '진단 테스트 정보를 불러오지 못했습니다.');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load diagnostic tests:', err);
          setError('진단 테스트 정보를 불러오지 못했습니다. 다시 시도해주세요.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTests();
    return () => {
      cancelled = true;
    };
  }, []);

  const testsByDepartment = useMemo<GroupedTests>(() => {
    return tests.reduce<GroupedTests>((acc, test) => {
      const key = typeof test.department === 'string' ? test.department : 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(test);
      return acc;
    }, {});
  }, [tests]);

  const sortedDepartmentEntries = useMemo(() => {
    const entries = Object.entries(testsByDepartment);
    if (!filterDepartmentParam) return entries;

    const normalized = filterDepartmentParam.toLowerCase().replace(/\s+/g, '').replace(/-/g, '_');
    return entries.sort(([deptA], [deptB]) => {
      const score = (dept: string) =>
        dept.toLowerCase().replace(/\s+/g, '').replace(/-/g, '_') === normalized ? 0 : 1;
      return score(deptA) - score(deptB);
    });
  }, [testsByDepartment, filterDepartmentParam]);

  const handleStart = (department: string, testId: string) => {
    router.push(`/student/diagnostic/${department}/${testId}`);
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Head><title>진단 테스트 - 학생</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">학과별 진단 테스트</h1>
              <p className="text-sm text-gray-600 mt-1">
                학과 교수님이 공개한 진단 테스트를 확인하고 바로 응시할 수 있습니다.
              </p>
            </div>
            {userInfo?.name && (
              <div className="text-sm text-gray-600">
                {userInfo.name} 학생
                {getDepartmentDisplayName(String(userInfo.department ?? '')) ? ` · ${getDepartmentDisplayName(String(userInfo.department ?? ''))}` : ''}
              </div>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <p className="text-sm text-gray-600">
                테스트를 선택하면 제한 시간, 문항 수 등의 세부 정보를 확인한 후 즉시 시작할 수 있습니다.
              </p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="py-12 text-center text-gray-500">진단 테스트를 불러오는 중...</div>
              ) : error ? (
                <div className="py-12 text-center">
                  <p className="text-red-600 font-medium mb-2">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    다시 시도
                  </button>
                </div>
              ) : tests.length === 0 ? (
                <div className="py-12 text-center text-gray-600">
                  현재 응시 가능한 진단 테스트가 없습니다.
                </div>
              ) : (
                <div className="space-y-8">
                  {sortedDepartmentEntries.map(([deptKey, deptTests]) => {
                    const isDept = isKnownDepartment(deptKey);
                    const info = isDept ? getDepartmentInfo(deptKey as Department) : null;
                    return (
                      <section key={deptKey}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="text-2xl">{info?.icon ?? '🏫'}</div>
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                              {info?.name ?? deptKey.toUpperCase()}
                            </h2>
                            <p className="text-sm text-gray-500">
                              {info?.description ?? '해당 학과에서 준비한 진단 테스트 목록입니다.'}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {deptTests.map((test) => (
                            <article key={test.test_id} className="border rounded-lg p-5 shadow-sm hover:shadow-md transition">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                                  {test.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{test.description}</p>
                                  )}
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                  test.status === 'open'
                                    ? 'bg-green-100 text-green-700'
                                    : test.status === 'scheduled'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {test.status === 'open' ? '진행중' : test.status === 'scheduled' ? '예정' : '마감'}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium text-gray-800">문항 수</span>
                                  <div>{test.total_questions ?? '미정'} 문항</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800">제한 시간</span>
                                  <div>{test.time_limit_minutes ? `${test.time_limit_minutes}분` : '없음'}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800">시작</span>
                                  <div>{test.open_at ? new Date(test.open_at).toLocaleString() : '상시'}</div>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800">마감</span>
                                  <div>{test.close_at ? new Date(test.close_at).toLocaleString() : '상시'}</div>
                                </div>
                              </div>

                              <div className="mt-5 flex justify-end">
                                <button
                                  onClick={() => handleStart(deptKey, test.test_id)}
                                  disabled={test.status && test.status !== 'open'}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded transition"
                                >
                                  테스트 시작
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDiagnosticHome;
