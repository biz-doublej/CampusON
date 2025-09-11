import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_PARSER_API_URL || 'http://127.0.0.1:8001';

export const communityV2Service = {
  // verification
  verify: async (user_id: string, kbu_verified: boolean) => {
    const res = await axios.post(`${API_BASE}/api/community/verify`, { user_id, kbu_verified });
    return res.data;
  },

  // boards
  createBoard: async (user_id: string, name: string, description?: string, is_anonymous?: boolean) => {
    const res = await axios.post(`${API_BASE}/api/community/boards`, { user_id, name, description, is_anonymous });
    return res.data;
  },
  listBoards: async () => {
    const res = await axios.get(`${API_BASE}/api/community/boards`);
    return res.data;
  },

  // posts
  createPost: async (params: { user_id: string; board_id: number; title: string; content: string; is_anonymous?: boolean; tags?: string[] }) => {
    const res = await axios.post(`${API_BASE}/api/community/posts`, params);
    return res.data;
  },
  listPosts: async (board_id: number, q?: string) => {
    const res = await axios.get(`${API_BASE}/api/community/posts`, { params: { board_id, q } });
    return res.data;
  },
  addComment: async (post_id: number, user_id: string, content: string, is_anonymous?: boolean) => {
    const res = await axios.post(`${API_BASE}/api/community/comments`, { post_id, user_id, content, is_anonymous });
    return res.data;
  },
  toggleLike: async (post_id: number, user_id: string) => {
    const res = await axios.post(`${API_BASE}/api/community/posts/${post_id}/like`, { user_id });
    return res.data;
  },
  toggleBookmark: async (post_id: number, user_id: string) => {
    const res = await axios.post(`${API_BASE}/api/community/posts/${post_id}/bookmark`, { user_id });
    return res.data;
  },

  // notifications
  listNotifications: async (user_id: string) => {
    const res = await axios.get(`${API_BASE}/api/community/notifications`, { params: { user_id } });
    return res.data;
  },
  markNotificationRead: async (nid: number, user_id: string) => {
    const res = await axios.post(`${API_BASE}/api/community/notifications/${nid}/read`, { user_id });
    return res.data;
  },

  // timetable
  addTimetable: async (payload: { user_id: string; lecture_code?: string; title: string; day_of_week: number; time_start: string; time_end: string; location?: string }) => {
    const res = await axios.post(`${API_BASE}/api/community/timetable`, payload);
    return res.data;
  },
  listTimetable: async (user_id: string) => {
    const res = await axios.get(`${API_BASE}/api/community/timetable`, { params: { user_id } });
    return res.data;
  },

  // lectures
  addLecture: async (payload: { code: string; title: string; professor?: string; department?: string }) => {
    const res = await axios.post(`${API_BASE}/api/community/lectures`, payload);
    return res.data;
  },
  addLectureReview: async (lecture_id: number, payload: { user_id: string; rating: number; difficulty?: number; workload?: number; content?: string }) => {
    const res = await axios.post(`${API_BASE}/api/community/lectures/${lecture_id}/review`, payload);
    return res.data;
  },
  listLectureReviews: async (lecture_id: number) => {
    const res = await axios.get(`${API_BASE}/api/community/lectures/${lecture_id}/review`);
    return res.data;
  },

  // groups
  createGroup: async (user_id: string, name: string, group_type?: string) => {
    const res = await axios.post(`${API_BASE}/api/community/groups`, { user_id, name, group_type });
    return res.data;
  },
  joinGroup: async (group_id: number, user_id: string) => {
    const res = await axios.post(`${API_BASE}/api/community/groups/${group_id}/join`, { user_id });
    return res.data;
  },
  sendGroupMessage: async (group_id: number, user_id: string, content: string) => {
    const res = await axios.post(`${API_BASE}/api/community/groups/${group_id}/messages`, { user_id, content });
    return res.data;
  },
  listGroupMessages: async (group_id: number) => {
    const res = await axios.get(`${API_BASE}/api/community/groups/${group_id}/messages`);
    return res.data;
  },

  // market & search
  addMarketItem: async (user_id: string, title: string, description?: string, price?: number) => {
    const res = await axios.post(`${API_BASE}/api/community/market`, { user_id, title, description, price });
    return res.data;
  },
  listMarket: async () => {
    const res = await axios.get(`${API_BASE}/api/community/market`);
    return res.data;
  },
  searchAll: async (q: string) => {
    const res = await axios.get(`${API_BASE}/api/community/search`, { params: { q } });
    return res.data;
  }
};

export default communityV2Service;

