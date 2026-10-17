import api from './api';

const adminAttendanceService = {
  /**
   * Récupère la liste de toutes les soumissions de pointage en attente (EN_ATTENTE).
   * @returns {Promise<Array>} Liste de PendingSubmissionResponse
   */
  getPendingSubmissions: async () => {
    const response = await api.get('/admin/attendance/pending');
    return response.data;
  },

  getProcessedSubmissions: async () => {
    const response = await api.get('/admin/attendance/history');
    return response.data;
  },

  /**
   * Récupère les détails d'une soumission (synthèse quotidienne BRUT vs CORRIGEE).
   * @param {number} imageId
   * @returns {Promise<Array>} Liste de DailyAttendanceSummaryResponse
   */
  getSubmissionDetails: async (imageId) => {
    const response = await api.get(`/admin/attendance/${imageId}/details`);
    return response.data;
  },

  /**
   * Valide un pointage individuel pour une journée donnée (EN_ATTENTE -> VALIDE).
   * @param {number} pointageId
   * @returns {Promise<Object>} PointageResponse
   */
  validatePointage: async (pointageId) => {
    const response = await api.post(`/admin/attendance/pointages/${pointageId}/validate`);
    return response.data;
  },

  /**
   * Rejette un pointage individuel pour une journée donnée avec motif obligatoire (EN_ATTENTE -> REJETE).
   * @param {number} pointageId
   * @param {string} motifRejet
   * @returns {Promise<Object>} PointageResponse
   */
  rejectPointage: async (pointageId, motifRejet) => {
    const response = await api.post(`/admin/attendance/pointages/${pointageId}/reject`, { motifRejet });
    return response.data;
  },

  /**
   * Récupère le contenu binaire (blob) de l'image originale d'un pointage (côté admin).
   * Utilisé pour l'aperçu dans un modal (jamais pour un téléchargement).
   * @param {number} imageId
   * @returns {Promise<Blob>} Le blob de l'image
   */
  getImageContent: async (imageId) => {
    const response = await api.get(`/admin/images-pointage/${imageId}/content`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default adminAttendanceService;
