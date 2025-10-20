import React, { useEffect, useState, useMemo, useId } from 'react';
import Head from 'next/head';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { professorAPI } from '../../src/services/api';
import type {
  ProfessorAnalyticsData,
  ProfessorScoreDistributionBucket,
  ProfessorAssignmentPerformance,
  ProfessorCompletionTrendPoint,
  ProfessorTopStudent,
} from '../../src/types';

const formatNumber = (value: number, suffix = '') => `${value.toLocaleString()}${suffix}`;
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatScore = (value: number) => `${value.toFixed(1)}점`;
const formatDepartment = (dept: string | null) => {
  if (!dept) return '미지정';
  const map: Record<string, string> = {
    NURSING: '간호학부',
    DENTAL_HYGIENE: '치위생학과',
    PHYSICAL_THERAPY: '물리치료학과',
  };
  return map[dept] || dept;
};

type SummaryMetric = {
  label: string;
  value: string;
  helper?: string;
};

const SummaryCard = ({ metric }: { metric: SummaryMetric }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{metric.label}</p>
    <p className="mt-3 text-2xl font-bold text-gray-900">{metric.value}</p>
    {metric.helper ? <p className="mt-2 text-sm text-gray-400">{metric.helper}</p> : null}
  </div>
);

const ScoreDistributionChart = ({ buckets }: { buckets: ProfessorScoreDistributionBucket[] }) => {
  if (!buckets.length) {
    return <p className="text-sm text-gray-500">점수 분포 데이터가 아직 없습니다.</p>;
  }

  const maxCount = buckets.reduce((max, bucket) => Math.max(max, bucket.count), 0) || 1;

  return (
    <div className="space-y-4">
      {buckets.map((bucket) => {
        const width = Math.max(4, (bucket.count / maxCount) * 100);
        return (
          <div key={bucket.label}>
            <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
              <span className="font-medium text-gray-700">{bucket.label}</span>
              <span>{formatNumber(bucket.count, '명')} • {bucket.percentage.toFixed(1)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CompletionTrendChart = ({ trend }: { trend: ProfessorCompletionTrendPoint[] }) => {
  const gradientId = useId();

  if (!trend.length) {
    return <p className="text-sm text-gray-500">제출 추세를 계산할 데이터가 없습니다.</p>;
  }

  const maxValue = trend.reduce((max, point) => Math.max(max, point.submissions), 0) || 1;
  const points = trend.map((point, index) => {
    const x =
      trend.length === 1 ? 50 : Number(((index / (trend.length - 1)) * 100).toFixed(2));
    const y = Number((90 - (point.submissions / maxValue) * 70).toFixed(2));
    return { x, y };
  });

  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ');

  const areaPath = `${pathD} L ${points[points.length - 1].x},90 L ${points[0].x},90 Z`;

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 100 100" className="h-48 w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" />
        {points.map((point, index) => (
          <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r={1.8} fill="#1d4ed8" />
        ))}
        <line x1="0" y1="90" x2="100" y2="90" stroke="#e5e7eb" strokeWidth={0.5} />
      </svg>
      <div className="grid grid-cols-6 gap-2 text-xs text-gray-500 sm:grid-cols-6">
        {trend.map((point) => (
          <div className="text-center" key={point.key}>
            <p className="font-medium text-gray-600">{point.label}</p>
            <p>{formatNumber(point.submissions, '회')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AssignmentPerformanceTable = ({
  items,
  totalStudents,
}: {
  items: ProfessorAssignmentPerformance[];
  totalStudents: number;
}) => {
  if (!items.length) {
    return <p className="text-sm text-gray-500">최근 등록된 과제가 없습니다.</p>;
  }

  const statusChip = (status: string) => {
    const normalized = status.toLowerCase();
    const color =
      normalized === 'published'
        ? 'bg-green-100 text-green-700'
        : normalized === 'closed'
          ? 'bg-gray-200 text-gray-700'
          : 'bg-yellow-100 text-yellow-700';
    const label =
      normalized === 'published' ? '배포됨' : normalized === 'closed' ? '종료' : '작성중';
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="hidden bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 lg:grid lg:grid-cols-5">
        <span>과제명</span>
        <span className="text-center">제출 인원</span>
        <span className="text-center">평균 점수</span>
        <span className="text-center">완료율</span>
        <span className="text-right">상태</span>
      </div>
      <div className="divide-y divide-gray-200">
        {items.map((assignment) => (
          <div
            key={assignment.id}
            className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-5 lg:items-center"
          >
            <div>
              <p className="font-medium text-gray-900">{assignment.title}</p>
              {assignment.dueDate ? (
                <p className="text-sm text-gray-500">
                  마감 {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-sm text-gray-400">마감일 없음</p>
              )}
            </div>
            <div className="text-sm text-gray-700 lg:text-center">
              {formatNumber(assignment.submissionCount, '명')}
              {totalStudents
                ? ` / ${formatPercent(
                    totalStudents ? (assignment.submissionCount / totalStudents) * 100 : 0,
                  )}`
                : ''}
            </div>
            <div className="text-sm text-gray-700 lg:text-center">
              {formatScore(assignment.averageScore)}
            </div>
            <div className="text-sm text-gray-700 lg:text-center">
              {formatPercent(assignment.completionRate)}
            </div>
            <div className="flex justify-end">{statusChip(assignment.status)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopStudentsTable = ({ students }: { students: ProfessorTopStudent[] }) => {
  if (!students.length) {
    return <p className="text-sm text-gray-500">아직 성과가 집계된 학생이 없습니다.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="hidden bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 md:grid md:grid-cols-4">
        <span>학생</span>
        <span className="text-center">제출 횟수</span>
        <span className="text-center">평균 점수</span>
        <span className="text-right">학과</span>
      </div>
      <div className="divide-y divide-gray-200">
        {students.map((student) => (
          <div
            key={student.id}
            className="flex flex-col gap-3 px-4 py-4 sm:px-6 md:grid md:grid-cols-4 md:items-center"
          >
            <div>
              <p className="font-medium text-gray-900">{student.name}</p>
              <p className="text-xs text-gray-500">{student.email || '이메일 없음'}</p>
            </div>
            <div className="text-sm text-gray-700 md:text-center">
              {formatNumber(student.submissions, '회')}
            </div>
            <div className="text-sm text-gray-700 md:text-center">
              {formatScore(student.averageScore)}
            </div>
            <div className="text-sm text-gray-700 md:text-right">
              {formatDepartment(student.department)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ProfessorAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ProfessorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await professorAPI.getAnalytics();
        if (!response.success || !response.data) {
          setError(response.message || '지표 데이터를 불러오지 못했습니다.');
        } else {
          setAnalytics(response.data);
        }
      } catch (err: unknown) {
        const fallback = '지표 데이터를 불러오는 중 오류가 발생했습니다.';
        if (err && typeof err === 'object') {
          const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
          const message = maybeResponse?.data?.message;
          setError(typeof message === 'string' ? message : fallback);
        } else {
          setError(fallback);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summaryMetrics: SummaryMetric[] = useMemo(() => {
    if (!analytics) return [];
    const { summary } = analytics;
    return [
      {
        label: '전체 학생 수',
        value: formatNumber(summary.totalStudents, '명'),
        helper: `예상 제출 수 ${formatNumber(summary.expectedSubmissions, '회')}`,
      },
      {
        label: '평균 점수',
        value: formatScore(summary.averageScore),
        helper: `총 제출 ${formatNumber(summary.submissions, '회')}`,
      },
      {
        label: '완료율',
        value: formatPercent(summary.completionRate),
        helper:
          summary.expectedSubmissions > 0
            ? `실제 제출 ${formatNumber(summary.submissions, '회')}`
            : '배포된 과제가 없습니다.',
      },
      {
        label: '과제 현황',
        value: formatNumber(summary.assignmentsPublished, '개'),
        helper: `총 ${formatNumber(summary.totalAssignments, '개')} · 검토 필요 ${formatNumber(summary.pendingReviews, '개')}`,
      },
    ];
  }, [analytics]);

  return (
    <ProtectedRoute allowedRoles={['professor']}>
      <Head>
        <title>분석 리포트 - 교수</title>
      </Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">분석 리포트</h1>
            <p className="mt-2 text-sm text-gray-500">
              학과 학생들의 학습 데이터를 기반으로 주요 학업 지표를 제공합니다.
            </p>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
              <p className="text-sm text-gray-500">지표를 불러오는 중입니다...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
              {error}
            </div>
          ) : analytics ? (
            <div className="space-y-8">
              <section>
                <h2 className="mb-4 text-lg font-semibold text-gray-800">요약 지표</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {summaryMetrics.map((metric) => (
                    <SummaryCard key={metric.label} metric={metric} />
                  ))}
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">점수 분포</h3>
                    <span className="text-xs font-medium text-blue-600">최근 전체 제출 기준</span>
                  </div>
                  <ScoreDistributionChart buckets={analytics.scoreDistribution} />
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">제출 추세</h3>
                    <span className="text-xs font-medium text-blue-600">최근 6개월</span>
                  </div>
                  <CompletionTrendChart trend={analytics.completionTrend} />
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">최근 과제 성과</h3>
                  <span className="text-xs text-gray-500">
                    최근 5개의 과제에 대한 제출 현황과 평균 점수입니다.
                  </span>
                </div>
                <AssignmentPerformanceTable
                  items={analytics.assignmentPerformance}
                  totalStudents={analytics.summary.totalStudents}
                />
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">우수 학생</h3>
                  <span className="text-xs text-gray-500">
                    평균 점수 상위 5명의 학생 목록입니다.
                  </span>
                </div>
                <TopStudentsTable students={analytics.topStudents} />
              </section>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-500">
              표시할 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
