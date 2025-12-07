// src/lib/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Interceptor untuk request
// Interceptor untuk request - PERBAIKI UNTUK EKSPOR
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set responseType untuk CSV
    if (config.url.includes('/export/') && config.params?.format === 'csv') {
      config.responseType = 'text';
    }
    
    console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`, config.params || '');
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor untuk response - TAMBAHKAN HANDLING CSV
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    
    // Handle CSV response
    if (response.config.responseType === 'text' && typeof response.data === 'string') {
      return response;
    }
    
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      console.log('🔒 Token expired, redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      status: 'error',
      message: error.response?.data?.message || error.message || 'Terjadi kesalahan',
      data: error.response?.data,
      code: error.response?.status
    });
  }
);
export default api;