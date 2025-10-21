import axios from 'axios';

const PARSER_API_URL = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://localhost:8001';

export const questionService = {
  bulkSave: async (questions: any[]) => {
    const res = await axios.post(`${PARSER_API_URL}/api/questions/bulk`, { questions });
    return res.data;
  },
  list: async (limit?: number, offset?: number) => {
    const params: Record<string, number> = {};
    if (typeof limit === 'number') params.limit = limit;
    if (typeof offset === 'number') params.offset = offset;
    const res = await axios.get(`${PARSER_API_URL}/api/questions`, { params });
    return res.data;
  },
  deleteOne: async (id: number) => {
    const res = await axios.delete(`${PARSER_API_URL}/api/questions/${id}`);
    return res.data;
  },
  deleteBulk: async (ids: number[]) => {
    const res = await axios.post(`${PARSER_API_URL}/api/questions/delete-bulk`, { ids });
    return res.data;
  }
};

export default questionService;
