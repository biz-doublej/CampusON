import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import questionService from '../../src/services/questionService';

export default function ProfessorAnalyticsPage() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const res = await questionService.list(1, 0);
        setCount((res?.total || 0) || (res?.count || (res?.items?.length || 0)));
      } catch {}
    })();
  }, []);
  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head><title>분석 리포트 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">분석 리포트</h1>
          <div className="bg-white p-6 rounded border">
            <div className="text-gray-700">저장된 문제 수: <span className="font-semibold">{count}</span></div>
            <div className="text-gray-500 text-sm mt-2">추가 지표는 이후 연동 예정입니다.</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

