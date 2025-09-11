import axios from 'axios';

const PARSER_API_URL = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://localhost:8001';

export const aiService = {
  ingest: async (questions: any[]) => {
    const res = await axios.post(`${PARSER_API_URL}/api/ai/ingest`, { questions });
    return res.data;
  },
  generateQuestions: async (topic: string, count = 5, difficulty?: string, subject?: string) => {
    // Generate in batches of up to 5 to avoid backend/model returning only 5 and padding with samples
    const target = Math.max(1, count);
    let remaining = target;
    const all: any[] = [];
    while (remaining > 0) {
      const n = Math.min(5, remaining);
      const res = await axios.post(`${PARSER_API_URL}/api/ai/generate-questions`, { topic, count: n, difficulty, subject });
      const chunk = res.data?.questions || [];
      all.push(...chunk);
      remaining -= chunk.length || n; // assume full if API doesn't return length
      if (!Array.isArray(chunk) || chunk.length === 0) break;
    }
    // Normalize response shape to match previous single-call behavior
    return { success: true, questions: all.slice(0, target) };
  },
  communityChat: async (messages: { role: 'user' | 'assistant'; content: string }[], context?: string) => {
    const res = await axios.post(`${PARSER_API_URL}/api/community/ai/chat`, { messages, context });
    return res.data;
  }
};

export default aiService;
