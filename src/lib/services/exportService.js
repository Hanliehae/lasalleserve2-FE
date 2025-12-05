// src/lib/services/exportService.jsx
import api from './api';

export const exportService = {
  async exportLoans(academicYear = '', semester = 'all', format = 'csv') {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (semester) params.append('semester', semester);
    params.append('format', format);

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/export/loans?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    if (format === 'csv') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loans_export_${academicYear || 'all'}_${semester}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'File downloaded' };
    }

    return await response.json();
  },

  async exportDamageReports(academicYear = '', semester = 'all', format = 'csv') {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    if (semester) params.append('semester', semester);
    params.append('format', format);

    const token = localStorage.getItem('token');
    const response = await fetch(`/api/export/damage-reports?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    if (format === 'csv') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `damage_reports_export_${academicYear || 'all'}_${semester}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'File downloaded' };
    }

    return await response.json();
  }
};