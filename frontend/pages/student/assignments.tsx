import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import ChatWidget from '../../src/components/chat/ChatWidget';
import type { Assignment, User } from '../../src/types';
import { assignmentsAPI } from '../../src/services/api';

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) {
      try { setUser(JSON.parse(u)); } catch {}
    }
    // Load assignments (published)
    (async () => {
      try {
        setLoading(true);
        const res = await assignmentsAPI.list();
        if (res.success && Array.isArray(res.data)) {
          setAssignments(res.data as any);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <Head><title>과제/학업 - 학생</title></Head>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">과제/학업</h1>
            <div className="text-sm text-gray-600">{user?.name ? `${user.name} 학생` : ''}</div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <p className="text-sm text-gray-600">수강 중인 강의의 과제와 학업 일정을 확인하세요.</p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-8 text-gray-600">불러오는 중...</div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-700 font-medium mb-2">진행 중인 과제가 없습니다.</p>
                  <p className="text-sm text-gray-500 mb-6">교수자가 과제를 출제하면 이곳에서 확인할 수 있어요.</p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    대시보드로 돌아가기
                  </button>
                </div>
              ) : (
                <ul className="divide-y">
                  {assignments.map((a) => (
                    <li key={a.id} className="py-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{a.description}</p>
                        <p className="text-xs text-gray-500 mt-2">마감일: {new Date(a.due_date).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/student/assignments/${a.id}`)}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          제출하기
                        </button>
                        <button
                          onClick={() => router.push(`/student/quiz/${a.id}`)}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                        >
                          퀴즈로 시작
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </main>

        <ChatWidget title="학사 도우미 봇" />
      </div>
    </ProtectedRoute>
  );
}
