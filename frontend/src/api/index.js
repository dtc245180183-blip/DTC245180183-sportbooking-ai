import api from './axios';

const loginFormHeaders = { 'Content-Type': 'application/x-www-form-urlencoded' };

export const authAPI = {
  login: async (username, password) => {
    const params = new URLSearchParams({ username, password });
    const res = await api.post('/auth/login', params, { headers: loginFormHeaders });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
};

export const courtsAPI = {
  getAll: (params) => api.get('/courts/', { params }).then(r => r.data),
  getOne: (id) => api.get(`/courts/${id}`).then(r => r.data),
  create: (data) => api.post('/courts/', data).then(r => r.data),
  update: (id, data) => api.put(`/courts/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/courts/${id}`),
};

export const courtTypesAPI = {
  getAll: () => api.get('/court-types/').then(r => r.data),
  create: (data) => api.post('/court-types/', data).then(r => r.data),
  update: (id, data) => api.put(`/court-types/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/court-types/${id}`),
};

export const timeSlotsAPI = {
  getAll: (params) => api.get('/time-slots/', { params }).then(r => r.data),
  create: (data) => api.post('/time-slots/', data).then(r => r.data),
  generate: (data) => api.post('/time-slots/generate', data).then(r => r.data),
  toggleBlock: (id) => api.put(`/time-slots/${id}/toggle-block`).then(r => r.data),
};

export const bookingsAPI = {
  getAll: (params) => api.get('/bookings/', { params }).then(r => r.data),
  getOne: (id) => api.get(`/bookings/${id}`).then(r => r.data),
  create: (data) => api.post('/bookings/', data).then(r => r.data),
  confirm: (id) => api.put(`/bookings/${id}/confirm`).then(r => r.data),
  cancel: (id, data) => api.put(`/bookings/${id}/cancel`, data).then(r => r.data),
  reschedule: (id, data) => api.put(`/bookings/${id}/reschedule`, data).then(r => r.data),
  forfeitDeposit: (id) => api.put(`/bookings/${id}/forfeit-deposit`).then(r => r.data),
};

export const customersAPI = {
  getAll: (params) => api.get('/customers/', { params }).then(r => r.data),
  getOne: (id) => api.get(`/customers/${id}`).then(r => r.data),
  create: (data) => api.post('/customers/', data).then(r => r.data),
  update: (id, data) => api.put(`/customers/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const paymentsAPI = {
  getAll: (params) => api.get('/payments/', { params }).then(r => r.data),
  create: (data) => api.post('/payments/', data).then(r => r.data),
  update: (id, data) => api.put(`/payments/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/payments/${id}`),
};

export const maintenanceAPI = {
  getAll: () => api.get('/maintenance/').then(r => r.data),
  create: (data) => api.post('/maintenance/', data).then(r => r.data),
  update: (id, data) => api.put(`/maintenance/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

export const aiAPI = {
  suggestSlot: (data) => api.post('/ai/suggest-slot', data).then(r => r.data),
  generateMessage: (bookingId) => api.post(`/ai/generate-message/${bookingId}`).then(r => r.data),
  occupancySummary: (params) => api.get('/ai/occupancy-summary', { params }).then(r => r.data),
  financialInsights: (params) => api.get('/ai/financial-insights', { params }).then(r => r.data),
};

export const usersAPI = {
  getAll: () => api.get('/auth/users').then(r => r.data),
  update: (id, data) => api.put(`/auth/users/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/auth/users/${id}`),
};

export const statisticsAPI = {
  getOverview: () => api.get('/statistics/overview').then(r => r.data),
  getRevenueChart: (params) => api.get('/statistics/revenue-chart', { params }).then(r => r.data),
  getPeakHours: (params) => api.get('/statistics/peak-hours', { params }).then(r => r.data),
  getCourtOccupancy: (params) => api.get('/statistics/court-occupancy', { params }).then(r => r.data),
};
