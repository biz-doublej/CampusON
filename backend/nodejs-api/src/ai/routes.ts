import express, { Request, Response } from 'express';
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
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Gemini API key not configured' });
    }
    if (!GoogleGenerativeAI) {
      return res.status(500).json({ success: false, message: 'Gemini SDK not installed on server' });
    }

    const { prompt, messages, system, web } = req.body || {};
    const userText: string = typeof prompt === 'string' && prompt.trim()
      ? prompt.trim()
      : (Array.isArray(messages) ? String(messages?.[messages.length - 1]?.content || '') : '');
    if (!userText) return res.status(400).json({ success: false, message: 'Missing prompt' });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      // Enable Google search grounding if requested
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
    const text = result?.response?.text?.() || result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) return res.status(200).json({ success: true, answer: '답변을 생성하지 못했습니다. 다른 표현으로 질문해 보세요.' });
    return res.json({ success: true, answer: text });
  } catch (e: any) {
    console.error('Gemini chat error:', e?.response?.data || e?.message || e);
    return res.status(500).json({ success: false, message: 'Chat failed' });
  }
});

export default router;

