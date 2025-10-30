import axios from 'axios';
import type { ApiResponse, KnowledgeListItem } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001';

export const kbService = {
  list: async (limit = 50): Promise<ApiResponse<KnowledgeListItem[]>> => {
    const res = await axios.get<ApiResponse<KnowledgeListItem[]>>(`${API_BASE}/api/knowledge/list`, { params: { limit } });
    return res.data;
  }
};

export default kbService;
