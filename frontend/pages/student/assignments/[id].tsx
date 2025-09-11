import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../src/components/ProtectedRoute';
import { assignmentsAPI } from '../../../src/services/api';

export default function StudentAssignmentDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await assignmentsAPI.get(id);
        if (res.success) setAssignment(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const submit = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      await assignmentsAPI.submit(id, { note: note || undefined, url: url || undefined });
      alert('제출 완료되었습니다.');
      router.push('/student/assignments');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Head><title>과제 제출 - 학생</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-sm text-blue-600">← 뒤로</button>
          <h1 className="text-2xl font-bold mt-3 mb-4">과제 제출</h1>

          {loading ? (
            <div className="bg-white rounded border p-6">불러오는 중...</div>
          ) : assignment ? (
            <div className="bg-white rounded border p-6">
              <div className="mb-4">
                <div className="text-lg font-semibold">{assignment.title}</div>
                <div className="text-sm text-gray-600 mt-1">{assignment.description}</div>
                <div className="text-xs text-gray-500 mt-2">마감일: {new Date(assignment.due_date).toLocaleString()}</div>
              </div>

              <div className="grid gap-3">
                <label className="text-sm text-gray-700">참고 링크 (선택)</label>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="예: Google Drive 링크" className="border rounded px-3 py-2" />

                <label className="text-sm text-gray-700">메모 / 제출 설명 (선택)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="제출 내용에 대한 설명을 입력하세요" className="border rounded px-3 py-2 min-h-[100px]" />

                <div className="flex items-center gap-2 mt-2">
                  <button onClick={submit} disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">
                    {submitting ? '제출 중...' : '제출하기'}
                  </button>
                  <button onClick={() => router.push(`/student/quiz/${assignment.id}`)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded">
                    퀴즈로 이동
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded border p-6">과제를 찾을 수 없습니다.</div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

