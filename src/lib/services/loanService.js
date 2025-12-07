import api from './api';

export const loanService = {
  async getLoans(search = '', status = 'all', academicYear = '', semester = '') {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      if (academicYear) params.append('academicYear', academicYear);
      if (semester && semester !== 'all') params.append('semester', semester);
      
      console.log(`📝 Fetching loans with params: ${params.toString()}`);
      const response = await api.get(`/loans?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching loans:', error);
      // Return empty data instead of throwing
      return {
        status: 'error',
        message: error.message || 'Gagal memuat data peminjaman',
        data: { loans: [] }
      };
    }
  },

  async getLoanById(id) {
    try {
      console.log(`📝 Fetching loan ID: ${id}`);
      const response = await api.get(`/loans/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching loan:', error);
      throw new Error(error.message || 'Gagal memuat detail peminjaman');
    }
  },

  async createLoan(loanData) {
    try {
      console.log('📝 Creating new loan');
      
      // Validasi minimal ada ruangan atau fasilitas
      if (!loanData.roomId && (!loanData.facilities || loanData.facilities.length === 0)) {
        throw new Error('Harus memilih ruangan atau minimal satu fasilitas');
      }

      // Validasi tanggal
      const startDate = new Date(loanData.startDate);
      const endDate = new Date(loanData.endDate);
      
      if (endDate < startDate) {
        throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai');
      }

      // Format data untuk backend
      const payload = {
        roomId: loanData.roomId || null,
        facilities: loanData.facilities || [],
        startDate: loanData.startDate,
        endDate: loanData.endDate,
        startTime: loanData.startTime || '08:00',
        endTime: loanData.endTime || '17:00',
        purpose: loanData.purpose || '',
        academicYear: loanData.academicYear || this.getAcademicYear(startDate),
        semester: loanData.semester || this.getSemesterFromDate(startDate)
      };

      console.log('📝 Loan payload:', payload);
      const response = await api.post('/loans', payload);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating loan:', error);
      // Return consistent error format
      return {
        status: 'error',
        message: error.message || 'Gagal membuat peminjaman',
        data: null
      };
    }
  },

// src/lib/services/loanService.js - PERBAIKI updateLoanStatus
async updateLoanStatus(id, status, notes = '') {
  try {
    console.log(`📝 Updating loan ${id} status to ${status}`, notes ? `with notes: ${notes}` : '');
    
    // Validasi status yang diizinkan
    const allowedStatus = ['disetujui', 'ditolak', 'menunggu_pengembalian', 'selesai'];
    if (!allowedStatus.includes(status)) {
      throw new Error(`Status ${status} tidak valid`);
    }

    const payload = { 
      status, 
      notes: notes || '' // Pastikan notes selalu dikirim (string kosong jika tidak ada)
    };

    console.log('📝 Update status payload:', payload);
    
    const response = await api.put(`/loans/${id}/status`, payload);
    
    // Debug response
    console.log('📝 Update status response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error updating loan status:', error);
    
    // Return consistent error format
    return {
      status: 'error',
      message: error.response?.data?.message || error.message || 'Gagal memperbarui status peminjaman',
      data: null
    };
  }
},

  async deleteLoan(id) {
    try {
      console.log(`🗑️ Deleting loan ID: ${id}`);
      const response = await api.delete(`/loans/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting loan:', error);
      return {
        status: 'error',
        message: error.message || 'Gagal menghapus peminjaman',
        data: null
      };
    }
  },

  async getAvailableAssets(category = '') {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('availableOnly', 'true');
      
      const response = await api.get(`/assets?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching available assets:', error);
      return { status: 'success', data: { assets: [] } };
    }
  },

  // Helper functions
  getAcademicYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (month >= 7) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  },

  getSemesterFromDate(date = new Date()) {
    const month = date.getMonth() + 1;
    return month >= 7 ? 'ganjil' : 'genap';
  }
};