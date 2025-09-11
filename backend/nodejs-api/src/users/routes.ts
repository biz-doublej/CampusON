import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../auth/middleware';

type Department = 'NURSING' | 'DENTAL_HYGIENE' | 'PHYSICAL_THERAPY';

const router = express.Router();

// Map frontend department keys to Prisma enum
const mapDepartment = (frontendDept?: string): Department | undefined => {
  if (!frontendDept) return undefined;
  const key = frontendDept.toLowerCase();
  const mapping: Record<string, Department> = {
    nursing: 'NURSING',
    dental_hygiene: 'DENTAL_HYGIENE',
    physical_therapy: 'PHYSICAL_THERAPY',
  };
  return mapping[key];
};

// GET /api/users/students?department=nursing
// Returns students filtered by department. If department omitted, use current user's department if available.
router.get('/students', authenticateToken, async (req: Request, res: Response) => {
  try {
    const qDept = (req.query.department as string | undefined) || undefined;
    const authUser = (req as any).user as { id: string; role: string } | undefined;

    let targetDepartment: Department | undefined = mapDepartment(qDept);

    // If no department in query, try to infer from authenticated user
    if (!targetDepartment && authUser?.id) {
      const me = await prisma.user.findUnique({ where: { id: authUser.id } });
      if (me?.department) {
        targetDepartment = me.department as Department;
      }
    }

    if (!targetDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department is required to list students.'
      });
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        department: targetDepartment,
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        user_id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        profile_image: true,
        year: true,
        created_at: true,
        updated_at: true,
      },
    });

    return res.json({ success: true, data: students });
  } catch (error) {
    console.error('List students error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/users/:id - basic user detail
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        user_id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        profile_image: true,
        year: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/users/:id/grades - student's test results with assignment info
router.get('/:id/grades', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const results = await prisma.testResult.findMany({
      where: { user_id: id },
      orderBy: { completed_at: 'desc' },
      include: {
        assignment: true,
      },
    });

    const data = results.map((r) => ({
      id: r.id,
      assignment_id: r.assignment_id,
      assignment_title: (r as any).assignment?.title || '',
      score: r.score,
      total_questions: r.total_questions,
      correct_answers: r.correct_answers,
      time_spent: r.time_spent,
      completed_at: r.completed_at,
      status: (r as any).assignment?.status || 'PUBLISHED',
      due_date: (r as any).assignment?.due_date || null,
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Get user grades error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
