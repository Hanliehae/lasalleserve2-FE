// src/lib/services/loanService.jsx
import api from './api';

export const loanService = {
  async getLoans(search = '', status = 'all') {
    const params = {};
    if (search) params.search = search;
    if (status !== 'all') params.status = status;
    
    const response = await api.get('/loans', { params });
    return response.data;
  },

  async getLoanById(id) {
    const response = await api.get(`/loans/${id}`);
    return response.data;
  },

  async createLoan(loanData) {
    try {
      const response = await api.post('/loans', loanData);
      return response.data;
    } catch (error) {
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 
                          "Gagal membuat peminjaman. Periksa ketersediaan stok.";
      
      // Enhanced error for stock issues
      if (errorMessage.toLowerCase().includes('stok') || 
          errorMessage.toLowerCase().includes('tidak mencukupi')) {
        throw new Error(`❌ ${errorMessage}. Silakan kurangi jumlah atau pilih aset lain.`);
      }
      
      throw new Error(errorMessage);
    }
  },
  async updateLoanStatus(id, status) {
    const response = await api.patch(`/loans/${id}/status`, { status });
    return response.data;
  },

  async deleteLoan(id) {
    const response = await api.delete(`/loans/${id}`);
    return response.data;
  }
};