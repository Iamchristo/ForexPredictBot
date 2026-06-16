import axios from 'axios';
import { tokenStorage } from './auth';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      tokenStorage.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth API
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

// Users API
export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  getTrades: (params?: { skip?: number; limit?: number }) =>
    api.get('/users/me/trades', { params }),
  getSubscription: () => api.get('/users/me/subscription'),
  deleteAccount: () => api.delete('/users/me'),
};

// Trading API
export const tradingApi = {
  getMarkets: () => api.get('/trading/markets'),
  analyze: (data: { market: string; pair: string; timeframe: string }) =>
    api.post('/trading/analyze', data),
  getHistory: (params?: { skip?: number; limit?: number }) =>
    api.get('/trading/history', { params }),
};

// Subscriptions API
export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/'),
  getMy: () => api.get('/subscriptions/my'),
  subscribe: (data: { plan_id: number; billing_cycle: string }) =>
    api.post('/subscriptions/subscribe', data),
  cancel: () => api.post('/subscriptions/cancel'),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  suspendUser: (id: number) => api.post(`/admin/users/${id}/suspend`),
  activateUser: (id: number) => api.post(`/admin/users/${id}/activate`),
  impersonateUser: (id: number) => api.post(`/admin/users/${id}/impersonate`),
  getTransactions: (params?: any) => api.get('/admin/transactions', { params }),
  getSubscriptionPlans: () => api.get('/admin/subscriptions'),
  createPlan: (data: any) => api.post('/admin/subscriptions', data),
  updatePlan: (id: number, data: any) => api.put(`/admin/subscriptions/${id}`, data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.put('/admin/settings', data),
};
