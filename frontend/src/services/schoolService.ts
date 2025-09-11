import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001';

export const schoolService = {
  ingest: async (docs: { text: string; url?: string; meta?: Record<string, any> }[]) => {
    const res = await axios.post(`${API_BASE}/api/school/ingest`, { docs });
    return res.data;
  },
  query: async (query: string, options?: { top_k?: number; urls?: string[] }) => {
    const res = await axios.post(`${API_BASE}/api/school/ai/query`, { query, ...options });
    return res.data;
  },
};

export default schoolService;

