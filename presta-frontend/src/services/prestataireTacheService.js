import api from './api';

const prestataireTacheService = {
  /** Récupère la liste des tâches affectées au prestataire connecté */
  getMesTaches: async () => {
    const response = await api.get('/prestataire/taches');
    return response.data;
  },

  /** Crée une nouvelle tâche personnelle (qui lui sera automatiquement affectée) */
  creerTache: async (data) => {
    const response = await api.post('/prestataire/taches', data);
    return response.data;
  },

  /** Démarre une tâche affectée (passe le statut à EN_COURS) */
  demarrerTache: async (id) => {
    const response = await api.patch(`/prestataire/taches/${id}/demarrer`);
    return response.data;
  },

  /** Termine une tâche affectée (passe le statut à TERMINEE) */
  terminerTache: async (id) => {
    const response = await api.patch(`/prestataire/taches/${id}/terminer`);
    return response.data;
  }
};

export default prestataireTacheService;
