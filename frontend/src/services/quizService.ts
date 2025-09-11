import axios from 'axios';

const PARSER_API_URL = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://localhost:8001';

export const quizService = {
  create: async (title: string, questions: { id?: number; question_id?: number }[]) => {
    const res = await axios.post(`${PARSER_API_URL}/api/quiz/create`, { title, questions });
    return res.data;
  },
  get: async (quizId: number) => {
    const res = await axios.get(`${PARSER_API_URL}/api/quiz/${quizId}`);
    return res.data;
  },
  submit: async (quizId: number, answers: Record<string, string>, studentId?: string) => {
    const res = await axios.post(`${PARSER_API_URL}/api/quiz/${quizId}/submit`, { answers, student_id: studentId || 'anon' });
    return res.data;
  }
};

export default quizService;

