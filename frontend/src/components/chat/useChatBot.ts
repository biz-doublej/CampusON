import { useState } from 'react';
import schoolService from '../../services/schoolService';
import departmentService from '../../services/departmentService';
import api from '../../services/api';

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export interface UseChatBotOptions {
  botType?: 'school' | 'department';
  topK?: number;
  department?: string;
  course?: string;
}

export default function useChatBot(options: UseChatBotOptions = {}) {
  const { botType = 'school', topK = 5, department, course } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      // 1) Try Gemini via Node API (with web grounding)
      try {
        const r = await api.post('/api/ai/chat', { prompt: text, web: true });
        if ((r.data?.success) && r.data?.answer) {
          setMessages(prev => [...prev, { role: 'assistant', content: r.data.answer }]);
          return;
        }
      } catch {}

      // 2) Department-specific bot (Python API)
      if (botType === 'department') {
        const res = await departmentService.query(text, { department: department || '', course, top_k: topK });
        const answer = res?.answer || '답변을 생성하지 못했습니다.';
        setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        return;
      }

      // 3) Fallback to school info bot (Python API)
      const res = await schoolService.query(text, { top_k: topK });
      const answer = res?.answer || '답변을 생성하지 못했습니다.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      return;
    } catch (e: any) {
      // Final safety fallback
      try {
        const res = botType === 'department'
          ? await departmentService.query(text, { department: department || '', course, top_k: topK })
          : await schoolService.query(text, { top_k: topK });
        const answer = res?.answer || '답변을 생성하지 못했습니다.';
        setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했어요. 잠시 후 다시 시도해주세요.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, send, setMessages };
}

