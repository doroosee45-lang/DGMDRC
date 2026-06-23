import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        refreshQueue.forEach((q) => q.resolve(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        refreshQueue.forEach((q) => q.reject(error));
        refreshQueue = [];
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (data) => api.post('/auth/refresh', data),
  getMe: () => api.get('/auth/me'),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA: (token) => api.post('/auth/2fa/disable', { token }),
  changePassword: (data) => api.post('/users/change-password', data),
};

export const foreignersAPI = {
  getAll: (params) => api.get('/foreigners', { params }),
  getOne: (id) => api.get(`/foreigners/${id}`),
  create: (data) => api.post('/foreigners', data),
  update: (id, data) => api.put(`/foreigners/${id}`, data),
  uploadPhoto: (id, formData) => api.patch(`/foreigners/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStats: () => api.get('/foreigners/stats'),
  checkBlacklist: (passportNumber) => api.get(`/foreigners/check-blacklist/${passportNumber}`),
};

export const movementsAPI = {
  getAll: (params) => api.get('/movements', { params }),
  register: (data) => api.post('/movements', data),
  getByForeigner: (foreignerId, params) => api.get(`/movements/${foreignerId}`, { params }),
};

export const infractionsAPI = {
  getAll: (params) => api.get('/infractions', { params }),
  create: (data) => api.post('/infractions', data),
  getByForeigner: (foreignerId) => api.get(`/infractions/${foreignerId}`),
  update: (id, data) => api.patch(`/infractions/${id}`, data),
};

export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  create: (data) => api.post('/alerts', data),
  resolve: (id, data) => api.patch(`/alerts/${id}/resolve`, data),
  getStats: () => api.get('/alerts/stats'),
};

export const blacklistAPI = {
  getAll: (params) => api.get('/blacklist', { params }),
  add: (data) => api.post('/blacklist', data),
  check: (passportNumber) => api.get(`/blacklist/check/${passportNumber}`),
  lift: (id, data) => api.patch(`/blacklist/${id}/lift`, data),
};

export const correctionsAPI = {
  getAll: (params) => api.get('/corrections', { params }),
  submit: (data) => api.post('/corrections', data),
  validate: (id, data) => api.patch(`/corrections/${id}/validate`, data),
};

export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getStats: (params) => api.get('/reports/statistics', { params }),
  exportForeigners: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

export const auditAPI = {
  getLogs: (params) => api.get('/audit', { params }),
  getStats: () => api.get('/audit/stats'),
  verifyChain: () => api.get('/audit/verify-chain'),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
};

export const borderPostsAPI = {
  getAll: (params) => api.get('/border-posts', { params }),
  create: (data) => api.post('/border-posts', data),
  update: (id, data) => api.put(`/border-posts/${id}`, data),
};

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
};

export default api;
