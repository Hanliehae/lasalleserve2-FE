import api from './api';

export const dashboardService = {
  async getStats() {
    try {
      console.log('📊 Fetching dashboard stats');
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      // Return default stats on error
      return {
        status: 'success',
        data: {
          stats: {
            totalAssets: 0,
            totalLoans: 0,
            totalReports: 0,
            lowStockAssets: 0,
            pendingLoans: 0,
            activeLoans: 0,
            pendingReports: 0,
            overdueLoans: 0
          }
        }
      };
    }
  },

  async getRecentActivity() {
    try {
      console.log('📊 Fetching recent activity');
      const response = await api.get('/dashboard/activities');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching recent activity:', error);
      return {
        status: 'success',
        data: { activities: [] }
      };
    }
  }
};
      
//       return response.data;
//     } catch (error) {
//       console.error('❌ Error fetching dashboard stats:', error);
//       // Return default stats on error
//       return {
//         status: 'success',
//         data: {
//           stats: {
//             totalAssets: 0,
//             totalLoans: 0,
//             totalReports: 0,
//             lowStockAssets: 0,
//             pendingLoans: 0,
//             activeLoans: 0,
//             pendingReports: 0,
//             overdueLoans: 0
//           }
//         }
//       };
//     }
//   },

//   async getRecentActivities() {
//     try {
//       console.log('📊 Fetching recent activities');
//       const response = await api.get('/dashboard/activities');
//       return response.data;
//     } catch (error) {
//       console.error('❌ Error fetching recent activities:', error);
//       // Return empty activities on error
//       return {
//         status: 'success',
//         data: {
//           activities: []
//         }
//       };
//     }
//   },

//   // Get quick stats for dashboard cards
//   async getQuickStats(role) {
//     try {
//       const statsResponse = await this.getStats();
      
//       if (statsResponse.status === 'success') {
//         const stats = statsResponse.data.stats;
        
//         // Return different stats based on role
//         switch (role) {
//           case 'admin_buf':
//           case 'kepala_buf':
//             return {
//               totalAssets: stats.totalAssets,
//               totalLoans: stats.totalLoans,
//               totalReports: stats.totalReports,
//               lowStockAssets: stats.lowStockAssets
//             };
//           case 'staf_buf':
//             return {
//               totalAssets: stats.totalAssets,
//               pendingLoans: stats.pendingLoans,
//               activeLoans: stats.activeLoans,
//               pendingReports: stats.pendingReports
//             };
//           default:
//             return {
//               pendingLoans: stats.pendingLoans || 0,
//               activeLoans: stats.activeLoans || 0,
//               totalReports: stats.totalReports || 0,
//               overdueLoans: stats.overdueLoans || 0
//             };
//         }
//       }
      
//       return {};
//     } catch (error) {
//       console.error('❌ Error getting quick stats:', error);
//       return {};
//     }
//   }
// };