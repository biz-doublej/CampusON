import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../src/components/ProtectedRoute';
import type { DiagnosticTestResult } from '../../../../src/types';
import { diagnosticAPI } from '../../../../src/services/api';

const StudentDiagnosticResultPage: React.FC = () => {
  const router = useRouter();
  const { resultId } = router.query as { resultId?: string };
  const [result, setResult] = useState<DiagnosticTestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof resultId !== 'string') return;

    let cancelled = false;
    const loadResult = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await diagnosticAPI.getResult(resultId);
        if (!cancelled) {
          if (response.success && response.data) {
            setResult(response.data);
          } else {
            setError(response.message || '결과 정보를 불러오지 못했습니다.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load diagnostic result:', err);
          setError('결과 정보를 불러오지 못했습니다. 다시 시도해주세요.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadResult();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, resultId]);

  const summary = result?.summary;

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Head><title>진단 테스트 결과</title></Head>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white border rounded-lg shadow-sm p-8">
            {loading ? (
              <div className="text-center text-gray-600">결과를 불러오는 중...</div>
            ) : error ? (
              <div className="text-center">
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button
                  onClick={() => router.push('/student/diagnostic')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                >
                  테스트 목록으로 이동
                </button>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{result.test_title ?? '진단 테스트 결과'}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    결과 ID: {result.result_id}
                    {result.completed_at ? ` · 완료 시각 ${new Date(result.completed_at).toLocaleString()}` : ''}
                  </p>
                </div>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 bg-indigo-50 text-indigo-800">
                    <h2 className="text-sm font-semibold uppercase tracking-wide">종합 점수</h2>
                    <p className="mt-2 text-3xl font-bold">{result.score ?? summary?.overall_score ?? 'N/A'}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50 text-gray-800">
                    <h2 className="text-sm font-semibold uppercase tracking-wide">핵심 지표</h2>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>압박 속도: {summary?.compressions_per_minute ? `${summary.compressions_per_minute.toFixed(1)} CPM` : '정보 없음'}</li>
                      <li>평균 깊이: {summary?.average_depth ? `${summary.average_depth.toFixed(1)} cm` : '정보 없음'}</li>
                      <li>팔 각도: {summary?.arm_angle ? `${summary.arm_angle.toFixed(0)}°` : '정보 없음'}</li>
                    </ul>
                  </div>
                </section>

                {Array.isArray(result.feedback) && result.feedback.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">피드백</h2>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {result.feedback.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {Array.isArray(result.answers) && result.answers.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">답안 확인</h2>
                    <div className="border rounded-lg divide-y">
                      {result.answers.map((answer) => (
                        <div key={answer.question_id} className="p-4">
                          <div className="text-sm text-gray-500 mb-1">문항 {answer.question_id}</div>
                          {answer.prompt && <p className="text-gray-800 mb-2">{answer.prompt}</p>}
                          <div className="text-sm">
                            <span className="font-medium">제출한 답안:</span> {answer.selected ?? '미제출'}
                          </div>
                          {answer.correct_answer && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">정답:</span> {answer.correct_answer}
                            </div>
                          )}
                          {typeof answer.is_correct === 'boolean' && (
                            <div className={`mt-1 text-sm font-medium ${answer.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                              {answer.is_correct ? '정답' : '오답'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/student/diagnostic')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    테스트 목록으로 돌아가기
                  </button>
                  <button
                    onClick={() => router.push('/student')}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700"
                  >
                    학생 대시보드
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDiagnosticResultPage;
