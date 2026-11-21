import api from './client';

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    communityName?: string;
    communityCode?: string;
  }) =>
    api.post('/auth/register', payload),
  login: (payload: { email: string; password: string }) => api.post('/auth/login', payload),
};

export const userApi = {
  profile: () => api.get('/users/profile'),
  leaderboard: () => api.get('/api/leaderboard', { baseURL: '/' }),
  joinCommunity: (code: string) => api.post('/users/join-community', { code }),
};

export const complaintApi = {
  create: (formData: FormData) =>
    api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  list: (params: { page?: number; limit?: number; category?: string; status?: string }) =>
    api.get('/complaints', { params }),
  my: () => api.get('/complaints/my'),
};

export const adminApi = {
  listComplaints: () => api.get('/admin/complaints'),
  getCommunity: () => api.get('/admin/community'),
  createOrRefreshCommunityCode: (name?: string) => api.post('/admin/community-code', { name }),
  approveComplaint: (id: string) => api.put(`/admin/complaints/${id}/approve`),
  rejectComplaint: (id: string, note: string) => api.put(`/admin/complaints/${id}/reject`, { note }),
  updateStatus: (id: string, status: string, progressNote?: string) =>
    api.put(`/admin/complaints/${id}/status`, { status, progressNote }),
};
