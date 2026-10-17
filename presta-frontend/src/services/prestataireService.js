import api from './api';

export const prestataireService = {
  /**
   * Récupère la liste de tous les prestataires
   * @returns {Promise<Array>} Liste des prestataires
   */
  getAllPrestataires: async () => {
    const response = await api.get('/prestataires');
    return response.data;
  },

  /**
   * Crée un nouveau prestataire
   * @param {Object} data Données du prestataire
   * @returns {Promise<Object>} Le prestataire créé
   */
  createPrestataire: async (data) => {
    const response = await api.post('/prestataires', data);
    return response.data;
  },

  /**
   * Met à jour un prestataire existant
   * @param {number} id L'ID du prestataire
   * @param {Object} data Les nouvelles données
   * @returns {Promise<Object>} Le prestataire mis à jour
   */
  updatePrestataire: async (id, data) => {
    const response = await api.put(`/prestataires/${id}`, data);
    return response.data;
  },

  /**
   * Active ou désactive un prestataire
   * @param {number} id L'ID du prestataire
   * @returns {Promise<Object>} Le prestataire avec son nouveau statut
   */
  toggleStatut: async (id) => {
    const response = await api.patch(`/prestataires/${id}/statut`);
    return response.data;
  }
};
