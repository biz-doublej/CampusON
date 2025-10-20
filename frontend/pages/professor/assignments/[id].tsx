import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../src/components/ProtectedRoute';
import { assignmentsAPI } from '../../../src/services/api';
import type { AssignmentSummary, AssignmentType, AssignmentConfig } from '../../../src/types';

interface SubmissionRow {
  id: string;
  user: { id: string; name: string | null; email: string | null };
  submitted_at: string;
  url?: string;
  note?: string;
}

const TYPE_LABELS: Record<AssignmentType, string> = {
  UPLOAD: '자료 업로드',
  QUIZ: '퀴즈/평가',
  PROJECT: '팀 프로젝트',
  PRACTICAL: '실습/시뮬레이션',
  PRESENTATION: '발표/세미나',
  REFLECTION: '학습 저널',
  CLINICAL: '임상 기록',
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'published':
      return '공개 중';
    case 'closed':
      return '마감';
    case 'draft':
    default:
      return '초안';
  }
};

const renderList = (title: string, items?: string[]) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const renderGroupInfo = (config: AssignmentConfig | null | undefined) => {
  if (!config?.groupWork) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800">팀 구성</h3>
      <p className="mt-1 text-sm text-gray-600">
        {config.groupWork.enabled
          ? `팀 과제 · ${config.groupWork.minSize ?? 2}명 ~ ${config.groupWork.maxSize ?? config.groupWork.minSize ?? 4}명`
          : '개인 수행'}
      </p>
    </div>
  );
};

const renderResources = (resources: AssignmentSummary['resources']) => {
  if (!resources || resources.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800">참고 자료</h3>
      <ul className="mt-2 space-y-2 text-sm text-blue-600">
        {resources.map((resource, index) => (
          <li key={`${resource.url}-${index}`}>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="underline">
              [{resource.type || 'link'}] {resource.title}
            </a>
            {resource.description && <p className="text-xs text-gray-500">{resource.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function ProfessorAssignmentSubmissionsPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentSummary | null>(null);
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setError(null);
      try {
        setLoading(true);
        const [assignmentResponse, submissionsResponse] = await Promise.all([
          assignmentsAPI.get(id),
          fetch(`${location.origin}/api/assignments/${id}/submissions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
          }).then((res) => res.json()),
        ]);
        if (!assignmentResponse.success || !assignmentResponse.data) {
          throw new Error(assignmentResponse.message || '과제를 불러오지 못했습니다.');
        }
        setAssignment(assignmentResponse.data);
        if (submissionsResponse?.success) {
          setSubs(submissionsResponse.data || []);
        } else {
          setSubs([]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <ProtectedRoute allowedRoles={['professor', 'admin']}>
      <Head><title>과제 제출 목록 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-sm text-blue-600">← 뒤로</button>
          <h1 className="text-2xl font-bold mt-3 mb-4">과제 제출 현황</h1>

          {assignment && (
            <div className="grid gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    {TYPE_LABELS[assignment.type as AssignmentType] || '과제'}
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">상태 {formatStatus(assignment.status)}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-gray-900">{assignment.title}</h2>
                  <p className="mt-2 text-sm text-gray-600">{assignment.description}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    마감일 : {new Date(assignment.due_date).toLocaleString()} · 마지막 수정 :{' '}
                    {assignment.updated_at ? new Date(assignment.updated_at).toLocaleString() : '-'}
                  </p>
                </div>

                {assignment.tags && assignment.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {assignment.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {assignment.config?.instructions && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">과제 안내</h3>
                    <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{assignment.config.instructions}</p>
                  </div>
                )}

                {renderList('제출 항목', assignment.config?.deliverables)}
                {renderList('평가 체크리스트', assignment.config?.checklist)}
                {renderList('평가 기준', assignment.config?.evaluationCriteria)}
                {renderGroupInfo(assignment.config)}
                {assignment.config?.latePolicy && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">지각 제출 정책</h3>
                    <p className="mt-1 text-sm text-gray-600">{assignment.config.latePolicy}</p>
                  </div>
                )}
                {assignment.config?.additionalNotes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">추가 메모</h3>
                    <p className="mt-1 text-sm text-gray-600">{assignment.config.additionalNotes}</p>
                  </div>
                )}
              </div>

              <aside className="space-y-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">제출 방식</h3>
                  <p className="mt-1 text-sm text-gray-600">{assignment.config?.submissionMethod || '파일 업로드'}</p>
                </div>
                {assignment.config?.grading && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">평가 정보</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {assignment.config.grading.maxScore ? `만점 ${assignment.config.grading.maxScore}점` : '가중치 미설정'}
                    </p>
                    {assignment.config.grading.rubric && (
                      <p className="mt-1 text-xs text-gray-500 whitespace-pre-line">{assignment.config.grading.rubric}</p>
                    )}
                  </div>
                )}
                {typeof assignment.config?.notifyBeforeDays === 'number' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">알림 설정</h3>
                    <p className="mt-1 text-sm text-gray-600">마감 {assignment.config.notifyBeforeDays}일 전 리마인드</p>
                  </div>
                )}
                {renderResources(assignment.resources)}
              </aside>
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="text-lg font-semibold">제출 {subs.length}건</div>
              {loading && <span className="text-sm text-gray-500">불러오는 중...</span>}
            </div>
            {error ? (
              <div className="p-6 text-sm text-red-600">{error}</div>
            ) : subs.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">아직 제출이 없습니다.</div>
            ) : (
              <ul className="divide-y">
                {subs.map((submission) => (
                  <li key={submission.id} className="px-6 py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{submission.user?.name || '알 수 없음'}</div>
                        <div className="text-xs text-gray-500">{submission.user?.email}</div>
                        {submission.note && <div className="mt-2 text-sm text-gray-700">메모: {submission.note}</div>}
                        {submission.url && (
                          <div className="mt-2">
                            <a href={submission.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">
                              제출 링크 열기
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(submission.submitted_at).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
