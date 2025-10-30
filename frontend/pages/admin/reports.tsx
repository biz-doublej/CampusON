import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { adminAPI } from '../../src/services/api';
import type { AdminReportsSummary } from '../../src/types';

export default function AdminReportsPage() {
  const [data, setData] = useState<AdminReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await adminAPI.getReports();
        if (!cancelled && response.success && response.data) {
          setData(response.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">통계 리포트</h1>
          {loading ? <div>불러오는 중...</div> : (
            <div className="space-y-8">
              <Section title="역할별 사용자 수">
                <BarList data={toPairs(data?.roleCounts)} colors={['bg-blue-500', 'bg-purple-500', 'bg-gray-600']} />
              </Section>
              <Section title="학과별 사용자 수">
                <BarList data={toPairs(data?.deptCounts)} colors={['bg-green-500', 'bg-blue-500', 'bg-yellow-500']} />
              </Section>
              <Section title="과제 상태별 수">
                <BarList data={toPairs(data?.assignmentCounts)} colors={['bg-gray-500', 'bg-indigo-600', 'bg-gray-800']} />
              </Section>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white border rounded p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function toPairs(obj: Record<string, number> | undefined | null): { key: string; value: number }[] {
  if (!obj) return [];
  return Object.keys(obj).map((key) => ({ key, value: Number(obj[key] ?? 0) }));
}

function BarList({ data, colors }: { data: { key: string; value: number }[]; colors?: string[] }) {
  const max = Math.max(1, ...data.map((datum) => datum.value));
  return (
    <div className="space-y-3">
      {data.map((datum, index) => (
        <div key={datum.key}>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>{datum.key}</span>
            <span>{datum.value}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded">
            <div
              className={`h-3 rounded ${colors?.[index % (colors.length || 1)] || 'bg-blue-500'}`}
              style={{ width: `${Math.round((datum.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
