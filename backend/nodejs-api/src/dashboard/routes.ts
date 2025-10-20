import express, { Request, Response } from 'express';
import { authenticateToken } from '../auth/middleware';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/dashboard/v2/stats
router.get('/v2/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string; role: string };
    if (!auth?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const me = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!me) return res.status(404).json({ success: false, message: 'User not found' });

    let total_students = 0;
    let total_assignments = 0;
    let pending_reviews = 0;
    let average_score = 0;

    if (me.role === 'PROFESSOR') {
      total_students = await prisma.user.count({ where: { role: 'STUDENT', department: me.department || undefined } });
      total_assignments = await prisma.assignment.count({ where: { created_by: me.id } });
      pending_reviews = await prisma.assignment.count({ where: { created_by: me.id, status: 'DRAFT' } });
      const agg = await prisma.testResult.aggregate({ _avg: { score: true }, where: { assignment: { created_by: me.id } } });
      average_score = Number(agg._avg.score ?? 0);
    } else if (me.role === 'STUDENT') {
      total_assignments = await prisma.assignment.count();
      const completed = await prisma.testResult.count({ where: { user_id: me.id } });
      const agg = await prisma.testResult.aggregate({ _avg: { score: true }, where: { user_id: me.id } });
      average_score = Number(agg._avg.score ?? 0);
      return res.json({ success: true, data: { total_assignments, completed_assignments: completed, average_score, recent_activities: [] } });
    } else {
      total_students = await prisma.user.count({ where: { role: 'STUDENT' } });
      total_assignments = await prisma.assignment.count();
      const agg = await prisma.testResult.aggregate({ _avg: { score: true } });
      average_score = Number(agg._avg.score ?? 0);
    }

    return res.json({ success: true, data: { total_students, total_assignments, pending_reviews, average_score, recent_activities: [] } });
  } catch (e) {
    console.error('Dashboard v2 stats error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/dashboard/v2/activities
router.get('/v2/activities', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string };
    if (!auth?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const rowsRaw = await prisma.activity.findMany({ where: { user_id: auth.id }, orderBy: { timestamp: 'desc' }, take: 10 });
    type ActivityRow = {
      id: string;
      type: string | null;
      title: string;
      description: string | null;
      timestamp: Date;
    };
    const rows = rowsRaw as ActivityRow[];
    const data = rows.map((row) => ({
      id: row.id,
      type: String(row.type || '').toLowerCase(),
      title: row.title,
      description: row.description,
      timestamp: row.timestamp.toISOString(),
    }));
    return res.json({ success: true, data });
  } catch (e) {
    console.error('Dashboard v2 activities error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
