import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import type { DiagnosticTestSummary, Department } from '../../src/types';
import { diagnosticAPI } from '../../src/services/api';
import { DEPARTMENT_LIST } from '../../src/config/departments';

const statusBadge = (status?: string) => {
  const normalized = (status || 'scheduled').toLowerCase();
  const map: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-gray-200 text-gray-700',
    scheduled: 'bg-yellow-100 text-yellow-700',
  };
  const labelMap: Record<string, string> = {
    open: '진행중',
    closed: '마감',
    scheduled: '예정',
  };
  const color = map[normalized] || 'bg-gray-200 text-gray-700';
  const label = labelMap[normalized] || status || '상태 미정';
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{label}</span>;
};

const ProfessorDiagnosticPage: React.FC = () => {
  const router = useRouter();
  const [tests, setTests] = useState<DiagnosticTestSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { department: departmentQuery } = router.query as { department?: string };

  const filteredTests = useMemo(() => {
    if (!departmentQuery) return tests;
    const normalized = departmentQuery.toLowerCase();
    return tests.filter((test) => String(test.department).toLowerCase() === normalized);
  }, [tests, departmentQuery]);

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await diagnosticAPI.listProfessorTests();
      if (response.success && Array.isArray(response.data)) {
        setTests(response.data);
      } else {
        setError(response.message || '진단 테스트 정보를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error('Failed to load diagnostic tests for professor:', err);
      setError('진단 테스트 정보를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleToggleStatus = async (test: DiagnosticTestSummary) => {
    const nextStatus = test.status === 'open' ? 'closed' : 'open';
    setUpdatingId(test.test_id);
    try {
      const response = await diagnosticAPI.updateTestStatus(test.test_id, nextStatus);
      if (response.success && response.data) {
        setTests((prev) =>
          prev.map((item) => (item.test_id === test.test_id ? { ...item, status: nextStatus } : item))
        );
      } else {
        alert(response.message || '상태를 변경할 수 없습니다.');
      }
    } catch (err) {
      console.error('Failed to update diagnostic test status:', err);
      alert('상태 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdatingId(null);
    }
  };

  const departmentDisplay = (key: string | Department) => {
    const normalized = String(key).toLowerCase();
    const match = DEPARTMENT_LIST.find((dept) => dept.key === normalized);
    return match ? match.name : key;
  };

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head><title>진단 테스트 관리 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">진단 테스트 관리</h1>
              <p className="text-sm text-gray-600">
                학과별로 공개 여부를 설정하고, 필요한 경우 분석 리포트로 이동하여 결과를 확인하세요.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/professor/analytics?tab=diagnostic')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
              >
                진단 분석 리포트
              </button>
              <button
                onClick={fetchTests}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700"
              >
                새로고침
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <p className="text-sm text-gray-600">
                테스트를 공개하면 해당 학과 학생들이 즉시 응시할 수 있습니다. 필요 시 마감하여 더 이상 응시하지 못하도록 할 수 있습니다.
              </p>
            </div>
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="py-16 text-center text-gray-500">테스트 정보를 불러오는 중...</div>
              ) : error ? (
                <div className="py-16 text-center">
                  <p className="text-red-600 font-medium mb-4">{error}</p>
                  <button
                    onClick={fetchTests}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    다시 시도
                  </button>
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="py-16 text-center text-gray-600">등록된 진단 테스트가 없습니다.</div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  {filteredTests.map((test) => (
                    <section key={test.test_id} className="border rounded-lg p-5 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{test.title}</h2>
                          <p className="text-sm text-gray-500 mt-1">
                            {departmentDisplay(test.department)}
                          </p>
                        </div>
                        {statusBadge(test.status)}
                      </div>

                      {test.description && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-3">{test.description}</p>
                      )}

                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                        <div>
                          <dt className="font-medium text-gray-800">문항 수</dt>
                          <dd>{test.total_questions ?? '미정'} 문항</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-800">제한 시간</dt>
                          <dd>{test.time_limit_minutes ? `${test.time_limit_minutes}분` : '없음'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-800">공개 시각</dt>
                          <dd>{test.open_at ? new Date(test.open_at).toLocaleString() : '상시'}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-800">마감 시각</dt>
                          <dd>{test.close_at ? new Date(test.close_at).toLocaleString() : '상시'}</dd>
                        </div>
                      </dl>

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
                        <button
                          onClick={() => router.push(`/professor/analytics?tab=diagnostic&testId=${test.test_id}`)}
                          className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded text-sm"
                        >
                          결과 분석 보기
                        </button>
                        <button
                          onClick={() => handleToggleStatus(test)}
                          disabled={updatingId === test.test_id}
                          className={`px-4 py-2 text-white rounded text-sm transition ${
                            test.status === 'open'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                        >
                          {updatingId === test.test_id
                            ? '처리 중...'
                            : test.status === 'open'
                              ? '테스트 마감'
                              : '테스트 공개'}
                        </button>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default ProfessorDiagnosticPage;
