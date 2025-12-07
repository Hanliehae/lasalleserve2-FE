// src/lib/services/reportService.jsx
import api from './api';

export const reportService = {
  async getDamageReports(search = '', status = 'all', priority = 'all') {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      if (priority !== 'all') params.append('priority', priority);
      
      console.log(`⚠️ Fetching damage reports with params: ${params.toString()}`);
      const response = await api.get(`/damage-reports?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching damage reports:', error);
      throw new Error(error.message || 'Gagal memuat laporan kerusakan');
    }
  },

  async getDamageReportById(id) {
    try {
      console.log(`⚠️ Fetching damage report ID: ${id}`);
      const response = await api.get(`/damage-reports/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching damage report:', error);
      throw new Error(error.message || 'Gagal memuat detail laporan');
    }
  },

  async createDamageReport(reportData) {
    try {
      console.log('⚠️ Creating new damage report');
      
      // Validate required fields
      if (!reportData.assetId) {
        throw new Error('Asset harus dipilih');
      }
      if (!reportData.description) {
        throw new Error('Deskripsi kerusakan harus diisi');
      }

      const payload = {
        assetId: reportData.assetId,
        description: reportData.description,
        priority: reportData.priority || 'sedang',
        photoUrl: reportData.photoUrl || '',
        notes: reportData.notes || ''
      };

      console.log('⚠️ Report payload:', payload);
      const response = await api.post('/damage-reports', payload);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating damage report:', error);
      throw new Error(error.message || 'Gagal membuat laporan kerusakan');
    }
  },

  async updateDamageReport(id, updateData) {
    try {
      console.log(`⚠️ Updating damage report ID: ${id}`);
      const response = await api.put(`/damage-reports/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating damage report:', error);
      throw new Error(error.message || 'Gagal memperbarui laporan kerusakan');
    }
  },

  async deleteDamageReport(id) {
    try {
      console.log(`🗑️ Deleting damage report ID: ${id}`);
      const response = await api.delete(`/damage-reports/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting damage report:', error);
      throw new Error(error.message || 'Gagal menghapus laporan kerusakan');
    }
  },

  // Get reports statistics
  async getReportStats() {
    try {
      const response = await api.get('/damage-reports');
      if (response.data.status === 'success') {
        const reports = response.data.data.damageReports || [];
        
        const stats = {
          total: reports.length,
          pending: reports.filter(r => r.status === 'menunggu').length,
          inProgress: reports.filter(r => r.status === 'dalam_perbaikan').length,
          completed: reports.filter(r => r.status === 'selesai').length,
          highPriority: reports.filter(r => r.priority === 'tinggi').length,
          mediumPriority: reports.filter(r => r.priority === 'sedang').length,
          lowPriority: reports.filter(r => r.priority === 'rendah').length
        };
        
        return {
          status: 'success',
          data: { stats }
        };
      }
      return response.data;
    } catch (error) {
      console.error('❌ Error getting report stats:', error);
      return {
        status: 'success',
        data: {
          stats: {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            highPriority: 0,
            mediumPriority: 0,
            lowPriority: 0
          }
        }
      };
    }
  }
};