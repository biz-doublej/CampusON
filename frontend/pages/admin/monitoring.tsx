import React, { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { adminAPI } from '../../src/services/api';
import kbService from '../../src/services/kbService';
import type { AdminMonitorSnapshot, KnowledgeListItem } from '../../src/types';

export default function AdminMonitoringPage() {
  const [snapshot, setSnapshot] = useState<AdminMonitorSnapshot | null>(null);
  const [kb, setKb] = useState<KnowledgeListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [monitorRes, kbRes] = await Promise.all([adminAPI.getMonitor(), kbService.list(50)]);
        if (!cancelled) {
          if (monitorRes.success && monitorRes.data) setSnapshot(monitorRes.data);
          if (kbRes.success && kbRes.data) setKb(kbRes.data);
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

  const uptime = useMemo(() => {
    if (!snapshot?.node?.uptime_sec) return '—';
    const s = Math.floor(snapshot.node.uptime_sec);
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  }, [snapshot]);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">시스템 모니터링</h1>
          {loading && <p className="mb-4 text-sm text-gray-500">최신 상태를 불러오는 중입니다...</p>}

          {/* Uptime and status cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatusCard title="웹 서버" ok={!!snapshot?.web_server?.ok} extra={`${snapshot?.web_server?.latency_ms ?? '—'} ms`} />
            <StatusCard title="Node API" ok={!!snapshot?.api_server?.ok} extra={`${snapshot?.node?.latency_ms ?? '—'} ms`} />
            <StatusCard title="Python AI API" ok={!!snapshot?.python_api?.ok} extra={`${snapshot?.python_api?.latency_ms ?? '—'} ms`} />
            <StatusCard title="데이터베이스" ok={!!snapshot?.database?.ok} extra={`${snapshot?.database?.latency_ms ?? '—'} ms`} />
            <StatusCard title="파일 서버" ok={!!snapshot?.file_server?.ok} extra={snapshot?.file_server?.note || ''} />
            <div className="bg-white rounded border p-4">
              <div className="text-sm text-gray-500">Node Uptime</div>
              <div className="text-2xl font-semibold">{uptime}</div>
              <div className="mt-2 text-xs text-gray-500">
                v{process?.versions?.node} · RSS {snapshot?.node?.memory_mb ?? '—'}MB · Load {snapshot?.node?.cpu_load?.toFixed?.(2)}
              </div>
            </div>
          </div>

          {/* 학습 시각화: 간단 바차트 */}
          <div className="bg-white rounded border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">학습 시각화</h2>
              <span className="text-sm text-gray-500">지식베이스 최근 항목 {kb.length}개</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BarStat label="과제 수" value={Number(snapshot?.stats?.total_assignments ?? 0)} max={100} color="bg-blue-500" />
              <BarStat label="지식 항목(최근)" value={kb.length} max={50} color="bg-green-500" />
              <BarStat label="평균 점수(%)" value={Math.round(Number(snapshot?.stats?.average_score ?? 0))} max={100} color="bg-purple-500" />
            </div>
          </div>

          {/* 지식베이스 미리보기 */}
          <div className="bg-white rounded border p-6">
            <h2 className="text-lg font-semibold mb-4">지식베이스 미리보기</h2>
            {kb.length === 0 ? (
              <div className="text-gray-600">표시할 항목이 없습니다.</div>
            ) : (
              <ul className="divide-y">
                {kb.map((item) => (
                  <li key={item.id} className="py-3">
                    <div className="text-sm text-gray-500">
                      #{item.id} · {item.created_at?.replace?.('T', ' ').replace?.('Z', '')}
                    </div>
                    <div className="text-gray-900">{item.text_preview}</div>
                    {item.meta && typeof item.meta === 'object' && 'url' in item.meta && typeof item.meta.url === 'string' && (
                      <a className="text-blue-600 text-sm underline" href={item.meta.url} target="_blank" rel="noreferrer">
                        원문 링크
                      </a>
                    )}
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

function StatusCard({ title, ok, extra }: { title: string; ok: boolean; extra?: string }) {
  return (
    <div className="bg-white rounded border p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className={`text-lg font-semibold ${ok ? 'text-green-600' : 'text-red-600'}`}>{ok ? '정상' : '장애'}</div>
      </div>
      <div className="text-sm text-gray-500">{extra}</div>
    </div>
  );
}

function BarStat({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div>
      <div className="text-sm text-gray-600 mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-gray-500">{value}</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded">
        <div className={`h-3 ${color} rounded`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
