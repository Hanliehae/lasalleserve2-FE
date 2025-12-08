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

  async deleteFile(publicId) {
    const response = await api.delete(`/upload/${publicId}`);
    return response.data;
  }
};