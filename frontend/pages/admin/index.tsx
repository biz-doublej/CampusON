import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { format, parseISO, subDays, addDays, startOfDay } from 'date-fns';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import ChatWidget from '../../src/components/chat/ChatWidget';
import type {
  User,
  AdminStatsResponse,
  AdminAnalyticsOverview,
  UserGrowthPoint,
  AssignmentTrendPoint,
  DepartmentPerformancePoint,
  PracticeHoursPoint,
  ScoreDistributionBucket,
  ActivityHeatmapPoint,
} from '../../src/types';
import { adminAPI } from '../../src/services/api';

type LineDatum = { label: string; value: number };

const safeParseDate = (value: string) => {
  try {
    return parseISO(value);
  } catch {
    return new Date(value);
  }
};

const departmentDisplayMap: Record<string, string> = {
  NURSING: '간호학과',
  DENTAL_HYGIENE: '치위생학과',
  PHYSICAL_THERAPY: '물리치료학과',
  UNASSIGNED: '미지정',
};

const formatDepartment = (value: string) => departmentDisplayMap[value] || value || '미지정';

const MetricCard: React.FC<{ label: string; value: string; delta?: number | null; caption?: string }> = ({
  label,
  value,
  delta,
  caption,
}) => {
  const deltaLabel =
    typeof delta === 'number' && Number.isFinite(delta)
      ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
      : null;
  const deltaColor =
    typeof delta === 'number' && Number.isFinite(delta)
      ? delta > 0
        ? 'text-emerald-400'
        : delta < 0
        ? 'text-rose-400'
        : 'text-slate-400'
      : 'text-slate-400';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg transition hover:border-indigo-500/60 hover:shadow-indigo-900/30">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-50">{value}</p>
      {(deltaLabel || caption) && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          {caption ? <span>{caption}</span> : <span />}
          {deltaLabel && <span className={deltaColor}>{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
};

const ChartCard: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title,
  description,
  children,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

const LineChart: React.FC<{ data: LineDatum[]; color?: string; height?: number; minHeight?: number }> = ({
  data,
  color = '#6366f1',
  height = 220,
  minHeight = 120,
}) => {
  if (!data.length) {
    return <p className="text-sm text-slate-400">데이터가 부족합니다.</p>;
  }
  if (data.length === 1) {
    return <p className="text-sm text-slate-400">추세를 표시하려면 최소 2개 이상의 데이터가 필요합니다.</p>;
  }
  const width = 640;
  const chartHeight = Math.max(height, minHeight);
  const margin = 32;
  const innerWidth = width - margin * 2;
  const innerHeight = chartHeight - margin * 2;
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = data.map((d, idx) => {
    const x = margin + (innerWidth * idx) / (data.length - 1 || 1);
    const norm = (d.value - min) / range;
    const y = margin + innerHeight - norm * innerHeight;
    return { x, y, label: d.label, value: d.value };
  });
  const path = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `${points[0].x},${chartHeight - margin} ${path} ${points[points.length - 1].x},${chartHeight - margin}`;
  const gridLines = 4;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${chartHeight}`} className="w-full">
        {[...Array(gridLines + 1)].map((_, idx) => {
          const y = margin + (innerHeight * idx) / gridLines;
          return (
            <line
              key={`grid-${idx}`}
              x1={margin}
              y1={y}
              x2={width - margin}
              y2={y}
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth={1}
            />
          );
        })}
        <polyline
          points={areaPath}
          fill={`${color}20`}
          stroke="none"
        />
        <polyline
          points={path}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point, idx) => (
          <g key={`point-${idx}`}>
            <circle cx={point.x} cy={point.y} r={3.5} fill={color} />
          </g>
        ))}
      </svg>
      <div className="mt-3 flex justify-between text-xs text-slate-400">
        {data.filter((_, idx) => idx === 0 || idx === Math.floor(data.length / 2) || idx === data.length - 1).map((d, idx) => (
          <span key={`${d.label}-${idx}`}>{d.label}</span>
        ))}
      </div>
    </div>
  );
};

const VerticalBarChart: React.FC<{ data: LineDatum[]; color?: string; height?: number }> = ({
  data,
  color = '#22d3ee',
  height = 220,
}) => {
  if (!data.length) {
    return <p className="text-sm text-slate-400">데이터가 부족합니다.</p>;
  }
  const width = 640;
  const margin = 32;
  const innerWidth = width - margin * 2;
  const innerHeight = height - margin * 2;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(innerWidth / data.length - 16, 18);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {data.map((d, idx) => {
          const barHeight = (Math.max(d.value, 0) / max) * innerHeight;
          const x = margin + idx * (barWidth + 16);
          const y = height - margin - barHeight;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill={color}
                className="opacity-80 hover:opacity-100 transition-opacity"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex justify-between text-xs text-slate-400">
        {data.map((d) => (
          <span key={d.label} className="w-full text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const HorizontalBarList: React.FC<{ data: LineDatum[]; unit?: string; color?: string }> = ({
  data,
  unit = '',
  color = '#34d399',
}) => {
  if (!data.length) {
    return <p className="text-sm text-slate-400">데이터가 부족합니다.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => {
        const ratio = Math.max(d.value / max, 0.02);
        return (
          <div key={d.label} className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>{d.label}</span>
              <span>
                {d.value.toLocaleString()}
                {unit}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800">
              <div
                className="h-2.5 rounded-full"
                style={{ width: `${ratio * 100}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HeatmapGrid: React.FC<{ data: { date: Date; value: number }[] }> = ({ data }) => {
  if (!data.length) {
    return <p className="text-sm text-slate-400">최근 활동 데이터가 부족합니다.</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const weeks: { date: Date; value: number }[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const colorForValue = (value: number) => {
    if (value <= 0) return 'rgba(30, 41, 59, 0.8)';
    const intensity = Math.min(value / max, 1);
    const alpha = 0.2 + intensity * 0.75;
    return `rgba(99, 102, 241, ${alpha.toFixed(2)})`;
  };

  return (
    <div className="flex gap-1">
      {weeks.map((week, idx) => (
        <div key={`week-${idx}`} className="flex flex-col gap-1">
          {week.map((day) => (
            <div
              key={day.date.toISOString()}
              className="h-8 w-8 rounded-md border border-slate-800 transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: colorForValue(day.value) }}
              title={`${format(day.date, 'MM월 dd일')} • ${day.value.toLocaleString()}건`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [statsRes, analyticsRes] = await Promise.all([adminAPI.getStats(), adminAPI.getAnalyticsOverview()]);
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (analyticsRes.success && analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }
      } catch (err) {
        console.error('Failed to load admin analytics', err);
        setError('관리자 통계를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const userGrowthSeries = useMemo<LineDatum[]>(() => {
    if (!analytics?.userGrowth?.length) return [];
    return analytics.userGrowth
      .map((point: UserGrowthPoint) => {
        const date = safeParseDate(point.period);
        return { label: format(date, 'yyyy.MM'), value: point.count };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }, [analytics]);

  const assignmentSubmissionSeries = useMemo<LineDatum[]>(() => {
    if (!analytics?.assignmentTrend?.length) return [];
    return analytics.assignmentTrend
      .map((point: AssignmentTrendPoint) => {
        const date = safeParseDate(point.period);
        return { label: format(date, 'MM/dd'), value: point.submissions };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }, [analytics]);

  const assignmentScoreSeries = useMemo<LineDatum[]>(() => {
    if (!analytics?.assignmentTrend?.length) return [];
    return analytics.assignmentTrend
      .map((point: AssignmentTrendPoint) => {
        const date = safeParseDate(point.period);
        return { label: format(date, 'MM/dd'), value: Number(point.average_score || 0) };
      })
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }, [analytics]);

  const departmentBars = useMemo<LineDatum[]>(() => {
    if (!analytics?.departmentPerformance?.length) return [];
    return analytics.departmentPerformance.map((point: DepartmentPerformancePoint) => ({
      label: formatDepartment(point.department),
      value: Number(point.average_score || 0),
    }));
  }, [analytics]);

  const practiceHoursBars = useMemo<LineDatum[]>(() => {
    if (!analytics?.practiceHours?.length) return [];
    return analytics.practiceHours.map((point: PracticeHoursPoint) => ({
      label: formatDepartment(point.department),
      value: Number(point.hours || 0),
    }));
  }, [analytics]);

  const scoreDistributionBars = useMemo<LineDatum[]>(() => {
    if (!analytics?.scoreDistribution?.length) return [];
    return analytics.scoreDistribution
      .map((bucket: ScoreDistributionBucket) => ({
        label: bucket.bucket,
        value: Number(bucket.count || 0),
      }));
  }, [analytics]);

  const heatmapDays = useMemo(() => {
    if (!analytics?.activityHeatmap?.length) return [];
    const map = new Map(
      analytics.activityHeatmap.map((point: ActivityHeatmapPoint) => [
        format(safeParseDate(point.date), 'yyyy-MM-dd'),
        Number(point.count || 0),
      ]),
    );
    const end = startOfDay(new Date());
    const start = subDays(end, 41);
    const days: { date: Date; value: number }[] = [];
    for (let i = 0; i < 42; i += 1) {
      const current = addDays(start, i);
      const key = format(current, 'yyyy-MM-dd');
      days.push({ date: current, value: map.get(key) ?? 0 });
    }
    return days;
  }, [analytics]);

  const latestUserGrowth = (() => {
    if (userGrowthSeries.length < 2) return null;
    const last = userGrowthSeries[userGrowthSeries.length - 1].value;
    const prev = userGrowthSeries[userGrowthSeries.length - 2].value || 0;
    if (!prev) return null;
    return ((last - prev) / prev) * 100;
  })();

  const latestSubmissionGrowth = (() => {
    if (assignmentSubmissionSeries.length < 2) return null;
    const last = assignmentSubmissionSeries[assignmentSubmissionSeries.length - 1].value;
    const prev = assignmentSubmissionSeries[assignmentSubmissionSeries.length - 2].value || 0;
    if (!prev) return null;
    return ((last - prev) / prev) * 100;
  })();

  const totalPracticeHours = useMemo(() => {
    if (!practiceHoursBars.length) return 0;
    return practiceHoursBars.reduce((sum, item) => sum + item.value, 0);
  }, [practiceHoursBars]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const quickActions = [
    { title: '사용자 관리', description: '역할, 학과별 사용자 활동 추적', onClick: () => router.push('/admin/users'), color: 'from-sky-500 to-blue-600' },
    { title: '시스템 설정', description: '플랫폼 정책 및 접근 제어 관리', onClick: () => router.push('/admin/system'), color: 'from-fuchsia-500 to-indigo-600' },
    { title: 'RAG 관리', description: '지식 베이스 인덱싱 및 검색 품질 모니터링', onClick: () => router.push('/admin/rag'), color: 'from-emerald-500 to-teal-500' },
    { title: '통계 리포트', description: '세부 리포트 추출 및 내보내기', onClick: () => router.push('/admin/reports'), color: 'from-amber-500 to-orange-500' },
    { title: '시스템 모니터링', description: '서비스 상태와 지연 시간 점검', onClick: () => router.push('/admin/monitoring'), color: 'from-rose-500 to-red-600' },
  ];

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
          <div className="space-y-4 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto" />
            <p className="text-sm text-slate-400">관리자 대시보드 데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-50">관리자 분석 대시보드</h1>
              <p className="mt-1 text-sm text-slate-400">실시간 학습 지표와 시스템 활동을 한눈에 확인하세요.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-100">{user?.name || user?.user_id || '관리자'}</p>
                <span className="text-xs text-slate-400">CampusON Admin</span>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-500 hover:bg-rose-500/10"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          {error && (
            <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="총 사용자"
              value={(stats?.total_users ?? 0).toLocaleString()}
              delta={latestUserGrowth}
              caption="전월 대비 증가율"
            />
            <MetricCard
              label="최근 7일 활성 사용자"
              value={(stats?.active_users ?? 0).toLocaleString()}
              caption="Activity 기반 고유 사용자 수"
            />
            <MetricCard
              label="평균 점수"
              value={`${(stats?.average_score ?? 0).toFixed(1)}점`}
              delta={latestSubmissionGrowth}
              caption="최근 주간 시험 제출 대비"
            />
            <MetricCard
              label="누적 실습 시간"
              value={`${totalPracticeHours.toLocaleString()}h`}
              caption="모든 학과 실습 기록 합산"
            />
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="사용자 성장 추세" description="지난 12개월 신규 가입자 수">
              <LineChart data={userGrowthSeries} color="#818cf8" />
            </ChartCard>

            <ChartCard title="과제 제출 및 평균 점수" description="최근 12주 시험 제출량과 평균 점수">
              <LineChart data={assignmentSubmissionSeries} color="#34d399" height={200} />
              <div className="mt-6">
                <LineChart data={assignmentScoreSeries} color="#fbbf24" height={200} />
              </div>
            </ChartCard>

            <ChartCard title="학과별 성취도" description="시험 평균 점수 상위 학과">
              <VerticalBarChart data={departmentBars} color="#38bdf8" />
            </ChartCard>

            <ChartCard title="학과별 누적 실습 시간" description="임상/실습 기록 기반">
              <HorizontalBarList data={practiceHoursBars} unit="h" color="#22c55e" />
            </ChartCard>

            <ChartCard title="최근 6주 활동 열지도" description="활동 로그 기준">
              <HeatmapGrid data={heatmapDays} />
              <p className="mt-4 text-xs text-slate-500">활동 건수에 따라 색상이 진해집니다. (최근 42일)</p>
            </ChartCard>

            <ChartCard title="점수 분포 히스토그램" description="시험 결과 점수대별 제출 건수">
              <VerticalBarChart data={scoreDistributionBars} color="#f472b6" height={220} />
            </ChartCard>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="최근 인기 과제" description="30일 이내 제출 건수 상위 과제">
              <div className="space-y-4">
                {analytics?.recentAssignments?.length ? (
                  analytics.recentAssignments.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                          <p className="text-xs text-slate-500">평균 점수 {item.average_score.toFixed(1)}점</p>
                        </div>
                        <span className="text-sm text-slate-300">
                          제출 {item.submissions.toLocaleString()}건
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">최근 제출된 과제가 없습니다.</p>
                )}
              </div>
            </ChartCard>

            <ChartCard title="운영 빠른 작업" description="운영 자동화를 위한 빠른 링크">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    onClick={action.onClick}
                    className={`rounded-xl border border-transparent bg-gradient-to-r ${action.color} p-4 text-left transition hover:scale-[1.01] hover:shadow-lg`}
                  >
                    <h4 className="text-sm font-semibold text-white">{action.title}</h4>
                    <p className="mt-1 text-xs text-white/80">{action.description}</p>
                  </button>
                ))}
              </div>
            </ChartCard>
          </section>
        </main>
        <ChatWidget title="학교 안내 봇" />
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
