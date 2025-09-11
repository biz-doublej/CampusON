import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../src/components/ProtectedRoute';
import { getDepartmentInfo, normalizeDepartment, getDepartmentDashboardPath } from '../../../src/config/departments';
import type { User } from '../../../src/types';
import useChatBot, { ChatMessage } from '../../../src/components/chat/useChatBot';

export default function PhysicalTherapyQA() {
  const router = useRouter();
  const info = getDepartmentInfo('physical_therapy');
  const [user, setUser] = useState<User | null>(null);
  const { messages, loading, send, setMessages } = useChatBot({ botType: 'department', department: 'physical_therapy', course: '해부생리학' });
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userStr) {
      const u = JSON.parse(userStr);
      setUser(u);
      const depKey = u?.department ? normalizeDepartment(u.department as any) : null;
      if (depKey && depKey !== 'physical_therapy') {
        const path = getDepartmentDashboardPath(depKey);
        if (router.asPath !== path) router.replace(path).catch(() => void 0);
      }
    }
  }, [router]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await send(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${info.color} rounded-lg flex items-center justify-center text-white text-lg`}>{info.icon}</div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">물리치료학과 질문</h1>
                <p className="text-xs text-gray-600">해부생리 교재 기반 RAG</p>
              </div>
            </div>
            <button onClick={() => router.push('/department/physical-therapy')} className="text-sm text-blue-600 hover:underline">← 대시보드로</button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white border rounded-xl shadow-sm">
            <div className="p-4 h-[60vh] overflow-auto space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-gray-600">
                  예시로 시작해보세요:
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['슬라이딩 필라멘트 이론 설명', 'ATP의 역할은?', '근수축과 칼슘의 상호작용은?'].map(q => (
                      <button key={q} onClick={() => setInput(q)} className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m: ChatMessage, i: number) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-xs text-gray-500">답변을 불러오는 중…</div>}
            </div>
            <div className="border-t p-3 flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder="해부생리 관련 질문을 입력하세요"
                className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button onClick={handleSend} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">전송</button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

