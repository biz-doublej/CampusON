import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../auth/middleware';

const router = express.Router();

// Helper to normalize assignment to frontend shape
const toDto = (a: any) => ({
  id: a.id,
  title: a.title,
  description: a.description,
  due_date: a.due_date.toISOString(),
  status: String(a.status || '').toLowerCase(),
  created_by: a.created_by,
  created_at: a.created_at.toISOString(),
  updated_at: a.updated_at.toISOString(),
});

// Create assignment (professor)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string; role: string };
    if (!auth?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { title, description, due_date, status } = req.body || {};
    if (!title || !description || !due_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const created = await prisma.assignment.create({
      data: {
        title,
        description,
        due_date: new Date(due_date),
        status: (String(status || 'DRAFT').toUpperCase() as any),
        created_by: auth.id,
      },
    });

    // Log activity for professor
    await prisma.activity.create({
      data: {
        user_id: auth.id,
        type: 'ASSIGNMENT',
        title: '과제 생성',
        description: `과제 '${title}' 생성됨`,
      },
    }).catch(() => void 0);

    return res.json({ success: true, data: toDto(created) });
  } catch (e) {
    console.error('Create assignment error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// List assignments for current user role
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string; role: string };
    if (!auth?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Professors see their own by default; students see published
    const role = String(auth.role || '').toUpperCase();
    let rows: any[] = [];
    if (role === 'PROFESSOR') {
      rows = await prisma.assignment.findMany({ where: { created_by: auth.id }, orderBy: { created_at: 'desc' } });
    } else if (role === 'ADMIN') {
      rows = await prisma.assignment.findMany({ orderBy: { created_at: 'desc' } });
    } else {
      rows = await prisma.assignment.findMany({ where: { status: 'PUBLISHED' }, orderBy: { due_date: 'asc' } });
    }
    return res.json({ success: true, data: rows.map(toDto) });
  } catch (e) {
    console.error('List assignments error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get single assignment
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const a = await prisma.assignment.findUnique({ where: { id } });
    if (!a) return res.status(404).json({ success: false, message: 'Assignment not found' });
    return res.json({ success: true, data: toDto(a) });
  } catch (e) {
    console.error('Get assignment error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update status (publish/close)
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string; role: string };
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ success: false, message: 'Missing status' });
    const current = await prisma.assignment.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, message: 'Assignment not found' });
    const isCreator = current.created_by === auth.id;
    const isAdmin = String(auth.role || '').toUpperCase() === 'ADMIN';
    if (!isCreator && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const updated = await prisma.assignment.update({ where: { id }, data: { status: (String(status).toUpperCase() as any) } });
    return res.json({ success: true, data: toDto(updated) });
  } catch (e) {
    console.error('Update assignment status error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Submit upload (metadata only for now)
router.post('/:id/submissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string };
    const { id } = req.params;
    const { note, url } = req.body || {};
    const a = await prisma.assignment.findUnique({ where: { id } });
    if (!a) return res.status(404).json({ success: false, message: 'Assignment not found' });

    // Record as activity for now
    const activity = await prisma.activity.create({
      data: {
        user_id: auth.id,
        type: 'UPLOAD',
        title: '과제 제출',
        description: `assignment=${id}${url ? `, url=${url}` : ''}${note ? `, note=${note}` : ''}`,
      },
    });
    return res.json({ success: true, data: { id: activity.id } });
  } catch (e) {
    console.error('Submit assignment error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// List submissions for an assignment (creator/admin only)
router.get('/:id/submissions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string; role: string };
    const { id } = req.params;

    const a = await prisma.assignment.findUnique({ where: { id } });
    if (!a) return res.status(404).json({ success: false, message: 'Assignment not found' });
    const isCreator = a.created_by === auth.id;
    const isAdmin = String(auth.role || '').toUpperCase() === 'ADMIN';
    if (!isCreator && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const activitiesRaw = await prisma.activity.findMany({
      where: {
        type: 'UPLOAD',
        description: { contains: `assignment=${id}` },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    type SubmissionActivity = {
      id: string;
      description: string | null;
      timestamp: Date;
      user: { id: string; name: string | null; email: string | null } | null;
    };
    const activities = activitiesRaw as SubmissionActivity[];

    const parse = (desc: string | null): { url?: string; note?: string } => {
      if (!desc) return {};
      // description format: "assignment=<id>, url=<url>, note=<note>"
      const out: any = {};
      const urlMatch = desc.match(/url=([^,]+)(?:,|$)/);
      if (urlMatch) out.url = urlMatch[1].trim();
      const noteMatch = desc.match(/note=(.*)$/);
      if (noteMatch) out.note = noteMatch[1].trim();
      return out;
    };

    const data = activities.map((activity) => ({
      id: activity.id,
      user: activity.user,
      submitted_at: activity.timestamp.toISOString(),
      ...parse(activity.description || ''),
    }));

    return res.json({ success: true, data });
  } catch (e) {
    console.error('List submissions error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
