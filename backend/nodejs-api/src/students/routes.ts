import express, { Request, Response } from 'express';
import { authenticateToken } from '../auth/middleware';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/students/me/practice-hours
router.get('/me/practice-hours', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string };
    if (!auth?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const agg = await prisma.practicalHour.aggregate({ _sum: { hours: true }, where: { user_id: auth.id } });
    const total = Number(agg._sum.hours ?? 0);
    return res.json({ success: true, data: { total_hours: total } });
  } catch (e) {
    console.error('Practice hours error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

