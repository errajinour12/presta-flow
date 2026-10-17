import api from './api';

const imagePointageService = {
  /**
   * Téléverse une image de pointage et récupère les données d'extraction Gemini.
   * @param {File} file - Le fichier image à téléverser
   * @returns {Promise<Object>} ImageUploadWithExtractionResponse { image: { id, ... }, extraction: { ... } }
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/prestataire/images-pointage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Récupère l'historique des images téléversées par le prestataire connecté.
   * @returns {Promise<Array>} Liste de ImagePointageResponse
   */
  getMesImages: async () => {
    const response = await api.get('/prestataire/images-pointage');
    return response.data;
  },

  /**
   * Récupère la liste DailyAttendanceSummaryResponse pour une image donnée.
   * Chaque entrée contient brutPointage et, le cas échéant, corrigeePointage.
   * @param {number} imageId
   * @returns {Promise<Array>} DailyAttendanceSummaryResponse[]
   */
  getPointagesByImage: async (imageId) => {
    const response = await api.get(`/prestataire/images-pointage/${imageId}/pointages`);
    return response.data;
  },

  /**
   * Crée ou met à jour un pointage CORRIGEE (brouillon) pour un jour donné.
   * @param {{ brutPointageId: number, dayType: string, creneaux: Array<{ heureEntree: string, heureSortie: string, ordre: number }> }} payload
   * @returns {Promise<Object>} PointageResponse de la CORRIGEE sauvegardée
   */
  saveCorrection: async (payload) => {
    const response = await api.post('/prestataire/pointages/corrections', payload);
    return response.data;
  },

  /**
   * Soumet définitivement tous les pointages d'une image (passe le statut à EN_ATTENTE).
   * @param {number} imageId
   * @returns {Promise<Array>} PointageResponse[] des pointages soumis
   */
  soumettre: async (imageId) => {
    const response = await api.post(`/prestataire/images-pointage/${imageId}/soumettre`);
    return response.data;
  },

  /**
   * Resoumet un pointage (CORRIGEE) rejeté spécifiquement.
   * @param {number} pointageId
   * @returns {Promise<Object>} PointageResponse du pointage resoumis
   */
  resubmitPointage: async (pointageId) => {
    const response = await api.post(`/prestataire/pointages/${pointageId}/resoumettre`);
    return response.data;
  },

  /**
   * Récupère le contenu binaire (blob) de l'image originale d'un pointage.
   * Utilisé pour l'aperçu dans un modal (jamais pour un téléchargement).
   * @param {number} imageId
   * @returns {Promise<Blob>} Le blob de l'image
   */
  getImageContent: async (imageId) => {
    const response = await api.get(`/prestataire/images-pointage/${imageId}/content`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default imagePointageService;
