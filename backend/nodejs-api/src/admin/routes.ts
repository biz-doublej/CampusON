import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../auth/middleware';
import axios from 'axios';
import os from 'os';

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string; role: string };
    if (!auth?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
    // Accept both uppercase and lowercase ADMIN
    const isAdmin = String(auth.role || '').toUpperCase() === 'ADMIN';
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const [total_users, total_students, total_professors, total_assignments, activitiesRaw, testAgg] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'PROFESSOR' } }),
      prisma.assignment.count(),
      prisma.activity.findMany({ orderBy: { timestamp: 'desc' }, take: 5, include: { user: { select: { id: true, name: true, email: true } } } }),
      prisma.testResult.aggregate({ _avg: { score: true } }),
    ]);
    type ActivityRow = {
      id: string;
      type: string | null;
      title: string;
      description: string | null;
      timestamp: Date;
      user: { id: string; name: string | null; email: string | null } | null;
    };
    const activities = activitiesRaw as ActivityRow[];

    // Active users in last 7 days
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const active_users = await prisma.activity.findMany({ where: { timestamp: { gte: since } }, distinct: ['user_id'], select: { user_id: true } });

    const recent_activities = activities.map((activity) => ({
      id: activity.id,
      type: String(activity.type || '').toLowerCase(),
      title: activity.title,
      description: activity.description,
      timestamp: activity.timestamp.toISOString(),
      user: activity.user,
    }));

    return res.json({
      success: true,
      data: {
        total_users,
        active_users: active_users.length,
        total_students,
        total_professors,
        total_assignments,
        average_score: Number(testAgg._avg.score ?? 0),
        system_health: 100,
        recent_activities,
      },
    });
  } catch (e) {
    console.error('Admin stats error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

// Monitoring endpoint
router.get('/monitor', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string; role: string };
    if (!auth?.id) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const isAdmin = String(auth.role || '').toUpperCase() === 'ADMIN';
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const started = Date.now();
    // DB check
    let dbOk = false; let dbLatency = null as number | null;
    try {
      const t0 = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true; dbLatency = Date.now() - t0;
    } catch {
      dbOk = false;
    }

    // Python API check
    const pyBase = process.env.PYTHON_API_URL || process.env.PARSER_API_URL || 'http://127.0.0.1:8001';
    let pyOk = false; let pyVersion: string | null = null; let pyLatency: number | null = null;
    try {
      const t1 = Date.now();
      const r = await axios.get(`${pyBase}/api/health`, { timeout: 2000 });
      pyLatency = Date.now() - t1;
      pyOk = r.status === 200;
      pyVersion = r.data?.version || null;
    } catch {}

    // Frontend check (optional)
    const fe = process.env.FRONTEND_URL || 'http://localhost:3000';
    let feOk = false; let feLatency: number | null = null;
    try {
      const t2 = Date.now();
      const r = await axios.get(fe, { timeout: 2000 });
      feLatency = Date.now() - t2;
      feOk = r.status < 500;
    } catch {}

    const nodeLatency = Date.now() - started;
    const mem = process.memoryUsage();
    const load = os.loadavg ? os.loadavg() : [0, 0, 0];

    // lightweight stats for visualization
    let total_assignments = 0; let average_score = 0;
    try {
      total_assignments = await prisma.assignment.count();
      const agg = await prisma.testResult.aggregate({ _avg: { score: true } });
      average_score = Number(agg._avg.score ?? 0);
    } catch {}

    return res.json({
      success: true,
      data: {
        node: {
          status: 'ok',
          uptime_sec: process.uptime(),
          version: process.version,
          latency_ms: nodeLatency,
          memory_mb: Math.round(mem.rss / 1024 / 1024),
          cpu_load: load[0] || 0,
        },
        database: { ok: dbOk, latency_ms: dbLatency },
        api_server: { ok: true, port: process.env.PORT || '3001' },
        python_api: { ok: pyOk, version: pyVersion, latency_ms: pyLatency, base: pyBase },
        web_server: { ok: feOk, latency_ms: feLatency, url: fe },
        file_server: { ok: true, note: 'Node upload routes' },
        stats: { total_assignments, average_score },
      },
    });
  } catch (e) {
    console.error('Admin monitor error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// In-memory settings (simple process-scoped storage)
let SETTINGS: any = {
  enablePdfParsing: true,
  enableGlobalChat: true,
  defaultTheme: 'light',
  analytics: { enabled: false },
};

router.get('/settings', authenticateToken, async (req: Request, res: Response) => {
  const auth = (req as any).user as { role: string };
  if (!auth || String(auth.role || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  return res.json({ success: true, data: SETTINGS });
});

router.put('/settings', authenticateToken, async (req: Request, res: Response) => {
  const auth = (req as any).user as { role: string };
  if (!auth || String(auth.role || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const payload = req.body || {};
  SETTINGS = { ...SETTINGS, ...payload };
  return res.json({ success: true, data: SETTINGS });
});

// Users listing for admin
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { role: string };
    if (!auth || String(auth.role || '').toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const { role, department, q } = req.query as { role?: string; department?: string; q?: string };
    const where: any = {};
    if (role) where.role = String(role).toUpperCase();
    if (department) where.department = String(department).toUpperCase();
    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
        { user_id: { contains: q as string, mode: 'insensitive' } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: { id: true, user_id: true, name: true, email: true, role: true, department: true, created_at: true },
      take: 200,
    });
    return res.json({ success: true, data: users });
  } catch (e) {
    console.error('Admin users list error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Simple reports (counts by role and department)
router.get('/reports', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { role: string };
    if (!auth || String(auth.role || '').toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const roles = ['STUDENT', 'PROFESSOR', 'ADMIN'];
    const roleCounts: any = {};
    for (const r of roles) {
      roleCounts[r] = await prisma.user.count({ where: { role: r as any } });
    }
    const departments = ['NURSING', 'DENTAL_HYGIENE', 'PHYSICAL_THERAPY'];
    const deptCounts: any = {};
    for (const d of departments) {
      deptCounts[d] = await prisma.user.count({ where: { department: d as any } });
    }
    // assignments per status
    const assignmentCounts: any = {
      DRAFT: await prisma.assignment.count({ where: { status: 'DRAFT' } }),
      PUBLISHED: await prisma.assignment.count({ where: { status: 'PUBLISHED' } }),
      CLOSED: await prisma.assignment.count({ where: { status: 'CLOSED' } }),
    };

    return res.json({ success: true, data: { roleCounts, deptCounts, assignmentCounts } });
  } catch (e) {
    console.error('Admin reports error:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
