import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../src/components/ProtectedRoute';
import { assignmentsAPI } from '../../../src/services/api';

interface SubmissionRow {
  id: string;
  user: { id: string; name: string; email: string };
  submitted_at: string;
  url?: string;
  note?: string;
}

export default function ProfessorAssignmentSubmissionsPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setError(null);
      try {
        setLoading(true);
        const [aRes, sRes] = await Promise.all([
          assignmentsAPI.get(id),
          fetch(`${location.origin}/api/assignments/${id}/submissions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
          }).then(r => r.json()),
        ]);
        if (!aRes.success) throw new Error(aRes.message || '과제를 불러오지 못했습니다.');
        setAssignment(aRes.data);
        if (sRes?.success) setSubs(sRes.data || []);
        else setSubs([]);
      } catch (e: any) {
        setError(e?.message || '데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <ProtectedRoute allowedRoles={['professor', 'admin']}>
      <Head><title>과제 제출 목록 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-sm text-blue-600">← 뒤로</button>
          <h1 className="text-2xl font-bold mt-3 mb-4">과제 제출 목록</h1>

          {assignment && (
            <div className="bg-white rounded border p-5 mb-6">
              <div className="text-lg font-semibold">{assignment.title}</div>
              <div className="text-sm text-gray-600 mt-1">{assignment.description}</div>
              <div className="text-xs text-gray-500 mt-2">마감일: {new Date(assignment.due_date).toLocaleString()} · 상태: {assignment.status}</div>
            </div>
          )}

          <div className="bg-white rounded border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="text-lg font-semibold">제출 {subs.length}건</div>
              {loading && <span className="text-sm text-gray-500">불러오는 중...</span>}
            </div>
            {error ? (
              <div className="p-6 text-red-600 text-sm">{error}</div>
            ) : subs.length === 0 ? (
              <div className="p-6 text-gray-600">아직 제출이 없습니다.</div>
            ) : (
              <ul className="divide-y">
                {subs.map((s) => (
                  <li key={s.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{s.user?.name || '알 수 없음'}</div>
                        <div className="text-xs text-gray-500">{s.user?.email}</div>
                        {s.note && <div className="text-sm text-gray-700 mt-2">메모: {s.note}</div>}
                        {s.url && (
                          <div className="mt-2">
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">제출 링크 열기</a>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(s.submitted_at).toLocaleString()}</div>
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

