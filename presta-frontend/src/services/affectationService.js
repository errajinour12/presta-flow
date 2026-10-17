import api from './api';

export const affectationService = {
  /** Récupère la liste de toutes les affectations */
  getAll: async () => {
    const response = await api.get('/affectations');
    return response.data;
  },

  /** Crée une nouvelle affectation */
  create: async (data) => {
    const response = await api.post('/affectations', data);
    return response.data;
  },

  /** Supprime une affectation par son ID */
  remove: async (id) => {
    await api.delete('/affectations/' + id);
  },
};
