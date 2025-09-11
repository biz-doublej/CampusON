import React from 'react';
import Head from 'next/head';
import ProtectedRoute from '../../src/components/ProtectedRoute';

export default function ProfessorSettingsPage() {
  const api = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://localhost:8001';
  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head><title>설정 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">설정</h1>
          <div className="bg-white p-6 rounded border space-y-3">
            <div>
              <div className="text-gray-600 text-sm">Parser API Base URL</div>
              <div className="font-mono text-gray-900">{api}</div>
            </div>
            <div className="text-sm text-gray-500">환경변수 NEXT_PUBLIC_PARSER_API_URL 로 변경할 수 있습니다.</div>
            <div className="pt-2 border-t">
              <div className="text-sm">바로가기</div>
              <ul className="list-disc ml-6 text-blue-600">
                <li><a href="/professor/generate">AI 문제 생성</a></li>
                <li><a href="/community">커뮤니티</a></li>
                <li><a href="/notice-embed">공지 임베드</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

