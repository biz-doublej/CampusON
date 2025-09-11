import axios from 'axios';

const PARSER_API_URL = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://localhost:8001';

export const questionService = {
  bulkSave: async (questions: any[]) => {
    const res = await axios.post(`${PARSER_API_URL}/api/questions/bulk`, { questions });
    return res.data;
  },
  list: async (limit = 50, offset = 0) => {
    const res = await axios.get(`${PARSER_API_URL}/api/questions`, { params: { limit, offset } });
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
