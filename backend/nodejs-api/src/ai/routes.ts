import express, { Request, Response } from 'express';
import axios from 'axios';
import { authenticateToken } from '../auth/middleware';

// Lazy import to avoid crash if dependency not installed yet
let GoogleGenerativeAI: any;
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
  GoogleGenerativeAI = null;
}

const router = express.Router();

router.post('/chat', authenticateToken, async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const {
      prompt,
      messages,
      system,
      web,
      botType,
      department,
      course,
      topK,
    } = req.body || {};

    const userText: string = typeof prompt === 'string' && prompt.trim()
      ? prompt.trim()
      : (Array.isArray(messages) ? String(messages?.[messages.length - 1]?.content || '') : '');
    if (!userText) return res.status(400).json({ success: false, message: 'Missing prompt' });

    const pythonBase = process.env.PYTHON_API_URL || process.env.PARSER_API_URL || 'http://127.0.0.1:8001';
    let deepAnswer: string | null = null;
    let deepSources: any = null;

    if (pythonBase) {
      try {
        if (botType === 'department' && department) {
          const resp = await axios.post(`${pythonBase}/api/department/ai/query`, {
            query: userText,
            department,
            course,
            top_k: topK ?? 5,
          });
          deepAnswer = resp.data?.answer || resp.data?.result || null;
          deepSources = resp.data?.sources || null;
        } else {
          const resp = await axios.post(`${pythonBase}/api/school/ai/query`, {
            query: userText,
            top_k: topK ?? 5,
          });
          deepAnswer = resp.data?.answer || resp.data?.result || null;
          deepSources = resp.data?.sources || null;
        }
      } catch (err) {
        console.warn('Deep assistant query failed:', (err as any)?.message || err);
      }
    }

    const isInsufficient = (answer: string | null) => {
      if (!answer) return true;
      const normalized = answer.replace(/\s+/g, '').trim();
      return normalized.length === 0 || normalized.includes('관련정보가부족합니다');
    };

    const canUseGemini = Boolean(apiKey && GoogleGenerativeAI);
    let geminiAnswer: string | null = null;

    if (canUseGemini) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
          tools: web ? [{ googleSearchRetrieval: {} }] as any : undefined,
          systemInstruction: system || 'You are CampusON 학사 도우미. 한국어로 간결하고 정확하게 답변하세요.',
        });

        const history = Array.isArray(messages)
          ? messages
              .filter((m: any) => !!m?.content)
              .map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: String(m.content) }],
              }))
          : [];

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(userText);
        geminiAnswer = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch (err) {
        console.error('Gemini chat error:', (err as any)?.response?.data || (err as any)?.message || err);
      }
    }

    const sections: string[] = [];
    if (!isInsufficient(deepAnswer)) sections.push(`📘 학사 도우미\n${deepAnswer?.trim()}`);
    if (geminiAnswer) sections.push(`💡 일반 지식\n${geminiAnswer.trim()}`);
    const combined = sections.join('\n\n').trim();
    const finalAnswer = combined || '답변을 생성하지 못했습니다. 다른 표현으로 질문해 보세요.';

    return res.json({
      success: true,
      answer: finalAnswer,
      deepAnswer,
      geminiAnswer,
      deepSources,
      used: {
        deep: Boolean(deepAnswer),
        gemini: Boolean(geminiAnswer),
      },
    });
  } catch (e: any) {
    console.error('Hybrid chat error:', e?.response?.data || e?.message || e);
    return res.status(500).json({ success: false, message: 'Chat failed' });
  }
});

export default router;
