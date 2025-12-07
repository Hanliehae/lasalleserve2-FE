// src/lib/services/assetService.js - PERBAIKI DENGAN REAL BACKEND
import api from './api';

export const assetService = {
  async getAssets(search = '', category = 'all') {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'all') params.append('category', category);
      
      console.log(`📦 Fetching assets with params: ${params.toString()}`);
      const response = await api.get(`/assets?${params.toString()}`);
      
      // Transform data jika diperlukan
      if (response.data.status === 'success') {
        const assets = response.data.data.assets || [];
        
        // Calculate totals for each asset
        const processedAssets = assets.map(asset => {
          const baik = asset.conditions?.find(c => c.condition === 'baik')?.quantity || 0;
          const rusakRingan = asset.conditions?.find(c => c.condition === 'rusak_ringan')?.quantity || 0;
          const rusakBerat = asset.conditions?.find(c => c.condition === 'rusak_berat')?.quantity || 0;
          
          return {
            ...asset,
            baik,
            rusakRingan,
            rusakBerat,
            totalStock: asset.totalStock || (baik + rusakRingan + rusakBerat),
            availableStock: asset.availableStock || baik
          };
        });
        
        return {
          ...response.data,
          data: {
            ...response.data.data,
            assets: processedAssets
          }
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching assets:', error);
      // Return empty data instead of throwing error
      return {
        status: 'error',
        message: error.message || 'Gagal memuat data aset',
        data: { assets: [] }
      };
    }
  },

  async getAssetById(id) {
    try {
      console.log(`📦 Fetching asset with ID: ${id}`);
      const response = await api.get(`/assets/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching asset:', error);
      throw new Error(error.message || 'Gagal memuat detail aset');
    }
  },

  async createAsset(assetData) {
    try {
      console.log('📦 Creating new asset:', assetData.name);
      
      // Format conditions array from individual values
      const conditions = [
        { condition: 'baik', quantity: parseInt(assetData.baik) || 0 },
        { condition: 'rusak_ringan', quantity: parseInt(assetData.rusakRingan) || 0 },
        { condition: 'rusak_berat', quantity: parseInt(assetData.rusakBerat) || 0 }
      ];

      const payload = {
        name: assetData.name,
        category: assetData.category,
        location: assetData.location,
        description: assetData.description || '',
        acquisitionYear: assetData.acquisitionYear || '',
        semester: assetData.semester || '',
        conditions: conditions
      };

      console.log('📦 Payload to backend:', payload);
      const response = await api.post('/assets', payload);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating asset:', error);
      throw new Error(error.message || 'Gagal membuat aset');
    }
  },

  async updateAsset(id, assetData) {
    try {
      console.log(`📦 Updating asset ID: ${id}`);
      
      // Format conditions array
      const conditions = assetData.conditions || [
        { condition: 'baik', quantity: parseInt(assetData.baik) || 0 },
        { condition: 'rusak_ringan', quantity: parseInt(assetData.rusakRingan) || 0 },
        { condition: 'rusak_berat', quantity: parseInt(assetData.rusakBerat) || 0 }
      ];

      const payload = {
        name: assetData.name,
        category: assetData.category,
        location: assetData.location,
        description: assetData.description || '',
        acquisitionYear: assetData.acquisitionYear || '',
        semester: assetData.semester || '',
        conditions: conditions
      };

      const response = await api.put(`/assets/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating asset:', error);
      throw new Error(error.message || 'Gagal memperbarui aset');
    }
  },

  async deleteAsset(id) {
    try {
      console.log(`🗑️ Deleting asset ID: ${id}`);
      const response = await api.delete(`/assets/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting asset:', error);
      throw new Error(error.message || 'Gagal menghapus aset');
    }
  },

  async checkStockAvailability(assetId, quantity) {
    try {
      const response = await api.get(`/assets/${assetId}/check-stock?quantity=${quantity}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error checking stock:', error);
      return { 
        status: 'error',
        data: { isAvailable: false, message: 'Gagal memeriksa ketersediaan stok' }
      };
    }
  },

  // Helper method to get available assets for loan
  async getAvailableAssetsForLoan() {
    try {
      const response = await api.get('/assets?availableOnly=true&category=fasilitas');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching available assets:', error);
      return { status: 'success', data: { assets: [] } };
    }
  }
};