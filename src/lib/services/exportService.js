// src/lib/services/exportService.jsx
import api from './api';

export const exportService = {
 async exportLoans(academicYear = '', semester = 'all', format = 'csv') {
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (semester && semester !== 'all') params.append('semester', semester);
      params.append('format', format);

      const response = await api.get(`/export/loans?${params.toString()}`);

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loans_export_${academicYear || 'all'}_${semester}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true, message: 'File berhasil diunduh' };
      }

      return response.data;
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(error.response?.data?.message || 'Export gagal');
    }
  },

   async exportDamageReports(academicYear = '', semester = 'all', format = 'csv') {
    try {
      const params = new URLSearchParams();
      if (academicYear) params.append('academicYear', academicYear);
      if (semester && semester !== 'all') params.append('semester', semester);
      params.append('format', format);

      const response = await api.get(`/export/damage-reports?${params.toString()}`);

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `damage_reports_export_${academicYear || 'all'}_${semester}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true, message: 'File berhasil diunduh' };
      }

      return response.data;
    } catch (error) {
      console.error('Export error:', error);
      throw new Error(error.response?.data?.message || 'Export gagal');
    }
  }
};