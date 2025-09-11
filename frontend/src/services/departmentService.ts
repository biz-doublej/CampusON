import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001';

export const departmentService = {
  query: async (
    query: string,
    options: { department: string; course?: string; top_k?: number }
  ) => {
    const res = await axios.post(`${API_BASE}/api/department/ai/query`, {
      query,
      ...options,
    });
    return res.data;
  },
};

export default departmentService;

