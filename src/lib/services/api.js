// src/lib/api.js - PERBAIKI DENGAN BETTER ERROR HANDLING
import axios from 'axios';

// Dynamic API base URL
const getBaseURL = () => {
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getBaseURL();

console.log('🌐 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: false,
});

// Request interceptor dengan debugging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log untuk debugging
    console.log(`🚀 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`, {
      params: config.params,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request setup error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor dengan better error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    // Network error
    if (!error.response) {
      console.error('🌐 Network Error - Backend mungkin tidak berjalan');
      console.error('   Cek: 1) Backend server running? 2) Port correct? 3) CORS enabled?');
    }

    // Auth error
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - Clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login jika bukan di halaman login
      if (!window.location.pathname.includes('/login')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }

    // Server error
    if (error.response?.status >= 500) {
      console.error('💥 Server Error - Backend mungkin crash');
    }

    // Format error response secara konsisten
    const formattedError = {
      status: 'error',
      message: error.response?.data?.message || 
               error.message || 
               'Terjadi kesalahan koneksi',
      code: error.response?.status || error.code,
      data: error.response?.data
    };

    return Promise.reject(formattedError);
  }
);

// Test koneksi ke backend
export const testConnection = async () => {
  try {
    const response = await api.get('/health', { timeout: 5000 });
    console.log('✅ Backend connection test:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to backend:', error.message);
    return false;
  }
};

export default api;