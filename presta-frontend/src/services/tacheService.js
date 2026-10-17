import api from './api';

const tacheService = {
  /** Récupère la liste de toutes les tâches */
  getAll: async () => {
    const response = await api.get('/taches');
    return response.data;
  },

  /** Crée une nouvelle tâche */
  create: async (data) => {
    const response = await api.post('/taches', data);
    return response.data;
  },

  /** Met à jour une tâche existante */
  update: async (id, data) => {
    const response = await api.put(`/taches/${id}`, data);
    return response.data;
  },

  /** Bascule le statut actif/inactif d'une tâche */
  toggleStatut: async (id) => {
    const response = await api.patch(`/taches/${id}/statut`);
    return response.data;
  },

  /** Récupère une tâche par son ID */
  getById: async (id) => {
    const response = await api.get(`/taches/${id}`);
    return response.data;
  },

  /**
   * Récupère uniquement les tâches créées par des administrateurs.
   * Utilisé par la modal "Nouvelle Affectation" pour n'afficher que le catalogue commun.
   */
  getCatalogue: async () => {
    const response = await api.get('/taches/catalogue');
    return response.data;
  },
};

export default tacheService;
