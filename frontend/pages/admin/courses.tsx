import React, { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { assignmentsAPI } from '../../src/services/api';
import type { AssignmentSummary } from '../../src/types';

export default function AdminCoursesPage() {
  const [list, setList] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const r = await assignmentsAPI.list();
      if (r.success && r.data) setList(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return list.filter((assignment) => {
      if (!status) return true;
      return String(assignment.status ?? '').toLowerCase() === status;
    });
  }, [list, status]);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">과정 관리 (과제 기반)</h1>
          <div className="bg-white border rounded p-4 mb-4 flex items-end gap-2">
            <div>
              <label className="text-sm text-gray-600">상태</label>
              <select className="block border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">전체</option>
                <option value="draft">초안</option>
                <option value="published">공개</option>
                <option value="closed">마감</option>
              </select>
            </div>
            <button onClick={load} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">새로고침</button>
          </div>

          <div className="bg-white border rounded">
            {loading ? (
              <div className="p-6">불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6">항목이 없습니다.</div>
            ) : (
              <ul className="divide-y">
                {filtered.map((assignment) => (
                  <li key={assignment.id} className="p-4 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{assignment.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{assignment.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        마감일: {new Date(assignment.due_date).toLocaleString()} · 상태: {assignment.status}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      생성자: {assignment.created_by?.substring?.(0, 8) ?? '알 수 없음'}
                    </div>
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
