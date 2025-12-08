
import api from './api';

export const uploadService = {
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteImage(publicId) {
    const response = await api.delete(`/upload/${publicId}`);
    return response.data;
  }
};