// src/lib/services/returnService.js
import api from './api';

export const returnService = {
  async getPendingReturns() {
    try {
      console.log('🔄 Fetching pending returns');
      const response = await api.get('/returns/pending');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching pending returns:', error);
      throw new Error(error.message || 'Gagal memuat data pengembalian tertunda');
    }
  },

  async getReturnHistory(academicYear = '', semester = '') {
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (semester && semester !== 'all') params.append('semester', semester);
      
      console.log(`🔄 Fetching return history with params: ${params.toString()}`);
      const response = await api.get(`/returns/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching return history:', error);
      throw new Error(error.message || 'Gagal memuat riwayat pengembalian');
    }
  },

  async processReturn(loanId, returnData) {
    try {
      console.log(`🔄 Processing return for loan ID: ${loanId}`);
      
      // Validate all items are selected for return
      const allItemsReturned = returnData.returnedItems.every(item => item.returned);
      if (!allItemsReturned) {
        throw new Error('Semua item harus dipilih untuk dikembalikan');
      }

      // Format data untuk backend
      const payload = {
        returnedItems: returnData.returnedItems
          .filter(item => item.returned)
          .map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            condition: item.condition
          })),
        notes: returnData.notes || ''
      };

      console.log('🔄 Return payload:', payload);
      const response = await api.post(`/returns/${loanId}/process`, payload);
      return response.data;
    } catch (error) {
      console.error('❌ Error processing return:', error);
      throw new Error(error.message || error.message || 'Gagal memproses pengembalian');
    }
  },

  // Get return statistics
  async getReturnStats() {
    try {
      const pendingResponse = await this.getPendingReturns();
      const historyResponse = await this.getReturnHistory();
      
      const pendingLoans = pendingResponse.data?.loans || [];
      const historyLoans = historyResponse.data?.returns || [];
      
      const stats = {
        pending: pendingLoans.length,
        overdue: pendingLoans.filter(loan => {
          const today = new Date().toISOString().split('T')[0];
          return loan.end_date < today;
        }).length,
        waitingReturn: pendingLoans.filter(loan => loan.status === 'menunggu_pengembalian').length,
        completed: historyLoans.length
      };
      
      return {
        status: 'success',
        data: { stats }
      };
    } catch (error) {
      console.error('❌ Error getting return stats:', error);
      return {
        status: 'success',
        data: {
          stats: {
            pending: 0,
            overdue: 0,
            waitingReturn: 0,
            completed: 0
          }
        }
      };
    }
  }
};