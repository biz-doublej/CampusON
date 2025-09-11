import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../src/components/ProtectedRoute';
import { usersAPI } from '../../../src/services/api';
import { communityV2Service } from '../../../src/services/communityV2Service';
import type { User } from '../../../src/types';
import { getDepartmentInfo, normalizeDepartment } from '../../../src/config/departments';

interface GradeRow {
  id: string;
  assignment_id: string;
  assignment_title: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent: number;
  completed_at: string;
  status?: string;
  due_date?: string | null;
}

interface TimetableEntry {
  id: number;
  user_id: string;
  title: string;
  day_of_week: number;
  time_start: string;
  time_end: string;
  location?: string;
  lecture_code?: string;
}

const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

export default function StudentDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [user, setUser] = useState<User | null>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) User detail (required)
        const ures = await usersAPI.getUser(id);
        if (!ures.success || !ures.data) throw new Error(ures.message || '학생 정보를 불러올 수 없습니다.');
        setUser(ures.data as User);

        // 2) Grades (best-effort)
        try {
          const gres = await usersAPI.getUserGrades(id);
          if (gres.success && Array.isArray(gres.data)) setGrades(gres.data as any);
        } catch {
          // ignore grades error
        }

        // 3) Timetable (best-effort, Python API enforces KBU verification)
        try {
          const uidPrimary = (ures.data as any).id;
          const uidFallback = (ures.data as any).user_id;
          let tRes = await communityV2Service.listTimetable(uidPrimary);
          // community_v2 returns { success: True, items: [...] }
          let items = Array.isArray((tRes as any)?.items) ? (tRes as any).items : Array.isArray((tRes as any)?.data) ? (tRes as any).data : [];
          if (!Array.isArray(items) || items.length === 0) {
            const tRes2 = await communityV2Service.listTimetable(uidFallback);
            items = Array.isArray((tRes2 as any)?.items) ? (tRes2 as any).items : Array.isArray((tRes2 as any)?.data) ? (tRes2 as any).data : [];
          }
          if (Array.isArray(items)) {
            // Map fields from community_v2 {id,title,dow,start,end,place}
            const mapped = items.map((r: any) => ({
              id: r.id,
              user_id: uidPrimary,
              title: r.title,
              day_of_week: r.dow ?? r.day_of_week ?? 0,
              time_start: r.start ?? r.time_start ?? '',
              time_end: r.end ?? r.time_end ?? '',
              location: r.place ?? r.location ?? '',
              lecture_code: r.lecture_code,
            }));
            setTimetable(mapped);
          }
        } catch (e: any) {
          // Ignore 403 (not verified) and other timetable errors
          // Still allow page render without timetable
        }
      } catch (e: any) {
        setError(e?.message || '학생 상세 조회 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const courses = useMemo(() => {
    const map = new Map<string, { title: string; code?: string; sessions: number }>();
    timetable.forEach((t) => {
      const key = (t.lecture_code || '') + '|' + t.title;
      const prev = map.get(key);
      map.set(key, {
        title: t.title,
        code: t.lecture_code,
        sessions: (prev?.sessions || 0) + 1,
      });
    });
    return Array.from(map.values());
  }, [timetable]);

  const deptName = (() => {
    if (!user?.department) return '학과 미지정';
    try {
      const dep = normalizeDepartment(user.department as any);
      return getDepartmentInfo(dep).name;
    } catch {
      return '학과 미지정';
    }
  })();

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head><title>학생 상세 - 교수</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-4">뒤로가기</button>

          {loading && <div className="bg-white p-6 rounded border text-gray-600">불러오는 중...</div>}
          {!loading && error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">{error}</div>}

          {!loading && !error && user && (
            <div className="space-y-8">
              {/* Student Info */}
              <section className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">학생 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">이름:</span> <span className="ml-2 text-gray-900">{user.name}</span></div>
                  <div><span className="text-gray-500">학번/ID:</span> <span className="ml-2 text-gray-900">{user.user_id}</span></div>
                  <div><span className="text-gray-500">이메일:</span> <span className="ml-2 text-gray-900">{user.email}</span></div>
                  <div><span className="text-gray-500">학과:</span> <span className="ml-2 text-gray-900">{deptName}</span></div>
                  <div><span className="text-gray-500">학년:</span> <span className="ml-2 text-gray-900">{(user as any).year || '-'}</span></div>
                  <div><span className="text-gray-500">가입일:</span> <span className="ml-2 text-gray-900">{new Date(user.created_at).toLocaleString()}</span></div>
                </div>
              </section>

              {/* Courses */}
              <section className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">수강 과목</h2>
                {courses.length === 0 ? (
                  <div className="text-gray-500 text-sm">등록된 시간표를 기반으로 한 과목 정보가 없습니다.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {courses.map((c, idx) => (
                      <li key={idx} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{c.title}</div>
                          <div className="text-xs text-gray-500">{c.code || '코드 없음'} · 주 {c.sessions}회</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Timetable */}
              <section className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">시간표</h2>
                {timetable.length === 0 ? (
                  <div className="text-gray-500 text-sm">시간표 정보가 없습니다.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">요일</th>
                          <th className="px-4 py-2 text-left">과목</th>
                          <th className="px-4 py-2 text-left">시간</th>
                          <th className="px-4 py-2 text-left">장소</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {timetable
                          .slice()
                          .sort((a, b) => (a.day_of_week - b.day_of_week) || a.time_start.localeCompare(b.time_start))
                          .map((t) => (
                            <tr key={`${t.day_of_week}-${t.time_start}-${t.title}`} className="hover:bg-gray-50">
                              <td className="px-4 py-2">{dayNames[t.day_of_week % 7]}</td>
                              <td className="px-4 py-2">{t.title}</td>
                              <td className="px-4 py-2">{t.time_start} ~ {t.time_end}</td>
                              <td className="px-4 py-2">{t.location || '-'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Grades */}
              <section className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">성적</h2>
                {grades.length === 0 ? (
                  <div className="text-gray-500 text-sm">성적 데이터가 없습니다.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">과제/시험</th>
                          <th className="px-4 py-2 text-left">점수</th>
                          <th className="px-4 py-2 text-left">정답/총문항</th>
                          <th className="px-4 py-2 text-left">소요시간(초)</th>
                          <th className="px-4 py-2 text-left">완료일</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {grades.map((g) => (
                          <tr key={g.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">{g.assignment_title || g.assignment_id}</td>
                            <td className="px-4 py-2">{g.score}</td>
                            <td className="px-4 py-2">{g.correct_answers}/{g.total_questions}</td>
                            <td className="px-4 py-2">{g.time_spent}</td>
                            <td className="px-4 py-2">{new Date(g.completed_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
