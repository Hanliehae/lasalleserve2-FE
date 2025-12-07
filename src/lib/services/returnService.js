// src/lib/services/returnService.js - PERBAIKAN COMPLETE
import api from './api';

export const returnService = {
  async getPendingReturns() {
    try {
      console.log('🔄 Fetching pending returns');
      const response = await api.get('/returns/pending');
      
      // Pastikan response memiliki struktur yang benar
      if (response.data && response.data.status === 'success') {
        console.log('✅ Pending returns fetched successfully:', response.data.data?.loans?.length || 0, 'loans');
        return response.data;
      } else {
        // Jika response tidak sesuai format yang diharapkan
        throw new Error(response.data?.message || 'Format response tidak valid');
      }
    } catch (error) {
      console.error('❌ Error fetching pending returns:', error);
      
      // Return response error dengan format konsisten
      return {
        status: 'error',
        message: error.response?.data?.message || error.message || 'Gagal memuat data pengembalian tertunda',
        data: { loans: [], stats: { total: 0, overdue: 0, today: 0 } }
      };
    }
  },

  async getReturnHistory(academicYear = '', semester = '') {
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (semester && semester !== 'all') params.append('semester', semester);
      
      console.log(`🔄 Fetching return history with params: ${params.toString()}`);
      const response = await api.get(`/returns/history?${params.toString()}`);
      
      if (response.data && response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Format response tidak valid');
      }
    } catch (error) {
      console.error('❌ Error fetching return history:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message || 'Gagal memuat riwayat pengembalian',
        data: { returns: [] }
      };
    }
  },

  async processReturn(loanId, returnData) {
    try {
      console.log(`🔄 Processing return for loan ID: ${loanId}`);
      
      // Validasi semua items
      if (!returnData.returnedItems || returnData.returnedItems.length === 0) {
        throw new Error('Minimal satu item harus dikembalikan');
      }

      const payload = {
        returnedItems: returnData.returnedItems
          .filter(item => item.returned)
          .map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            condition: item.condition || 'baik'
          })),
        notes: returnData.notes || ''
      };

      console.log('🔄 Return payload:', payload);
      const response = await api.post(`/returns/${loanId}/process`, payload);
      
      if (response.data && response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Format response tidak valid');
      }
    } catch (error) {
      console.error('❌ Error processing return:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || error.message || 'Gagal memproses pengembalian',
        data: null
      };
    }
  },

  async getReturnStats() {
    try {
      const pendingResponse = await this.getPendingReturns();
      const historyResponse = await this.getReturnHistory();
      
      // Handle jika ada error
      if (pendingResponse.status === 'error') {
        console.warn('⚠️ Could not get pending returns for stats');
      }
      
      if (historyResponse.status === 'error') {
        console.warn('⚠️ Could not get return history for stats');
      }
      
      const pendingLoans = pendingResponse.status === 'success' ? pendingResponse.data?.loans || [] : [];
      const historyLoans = historyResponse.status === 'success' ? historyResponse.data?.returns || [] : [];
      
      const stats = {
        pending: pendingLoans.length,
        overdue: pendingLoans.filter(loan => {
          const today = new Date().toISOString().split('T')[0];
          return loan.endDate < today;
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