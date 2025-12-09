// src/lib/services/uploadService.js
import api from './api';

export const uploadService = {
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Alias for uploadFile - used by loans-page.jsx and reports-page.jsx
  async uploadImage(file) {
    return this.uploadFile(file);
  },

  async deleteFile(publicId, resourceType = 'image') {
    const response = await api.delete(`/upload/${publicId}?resourceType=${resourceType}`);
    return response.data;
  }
};