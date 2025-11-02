import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../../src/components/ProtectedRoute';
import type { DiagnosticQuestion, DiagnosticTestSession } from '../../../../src/types';
import { diagnosticAPI } from '../../../../src/services/api';

interface AnswerMap {
  [questionId: string]: string;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const StudentDiagnosticRunner: React.FC = () => {
  const router = useRouter();
  const { department, testId } = router.query as { department?: string; testId?: string };

  const [session, setSession] = useState<DiagnosticTestSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const questions: DiagnosticQuestion[] = session?.questions ?? [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof department !== 'string' || typeof testId !== 'string') return;

    let cancelled = false;
    const startTest = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await diagnosticAPI.startTest(department, testId);
        if (!cancelled) {
          if (response.success && response.data) {
            setSession(response.data);
            const info = response.data.test_info;
            const seconds =
              (typeof info.time_limit === 'number' && info.time_limit > 0 ? info.time_limit : 0) ||
              (typeof info.time_limit_minutes === 'number' ? info.time_limit_minutes * 60 : 0);
            setTimeRemaining(seconds > 0 ? seconds : 0);
          } else {
            setError(response.message || '테스트를 시작할 수 없습니다.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to start diagnostic test:', err);
          setError('테스트를 시작할 수 없습니다. 다시 시도해주세요.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    startTest();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, department, testId]);

  useEffect(() => {
    if (!session) return;
    if (timeRemaining <= 0) return;

    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, timeRemaining]);

  const handleAnswer = useCallback((questionId: string, choice: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (!session) return prev;
      return prev < session.questions.length - 1 ? prev + 1 : prev;
    });
  }, [session]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const progress = useMemo(() => {
    if (!session) return 0;
    return ((currentIndex + 1) / session.questions.length) * 100;
  }, [session, currentIndex]);

  const handleSubmit = useCallback(
    async (autoSubmit = false) => {
      if (!session || typeof department !== 'string' || typeof testId !== 'string') return;
      if (submitting) return;

      setSubmitting(true);
      try {
        const response = await diagnosticAPI.submitTest(department, {
          test_session_id: session.test_session_id,
          answers,
          test_id: testId,
        });
        if (response.success && response.data) {
          router.push(`/student/diagnostic/result/${response.data.result_id}`);
        } else {
          const message = response.message || '답안 제출에 실패했습니다. 다시 시도해주세요.';
          if (!autoSubmit) alert(message);
        }
      } catch (err) {
        console.error('Failed to submit diagnostic test:', err);
        if (!autoSubmit) alert('답안 제출에 실패했습니다. 네트워크 상태를 확인해주세요.');
      } finally {
        setSubmitting(false);
      }
    },
    [session, department, testId, answers, submitting, router]
  );

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center text-gray-600">테스트 로딩 중...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !session || !currentQuestion) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-red-600 font-medium">{error || '테스트 정보를 불러올 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/student/diagnostic')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
          >
            목록으로 돌아가기
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  const optionEntries = Object.entries(currentQuestion.options || {});
  const isLastQuestion = currentIndex === session.questions.length - 1;
  const selectedAnswer = answers[currentQuestion.id];

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Head><title>{session.test_info.title} - 진단 테스트</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{session.test_info.title}</h1>
              <p className="text-sm text-gray-600">문항 {currentIndex + 1} / {session.questions.length}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                남은 시간: {formatTime(timeRemaining)}
              </div>
              <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                답안 작성 {answeredCount}/{session.questions.length}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
            </div>

            <article>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Q{currentIndex + 1}. {currentQuestion.prompt}
              </h2>

              <ul className="space-y-3">
                {optionEntries.map(([key, label]) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => handleAnswer(currentQuestion.id, key)}
                      className={`w-full text-left px-4 py-3 border rounded-lg transition ${
                        selectedAnswer === key
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-800 hover:border-indigo-300'
                      }`}
                    >
                      <span className="font-semibold mr-2">{key}.</span>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>

              {currentQuestion.explanation && (
                <p className="mt-4 text-sm text-gray-500">{currentQuestion.explanation}</p>
              )}
            </article>

            <div className="mt-8 flex flex-col sm:flex-row sm:justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 border rounded text-sm disabled:border-gray-200 disabled:text-gray-400"
                >
                  이전 문제
                </button>
                <button
                  onClick={handleNext}
                  disabled={isLastQuestion}
                  className="px-4 py-2 border rounded text-sm disabled:border-gray-200 disabled:text-gray-400"
                >
                  다음 문제
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/student/diagnostic')}
                  className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-600"
                >
                  테스트 종료
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm disabled:bg-gray-300"
                >
                  {submitting ? '제출 중...' : isLastQuestion ? '제출하기' : '지금 제출'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default StudentDiagnosticRunner;
