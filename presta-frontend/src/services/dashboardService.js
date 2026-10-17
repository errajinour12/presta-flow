import api from './api';

const dashboardService = {
  /**
   * Récupère toutes les statistiques et l'activité récente pour le Dashboard Admin.
   * @returns {Promise<Object>} AdminDashboardStatsResponse
   */
  getAdminStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  /**
   * Récupère toutes les statistiques et l'activité récente pour le Dashboard Prestataire.
   * @returns {Promise<Object>} PrestataireDashboardStatsResponse
   */
  getPrestataireStats: async () => {
    const response = await api.get('/prestataire/dashboard/stats');
    return response.data;
  },
};

export default dashboardService;
