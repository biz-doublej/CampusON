import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { adminAPI } from '../../src/services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>('');
  const [dept, setDept] = useState<string>('');
  const [q, setQ] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.listUsers({ role: role || undefined, department: dept || undefined, q: q || undefined });
      if (res.success) setUsers(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">사용자 관리</h1>

          <div className="bg-white border rounded p-4 mb-4 flex gap-2 items-end">
            <div>
              <label className="text-sm text-gray-600">역할</label>
              <select className="block border rounded px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">전체</option>
                <option value="student">학생</option>
                <option value="professor">교수</option>
                <option value="admin">관리자</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">학과</label>
              <select className="block border rounded px-3 py-2" value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="">전체</option>
                <option value="NURSING">간호학과</option>
                <option value="DENTAL_HYGIENE">치위생학과</option>
                <option value="PHYSICAL_THERAPY">물리치료학과</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600">검색</label>
              <input className="block border rounded px-3 py-2 w-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름/이메일/학번" />
            </div>
            <button onClick={load} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">검색</button>
          </div>

          <div className="bg-white border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">이름</th>
                  <th className="px-3 py-2 text-left">이메일</th>
                  <th className="px-3 py-2">역할</th>
                  <th className="px-3 py-2">학과</th>
                  <th className="px-3 py-2">가입일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-3 py-4" colSpan={5}>불러오는 중...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td className="px-3 py-4" colSpan={5}>사용자가 없습니다.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">{u.name || u.user_id}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2 text-center">{String(u.role || '').toLowerCase()}</td>
                    <td className="px-3 py-2 text-center">{String(u.department || '').toLowerCase()}</td>
                    <td className="px-3 py-2 text-center">{u.created_at?.substring?.(0,10) || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

