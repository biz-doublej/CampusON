import express, { Request, Response } from 'express';
import { authenticateToken } from '../auth/middleware';
import prisma from '../lib/prisma';

const router = express.Router();

type AuthUser = {
  id: string;
  role: string;
};

type TopStudent = {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string | null;
  averageScore: number;
  submissions: number;
};

type TestResultSummary = {
  score: number | null;
  user_id: string;
  completed_at: Date | null;
};

type AssignmentWithResults = {
  id: string;
  title: string;
  due_date: Date | null;
  status: string | null;
  test_results: {
    score: number | null;
    completed_at: Date | null;
  }[];
};

type TopStudentGroup = {
  user_id: string;
  _avg: {
    score: number | null;
  };
  _count: {
    _all: number;
  };
};

type StudentProfile = {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  department: string | null;
};

const roundToOne = (value: number) => Math.round(value * 10) / 10;

const getLastMonths = (count: number) => {
  const buckets: { key: string; label: string; year: number; month: number }[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const label = `${month}월`;
    buckets.push({ key, label, year, month });
  }

  return buckets;
};

router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as AuthUser | undefined;
    if (!auth?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const me = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        role: true,
        department: true,
      },
    });

    if (!me) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (me.role !== 'PROFESSOR' && me.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const departmentFilter = me.role === 'PROFESSOR' ? me.department ?? undefined : undefined;

    const [
      totalStudents,
      totalAssignments,
      publishedAssignments,
      draftAssignments,
      rawTestResults,
      rawRecentAssignments,
      rawTopStudentGroups,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: 'STUDENT', department: departmentFilter },
      }),
      prisma.assignment.count({
        where: { created_by: me.id },
      }),
      prisma.assignment.count({
        where: { created_by: me.id, status: 'PUBLISHED' },
      }),
      prisma.assignment.count({
        where: { created_by: me.id, status: 'DRAFT' },
      }),
      prisma.testResult.findMany({
        where: { assignment: { created_by: me.id } },
        select: {
          score: true,
          user_id: true,
          completed_at: true,
        },
      }),
      prisma.assignment.findMany({
        where: { created_by: me.id },
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          test_results: {
            select: {
              score: true,
              completed_at: true,
            },
          },
        },
      }),
      prisma.testResult.groupBy({
        by: ['user_id'],
        where: { assignment: { created_by: me.id } },
        _avg: { score: true },
        _count: { _all: true },
        orderBy: { _avg: { score: 'desc' } },
        take: 5,
      }),
    ]);

    const testResults = rawTestResults as TestResultSummary[];
    const recentAssignments = rawRecentAssignments as AssignmentWithResults[];
    const topStudentGroups = rawTopStudentGroups as TopStudentGroup[];

    const totalSubmissions = testResults.length;
    const overallAverageScore = totalSubmissions
      ? roundToOne(
          testResults.reduce((sum: number, item: TestResultSummary) => sum + Number(item.score ?? 0), 0) / totalSubmissions,
        )
      : 0;

    const expectedSubmissions = totalStudents * publishedAssignments;
    const completionRate = expectedSubmissions
      ? roundToOne(Math.min(100, (totalSubmissions / expectedSubmissions) * 100))
      : 0;

    const scoreBuckets: { label: string; min: number; max: number }[] = [
      { label: '0-59', min: 0, max: 59.999 },
      { label: '60-69', min: 60, max: 69.999 },
      { label: '70-79', min: 70, max: 79.999 },
      { label: '80-89', min: 80, max: 89.999 },
      { label: '90-100', min: 90, max: 100 },
    ];

    const distribution = scoreBuckets.map((bucket) => {
      const count = testResults.filter((item: TestResultSummary) => {
        const score = Number(item.score ?? 0);
        if (Number.isNaN(score)) return false;
        if (bucket.label === '90-100') {
          return score >= bucket.min && score <= bucket.max;
        }
        return score >= bucket.min && score <= bucket.max;
      }).length;

      const percentage = totalSubmissions ? roundToOne((count / totalSubmissions) * 100) : 0;

      return {
        label: bucket.label,
        count,
        percentage,
      };
    });

    const assignmentPerformance = recentAssignments.map((assignment: AssignmentWithResults) => {
      const submissionCount = assignment.test_results.length;
      const averageScore = submissionCount
        ? roundToOne(
            assignment.test_results.reduce(
              (
                sum: number,
                result: AssignmentWithResults['test_results'][number],
              ) => sum + Number(result.score ?? 0),
              0,
            ) /
              submissionCount,
          )
        : 0;

      const completion = totalStudents
        ? roundToOne(Math.min(100, (submissionCount / totalStudents) * 100))
        : 0;

      return {
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.due_date ? assignment.due_date.toISOString() : null,
        status: String(assignment.status || '').toLowerCase(),
        submissionCount,
        averageScore,
        completionRate: completion,
      };
    });

    const monthBuckets = getLastMonths(6);
    const submissionsByMonth = testResults.reduce<Record<string, number>>((acc, result) => {
      if (!result.completed_at) return acc;
      const date = result.completed_at instanceof Date ? result.completed_at : new Date(result.completed_at);
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const completionTrend = monthBuckets.map((bucket) => ({
      label: bucket.label,
      key: bucket.key,
      submissions: submissionsByMonth[bucket.key] || 0,
    }));

    let topStudents: TopStudent[] = [];
    if (topStudentGroups.length > 0) {
      const topIds = topStudentGroups.map((group: TopStudentGroup) => group.user_id);
      const studentProfiles = (await prisma.user.findMany({
        where: { id: { in: topIds } },
        select: {
          id: true,
          user_id: true,
          name: true,
          email: true,
          department: true,
        },
      })) as StudentProfile[];

      topStudents = topStudentGroups.map((group: TopStudentGroup) => {
        const profile = studentProfiles.find((student: StudentProfile) => student.id === group.user_id);
        return {
          id: profile?.id || group.user_id,
          userId: profile?.user_id || '',
          name: profile?.name || '이름 없음',
          email: profile?.email || '',
          department: profile?.department || null,
          averageScore: roundToOne(Number(group._avg.score ?? 0)),
          submissions: group._count._all,
        };
      });
    }

    return res.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalAssignments,
          assignmentsPublished: publishedAssignments,
          pendingReviews: draftAssignments,
          averageScore: overallAverageScore,
          completionRate,
          submissions: totalSubmissions,
          expectedSubmissions,
        },
        scoreDistribution: distribution,
        assignmentPerformance,
        completionTrend,
        topStudents,
      },
    });
  } catch (error) {
    console.error('Professor analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
