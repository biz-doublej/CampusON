import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001';

export const kbService = {
  list: async (limit = 50) => {
    const res = await axios.get(`${API_BASE}/api/knowledge/list`, { params: { limit } });
    return res.data;
  }
};

export default kbService;

