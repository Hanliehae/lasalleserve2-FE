
import api from './api';

export const authService = {
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Timeout untuk request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await api.post('/auth/login', { 
        email, 
        password 
      }, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.status === 'success') {
        // Simpan token dan user
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        console.log('✅ Login successful for:', email);
        return response.data;
      } else {
        // Jika backend return error dalam format success
        console.error('Login failed:', response.data.message);
        throw new Error(response.data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Handle berbagai jenis error
      if (error.name === 'AbortError') {
        throw new Error('Waktu login habis. Periksa koneksi internet Anda.');
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Failed to fetch')) {
        throw new Error('Server tidak merespon. Pastikan: 1) Backend berjalan di port 3001, 2) CORS diaktifkan.');
      } else if (error.response?.status === 401) {
        throw new Error('Email atau password salah');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint login tidak ditemukan');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Silakan coba beberapa saat lagi.');
      }
      
      throw new Error(error.message || 'Terjadi kesalahan. Silakan coba lagi.');
    }
  },

  async register(userData) {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await api.post('/auth/register', userData, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.data.status === 'success') {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        return response.data;
      } else {
        throw new Error(response.data.message || 'Registrasi gagal');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Waktu registrasi habis. Periksa koneksi internet Anda.');
      } else if (error.code === 'ERR_NETWORK') {
        throw new Error('Server tidak merespon. Pastikan backend berjalan di port 3001.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Data registrasi tidak valid');
      } else if (error.response?.status === 409) {
        throw new Error('Email sudah terdaftar');
      }
      
      throw new Error(error.message || 'Registrasi gagal. Periksa data Anda.');
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      
      // Jika error auth, clear token
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('✅ Logout successful');
    }
    
    return { status: 'success' };
  }
};