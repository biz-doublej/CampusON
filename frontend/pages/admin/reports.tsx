import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { adminAPI } from '../../src/services/api';

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await adminAPI.getReports(); if (r.success) setData(r.data); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">통계 리포트</h1>
          {loading ? <div>불러오는 중...</div> : (
            <div className="space-y-8">
              <Section title="역할별 사용자 수">
                <BarList data={toPairs(data?.roleCounts)} colors={["bg-blue-500","bg-purple-500","bg-gray-600"]} />
              </Section>
              <Section title="학과별 사용자 수">
                <BarList data={toPairs(data?.deptCounts)} colors={["bg-green-500","bg-blue-500","bg-yellow-500"]} />
              </Section>
              <Section title="과제 상태별 수">
                <BarList data={toPairs(data?.assignmentCounts)} colors={["bg-gray-500","bg-indigo-600","bg-gray-800"]} />
              </Section>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="bg-white border rounded p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function toPairs(obj: any): { key: string; value: number }[] {
  if (!obj) return [];
  return Object.keys(obj).map((k) => ({ key: k, value: Number(obj[k] || 0) }));
}

function BarList({ data, colors }: { data: { key: string; value: number }[]; colors?: string[] }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.key}>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>{d.key}</span>
            <span>{d.value}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded">
            <div className={`h-3 rounded ${colors?.[i % (colors.length||1)] || 'bg-blue-500'}`} style={{ width: `${Math.round((d.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

