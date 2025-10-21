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
    const cleaned = text.trim();
    if (!cleaned) return;
    const userMsg: ChatMessage = { role: 'user', content: cleaned };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);
    try {
      // 1) Hybrid AI via Node API (deep-learning answer + Gemini general knowledge)
      try {
        const response = await api.post('/api/ai/chat', {
          prompt: cleaned,
          messages: history,
          botType,
          department,
          course,
          topK,
          web: true,
        });

        if (response.data?.success) {
          const finalAnswer = response.data?.answer || response.data?.deepAnswer || response.data?.geminiAnswer;
          if (finalAnswer) {
            setMessages(prev => [...prev, { role: 'assistant', content: finalAnswer }]);
            return;
          }
        }
      } catch (err) {
        console.warn('Hybrid chat failed, fallback to direct services.', err);
      }

      // 2) Department-specific bot (Python API) fallback
      if (botType === 'department') {
        const res = await departmentService.query(cleaned, { department: department || '', course, top_k: topK });
        const answer = res?.answer || '답변을 생성하지 못했습니다.';
        setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
        return;
      }

      // 3) School info bot fallback
      const res = await schoolService.query(cleaned, { top_k: topK });
      const answer = res?.answer || '답변을 생성하지 못했습니다.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      return;
    } catch (e: any) {
      // Final safety fallback
      try {
        const res = botType === 'department'
          ? await departmentService.query(cleaned, { department: department || '', course, top_k: topK })
          : await schoolService.query(cleaned, { top_k: topK });
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
