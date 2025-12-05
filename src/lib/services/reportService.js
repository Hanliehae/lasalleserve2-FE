// src/lib/services/reportService.jsx
import api from './api';

export const reportService = {
  async getDamageReports(search = '', status = 'all', priority = 'all') {
    const params = {};
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    if (priority !== 'all') params.priority = priority;
    
    const response = await api.get('/damage-reports', { params });
    return response.data;
  },

  async createDamageReport(reportData) {
    const response = await api.post('/damage-reports', reportData);
    return response.data;
  },

  async updateDamageReport(id, updateData) {
    const response = await api.put(`/damage-reports/${id}`, updateData);
    return response.data;
  },

  async deleteDamageReport(id) {
    const response = await api.delete(`/damage-reports/${id}`);
    return response.data;
  }
};