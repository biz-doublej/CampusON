import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import ChatWidget from '../../src/components/chat/ChatWidget';
import { assignmentsAPI } from '../../src/services/api';

type AssignmentRow = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'draft' | 'published' | 'closed' | string;
};

export default function ProfessorAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<AssignmentRow[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const sorted = useMemo(() => {
    return [...list].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [list]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await assignmentsAPI.list();
      if (res.success && Array.isArray(res.data)) setList(res.data as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createAssignment = async () => {
    if (!title.trim() || !description.trim() || !dueDate) return;
    try {
      setCreating(true);
      const payload = { title: title.trim(), description: description.trim(), due_date: new Date(dueDate).toISOString(), status: 'draft' as const };
      const res = await assignmentsAPI.create(payload);
      if (res.success && res.data) {
        setTitle('');
        setDescription('');
        setDueDate('');
        await load();
      } else {
        alert(res.message || '과제 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: 'draft' | 'published' | 'closed') => {
    try {
      const res = await assignmentsAPI.updateStatus(id, status);
      if (!res.success) {
        throw new Error(res.message || '상태 변경 실패');
      }
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '상태 변경 중 오류가 발생했습니다.';
      alert(msg);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head><title>과제 관리 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">과제 관리</h1>

          {/* Create Assignment */}
          <div className="bg-white p-6 rounded border mb-8">
            <h2 className="text-lg font-semibold mb-4">과제 생성 (업로드 과제)</h2>
            <div className="grid gap-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="border rounded px-3 py-2" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="설명" className="border rounded px-3 py-2 min-h-[90px]" />
              <label className="text-sm text-gray-600">마감일</label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border rounded px-3 py-2" />
              <div className="flex items-center gap-2">
                <button onClick={createAssignment} disabled={creating} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
                  {creating ? '생성 중...' : '초안으로 생성'}
                </button>
                <button onClick={() => router.push('/professor/questions')} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded">
                  퀴즈 출제 (AI)
                </button>
              </div>
              <p className="text-xs text-gray-500">퀴즈 과제는 상단 버튼으로 출제 후, 학생은 학생 메뉴의 퀴즈에서 진행합니다.</p>
            </div>
          </div>

          {/* List */}
          <div className="bg-white p-6 rounded border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">내 과제 목록</h2>
              {loading && <span className="text-sm text-gray-500">불러오는 중...</span>}
            </div>
            {sorted.length === 0 ? (
              <p className="text-gray-600">아직 생성된 과제가 없습니다.</p>
            ) : (
              <ul className="divide-y">
                {sorted.map((a) => (
                  <li key={a.id} className="py-4 flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{a.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{a.description}</div>
                      <div className="text-xs text-gray-500 mt-2">마감일: {new Date(a.due_date).toLocaleString()} · 상태: {a.status}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.status !== 'published' && (
                        <button onClick={() => updateStatus(a.id, 'published')} className="px-2 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded">공개</button>
                      )}
                      {a.status !== 'closed' && (
                        <button onClick={() => updateStatus(a.id, 'closed')} className="px-2 py-1 text-sm bg-gray-700 hover:bg-gray-800 text-white rounded">마감</button>
                      )}
                      <button onClick={() => router.push(`/professor/assignments/${a.id}`)} className="px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded">제출 확인</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <ChatWidget 
          title="학사 도우미 봇" 
          suggestedQuestions={[
            '이번 강의 요약과 과제 아이디어 추천해줘',
            '평가 루브릭 템플릿 만들어줘',
            '퀴즈 출제용 문항 5개 추천해줘',
            '마감 임박 과제 리마인드 문구 작성해줘'
          ]}
        />
      </div>
    </ProtectedRoute>
  );
}
