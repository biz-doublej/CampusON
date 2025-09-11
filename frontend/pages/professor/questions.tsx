import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import questionService from '../../src/services/questionService';
import quizService from '../../src/services/quizService';

type QItem = { id: number; number: number; content: string; options: Record<string, string> };

export default function ProfessorQuestionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<QItem[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<QItem | null>(null);
  const [limit] = useState<number>(25);
  const [offset, setOffset] = useState<number>(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await questionService.list(limit, offset);
      setItems(res.items || []);
    } catch (e: any) {
      console.error(e);
      setError('문항 목록을 불러오지 못했습니다. Parser API 연결과 NEXT_PUBLIC_PARSER_API_URL 환경변수를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* reset selection when page changes */ setSelected({}); setPreview(null); }, [offset, limit]);

  const toggle = (id: number) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const createQuiz = async () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k));
    if (ids.length === 0) { alert('문항을 선택해주세요.'); return; }
    const res = await quizService.create('선택 문항 퀴즈', ids.map(id => ({ id })));
    const qid = res?.quiz?.id;
    if (qid) router.push(`/student/quiz/${qid}`);
  };

  const deleteSelected = async () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k));
    if (ids.length === 0) { alert('삭제할 문항을 선택해주세요.'); return; }
    if (!confirm(`${ids.length}개의 문항을 삭제하시겠습니까?`)) return;
    try {
      if (ids.length === 1) await questionService.deleteOne(ids[0]);
      else await questionService.deleteBulk(ids);
      await load();
      setSelected({});
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
  const allSelected = useMemo(() => items.length > 0 && items.every(i => !!selected[i.id]), [items, selected]);
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<number, boolean> = {} as any;
      items.forEach(i => { next[i.id] = true; });
      setSelected(next);
    }
  };
  const hasNext = useMemo(() => items.length === limit, [items.length, limit]);

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head><title>문항 관리 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">문항 관리</h1>
            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-2 mr-2 text-sm text-gray-700">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /> 전체 선택
              </label>
              <span className="text-sm text-gray-500 mr-2">선택: {selectedCount}</span>
              <button onClick={load} className="px-3 py-2 bg-gray-100 border rounded">새로고침</button>
              <button onClick={() => router.push('/professor/generate')} className="px-3 py-2 bg-indigo-600 text-white rounded">AI 문제 생성</button>
              <button onClick={createQuiz} className="px-3 py-2 bg-blue-600 text-white rounded">선택 퀴즈</button>
              <button onClick={deleteSelected} disabled={selectedCount===0} className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50">선택 삭제</button>
            </div>
          </div>

          {loading && <div>로딩 중…</div>}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
          )}
          {!loading && items.length === 0 && <div>문항이 없습니다. PDF 업로드 또는 AI 생성 후 저장해주세요.</div>}

          <div className="bg-white rounded border divide-y">
            {items.map(q => (
              <div key={q.id} className="flex gap-3 p-3 items-start">
                <input type="checkbox" checked={!!selected[q.id]} onChange={() => toggle(q.id)} className="mt-1" />
                <div className="flex-1">
                  <button onClick={() => setPreview(q)} className="text-left w-full">
                    <div className="font-medium">#{q.id} [문항 {q.number}]</div>
                    <div className="text-sm text-gray-700 line-clamp-2">{q.content}</div>
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.entries(q.options || {}).map(([k, v]) => (<span key={k} className="mr-3">{k}. {String(v)}</span>))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPreview(q)} className="px-2 py-1 text-sm border rounded">보기</button>
                  <button onClick={async () => { if (confirm('이 문항을 삭제하시겠습니까?')) { await questionService.deleteOne(q.id); await load(); } }} className="px-2 py-1 text-sm border border-red-300 text-red-600 rounded">삭제</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-end items-center gap-2 mt-4">
            <span className="text-sm text-gray-500">페이지 {Math.floor(offset / limit) + 1}</span>
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0 || loading}
              className="px-3 py-2 border rounded bg-white disabled:opacity-50"
            >이전</button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={!hasNext || loading}
              className="px-3 py-2 border rounded bg-white disabled:opacity-50"
            >다음</button>
          </div>

          {preview && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold">국가고시 뷰어 - 문항 #{preview.id}</h2>
                  <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-gray-700">닫기</button>
                </div>
                <div className="p-5">
                  <div className="mb-3 text-sm text-gray-500">문항 번호: {preview.number}</div>
                  <div className="whitespace-pre-line leading-relaxed text-gray-900">{preview.content}</div>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {Object.entries(preview.options || {}).map(([k, v]) => (
                      <div key={k} className="border rounded p-3">
                        <span className="font-medium mr-2">{k}.</span>
                        <span>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">정답은 퀴즈 응시에서 확인하세요.</div>
                  <div className="flex gap-2">
                    <button onClick={() => setPreview(null)} className="px-3 py-2 border rounded bg-white">닫기</button>
                    <button onClick={async () => { const r = await quizService.create('단일 문항 퀴즈', [{ id: preview.id }]); const qid = r?.quiz?.id; setPreview(null); if (qid) router.push(`/student/quiz/${qid}`); }} className="px-3 py-2 bg-blue-600 text-white rounded">이 문항으로 퀴즈</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
