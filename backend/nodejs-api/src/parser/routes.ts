import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../auth/middleware';

type AuthUser = {
  id: string;
  role: string;
  email: string;
};

const router = express.Router();

const asString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

router.post('/import', authenticateToken, async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as AuthUser | undefined;
    if (!auth?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { metadata, questions } = req.body || {};
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'questions 배열이 필요합니다.' });
    }

    const subject = asString(metadata?.subject, 'General');
    const baseTitle = asString(metadata?.title, '').trim();
    const assignmentTitle =
      baseTitle ||
      `${subject} PDF 파서 결과 (${new Date().toLocaleDateString()})`;
    const description =
      asString(metadata?.description, '') ||
      `PDF 파서 업로드 결과 - ${subject}${metadata?.year ? ` (${metadata.year}년)` : ''}`;
    let dueDate =
      metadata?.due_date && typeof metadata?.due_date === 'string'
        ? new Date(metadata.due_date)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(dueDate.getTime())) {
      dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const assignment = await prisma.assignment.create({
      data: {
        title: assignmentTitle,
        description,
        due_date: dueDate,
        status: 'DRAFT',
        type: 'QUIZ',
        tags: Array.isArray(metadata?.tags)
          ? metadata.tags.filter((tag: unknown) => typeof tag === 'string')
          : [],
        resources: Array.isArray(metadata?.resources)
          ? metadata.resources
          : undefined,
        config: {
          parser: {
            metadata,
            importedAt: new Date().toISOString(),
          },
        },
        created_by: auth.id,
      },
    });

    const records = questions.map((q: any, idx: number) => {
      const number =
        typeof q?.number === 'number'
          ? q.number
          : Number.parseInt(q?.number, 10) || idx + 1;
      const options = q?.options && typeof q.options === 'object' ? q.options : {};
      const descriptionValue =
        Array.isArray(q?.description) || typeof q?.description === 'object'
          ? q.description
          : q?.description
            ? [q.description]
            : null;
      const difficulty =
        typeof q?.difficulty === 'number'
          ? q.difficulty
          : Number.parseInt(q?.difficulty, 10) || 1;

      return {
        assignment_id: assignment.id,
        number,
        title: q?.title ? String(q.title) : `문항 ${number}`,
        content: asString(q?.content),
        description: descriptionValue,
        options,
        correct_answer: asString(q?.answer || q?.correct_answer, ''),
        explanation: q?.explanation ? String(q.explanation) : null,
        category: subject || 'general',
        difficulty,
      };
    });

    await prisma.question.createMany({
      data: records,
    });

    await prisma.activity.create({
      data: {
        user_id: auth.id,
        type: 'UPLOAD',
        title: 'PDF 파서 문제 저장',
        description: `${assignmentTitle} (${records.length}문항)`,
      },
    }).catch(() => void 0);

    return res.json({
      success: true,
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          type: assignment.type,
          status: assignment.status,
        },
        count: records.length,
      },
    });
  } catch (error) {
    console.error('Parser import error:', error);
    return res.status(500).json({
      success: false,
      message: '문제 저장 중 오류가 발생했습니다.',
    });
  }
});

export default router;
