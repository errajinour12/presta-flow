import api from './api';

const rapportService = {
  /**
   * Génère le rapport PDF de pointage pour la période sélectionnée.
   * @param {{ startDate: string, endDate: string }} payload - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
   * @returns {Promise<Blob>} Le fichier PDF sous forme de Blob
   */
  generateReport: async (payload) => {
    const response = await api.post('/prestataire/rapports/generate', payload, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Récupère la liste de tous les rapports générés par le prestataire connecté.
   * @returns {Promise<Array>} Liste des rapports
   */
  getMesRapports: async () => {
    const response = await api.get('/prestataire/rapports');
    return response.data;
  },

  /**
   * Télécharge la version PDF d'un rapport existant sous forme de Blob.
   * @param {number|string} id - L'identifiant du rapport
   * @returns {Promise<Blob>} Le fichier PDF sous forme de Blob
   */
  downloadReport: async (id) => {
    const response = await api.get(`/prestataire/rapports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Récupère la liste de tous les rapports générés pour tous les prestataires (Admin).
   * @returns {Promise<Array>} Liste de tous les rapports
   */
  getAllRapportsForAdmin: async () => {
    const response = await api.get('/admin/rapports');
    return response.data;
  },

  /**
   * Télécharge la version PDF d'un rapport existant sous forme de Blob (Admin).
   * @param {number|string} id - L'identifiant du rapport
   * @returns {Promise<Blob>} Le fichier PDF sous forme de Blob
   */
  downloadReportForAdmin: async (id) => {
    const response = await api.get(`/admin/rapports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default rapportService;
