// src/lib/services/returnService.jsx
import api from './api';

export const returnService = {
  async getPendingReturns() {
    const response = await api.get('/returns/pending');
    return response.data;
  },

  async getReturnHistory(academicYear = null, semester = null) {
    const params = {};
    if (academicYear) params.academicYear = academicYear;
    if (semester) params.semester = semester;
    
    const response = await api.get('/returns/history', { params });
    return response.data;
  },

  async processReturn(loanId, returnData) {
    const response = await api.post(`/returns/${loanId}/process`, returnData);
    return response.data;
  }
};