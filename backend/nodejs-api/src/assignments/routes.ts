import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../auth/middleware';

const router = express.Router();

type AssignmentResource = {
  title: string;
  url: string;
  description?: string;
  type?: string;
};

type AssignmentConfig = {
  instructions?: string;
  submissionMethod?: string;
  deliverables?: string[];
  checklist?: string[];
  allowLate?: boolean;
  latePolicy?: string;
  groupWork?: {
    enabled: boolean;
    minSize?: number;
    maxSize?: number;
  };
  grading?: {
    maxScore?: number;
    rubric?: string;
  };
  evaluationCriteria?: string[];
  notifyBeforeDays?: number;
  additionalNotes?: string;
};

const ALLOWED_TYPES = new Set([
  'UPLOAD',
  'QUIZ',
  'PROJECT',
  'PRACTICAL',
  'PRESENTATION',
  'REFLECTION',
  'CLINICAL',
]);

const sanitizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
};

const sanitizeNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const sanitizeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

const sanitizeResources = (value: unknown): AssignmentResource[] => {
  if (!Array.isArray(value)) return [];
  const resources: AssignmentResource[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const url = typeof record.url === 'string' ? record.url.trim() : '';
    if (!title || !url) continue;
    const resource: AssignmentResource = { title, url };
    if (typeof record.description === 'string' && record.description.trim()) {
      resource.description = record.description.trim();
    }
    if (typeof record.type === 'string' && record.type.trim()) {
      resource.type = record.type.trim();
    }
    resources.push(resource);
  }
  return resources;
};

const sanitizeConfig = (value: unknown): AssignmentConfig | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const groupEnabled = sanitizeBoolean(raw.groupWork && (raw.groupWork as any).enabled) ?? false;
  const config: AssignmentConfig = {};

  if (typeof raw.instructions === 'string') {
    const trimmed = raw.instructions.trim();
    if (trimmed) config.instructions = trimmed;
  }
  if (typeof raw.submissionMethod === 'string' && raw.submissionMethod.trim()) {
    config.submissionMethod = raw.submissionMethod.trim();
  }

  const deliverables = sanitizeStringArray(raw.deliverables);
  if (deliverables.length) config.deliverables = deliverables;

  const checklist = sanitizeStringArray(raw.checklist);
  if (checklist.length) config.checklist = checklist;

  const allowLate = sanitizeBoolean(raw.allowLate);
  if (typeof allowLate === 'boolean') {
    config.allowLate = allowLate;
    if (allowLate && typeof raw.latePolicy === 'string' && raw.latePolicy.trim()) {
      config.latePolicy = raw.latePolicy.trim();
    }
  }

  const groupConfig = raw.groupWork && typeof raw.groupWork === 'object' ? (raw.groupWork as Record<string, unknown>) : null;
  if (groupEnabled || groupConfig) {
    config.groupWork = {
      enabled: groupEnabled,
      minSize: sanitizeNumber(groupConfig?.minSize),
      maxSize: sanitizeNumber(groupConfig?.maxSize),
    };
  }

  const maxScore = sanitizeNumber(raw.maxScore ?? (raw.grading as any)?.maxScore);
  const rubric =
    typeof (raw.rubric ?? (raw.grading as any)?.rubric) === 'string'
      ? String(raw.rubric ?? (raw.grading as any)?.rubric).trim()
      : undefined;
  if (maxScore !== undefined || rubric) {
    config.grading = {};
    if (maxScore !== undefined) config.grading.maxScore = maxScore;
    if (rubric) config.grading.rubric = rubric;
  }

  const evaluation = sanitizeStringArray(raw.evaluationCriteria ?? (raw.grading as any)?.criteria);
  if (evaluation.length) {
    config.evaluationCriteria = evaluation;
  }

  const notifyBeforeDays = sanitizeNumber(raw.notifyBeforeDays);
  if (notifyBeforeDays !== undefined) {
    config.notifyBeforeDays = notifyBeforeDays;
  }

  if (typeof raw.additionalNotes === 'string' && raw.additionalNotes.trim()) {
    config.additionalNotes = raw.additionalNotes.trim();
  }

  return Object.keys(config).length ? config : null;
};

// Helper to normalize assignment to frontend shape
const toDto = (a: any) => ({
  id: a.id,
  title: a.title,
  description: a.description,
  due_date: a.due_date.toISOString(),
  status: String(a.status || '').toLowerCase(),
  type: String(a.type || 'UPLOAD'),
  config: a.config || null,
  tags: Array.isArray(a.tags) ? a.tags : [],
  resources: Array.isArray(a.resources) ? a.resources : [],
  created_by: a.created_by,
  created_at: a.created_at.toISOString(),
  updated_at: a.updated_at.toISOString(),
});

// Create assignment (professor)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string; role: string };
    if (!auth?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { title, description, due_date, status, type, config, tags, resources } = req.body || {};
    if (!title || !description || !due_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const draftType = typeof type === 'string' ? type.toUpperCase() : 'UPLOAD';
    const normalizedType = ALLOWED_TYPES.has(draftType) ? draftType : 'UPLOAD';
    const normalizedTags = sanitizeStringArray(tags);
    const normalizedResources = sanitizeResources(resources);
    const normalizedConfig = sanitizeConfig(config);

    const created = await prisma.assignment.create({
      data: {
        title,
        description,
        due_date: new Date(due_date),
        status: (String(status || 'DRAFT').toUpperCase() as any),
        type: normalizedType as any,
        config: normalizedConfig ?? undefined,
        tags: normalizedTags,
        resources: normalizedResources.length ? normalizedResources : undefined,
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
