import React, { useState, useEffect, useMemo } from 'react';
import PrestataireDashboardLayout from '../../components/layout/PrestataireDashboardLayout';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import TaskForm from '../../components/tache/TaskForm';
import prestataireTacheService from '../../services/prestataireTacheService';

const MesTaches = () => {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal & Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchTaches();
  }, []);

  const fetchTaches = async () => {
    try {
      setLoading(true);
      const data = await prestataireTacheService.getMesTaches();
      // Tri par date d'affectation descendante par défaut
      setTaches(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Erreur lors du chargement des tâches :', err);
      showToast('Impossible de charger vos tâches.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCreateTask = async (formData) => {
    try {
      setActionLoading(true);
      await prestataireTacheService.creerTache(formData);
      showToast('Tâche personnelle créée et affectée avec succès !');
      setIsModalOpen(false);
      // Recharger la liste des tâches
      fetchTaches();
    } catch (err) {
      console.error('Erreur de création de la tâche :', err);
      const msg = err.response?.data?.erreur || err.response?.data?.message || 'Une erreur est survenue lors de la création.';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemarrer = async (id) => {
    try {
      await prestataireTacheService.demarrerTache(id);
      showToast('Tâche démarrée ! Bon travail.');
      fetchTaches();
    } catch (err) {
      console.error('Erreur lors du démarrage de la tâche :', err);
      const msg = err.response?.data?.message || 'Impossible de démarrer la tâche.';
      showToast(msg, 'error');
    }
  };

  const handleTerminer = async (id) => {
    try {
      await prestataireTacheService.terminerTache(id);
      showToast('Tâche terminée avec succès !');
      fetchTaches();
    } catch (err) {
      console.error('Erreur lors de la finalisation de la tâche :', err);
      const msg = err.response?.data?.message || 'Impossible de terminer la tâche.';
      showToast(msg, 'error');
    }
  };

  // Filtrage
  const filteredTaches = useMemo(() => {
    return taches.filter((t) => {
      // Filtre de statut
      if (statusFilter !== 'ALL' && t.statut !== statusFilter) return false;
      // Filtre de recherche par nom
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!t.tacheNom?.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [taches, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTaches.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTaches.slice(start, start + itemsPerPage);
  }, [filteredTaches, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NON_DEMARREE':
        return <span className="badge-neutral">Non démarrée</span>;
      case 'EN_COURS':
        return <span className="badge-warning">En cours</span>;
      case 'TERMINEE':
        return <span className="badge-success">Terminée</span>;
      default:
        return <span className="badge-neutral">{status}</span>;
    }
  };


  return (
    <PrestataireDashboardLayout
      title="Mes Tâches"
      subtitle="Consultez, démarrez et terminez les tâches qui vous sont affectées."
      actions={
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle tâche personnelle
        </button>
      }
    >
      {/* Recherche & Filtres */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6 flex flex-col md:flex-row gap-4 animate-fade-in">
        {/* Recherche par nom */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom de tâche…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-11"
          />
        </div>

        {/* Dropdown de statut */}
        <div className="w-full md:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="NON_DEMARREE">Non démarrée</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminée</option>
          </select>
        </div>
      </div>

      {/* Tableau des tâches */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col min-h-[400px] animate-fade-in">
        {loading ? (
          <div className="flex-1 flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b62ad]" />
          </div>
        ) : filteredTaches.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">Aucune tâche trouvée</h3>
            <p className="text-slate-500">Essayez d'ajuster vos critères de recherche ou de créer une tâche personnelle.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header-row">
                    <th className="px-6 py-4">Tâche</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Date d'affectation</th>
                    <th className="px-6 py-4">Date de début</th>
                    <th className="px-6 py-4">Date de fin</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="table-data-row">
                      {/* Tâche */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 text-[14px]">
                          {item.tacheNom || '—'}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        {getStatusBadge(item.statut)}
                      </td>

                      {/* Date d'affectation */}
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-slate-600">
                          {formatDate(item.createdAt)}
                        </span>
                      </td>

                      {/* Date de début */}
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-slate-600">
                          {formatDate(item.dateDebut)}
                        </span>
                      </td>

                      {/* Date de fin */}
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-slate-600">
                          {formatDate(item.dateFin)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-full min-h-[32px]">
                          {item.statut === 'NON_DEMARREE' && (
                            <button
                              onClick={() => handleDemarrer(item.id)}
                              className="btn-primary text-xs font-semibold w-[100px] h-[32px] flex items-center justify-center rounded-lg"
                            >
                              Démarrer
                            </button>
                          )}
                          {item.statut === 'EN_COURS' && (
                            <button
                              onClick={() => handleTerminer(item.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold w-[100px] h-[32px] flex items-center justify-center rounded-lg shadow-sm transition-all"
                            >
                              Terminer
                            </button>
                          )}
                          {item.statut === 'TERMINEE' && (
                            <span className="text-xs font-medium text-slate-400 w-[100px] text-center flex items-center justify-center h-[32px]">Aucune action</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 mt-auto">
                <span className="text-[13px] text-slate-500 font-medium">
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à{' '}
                  {Math.min(currentPage * itemsPerPage, filteredTaches.length)} sur{' '}
                  {filteredTaches.length} tâches
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center px-3 text-[13px] font-medium text-slate-600">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de création de tâche personnelle */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle tâche personnelle"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setIsModalOpen(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Notifications Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </PrestataireDashboardLayout>
  );
};

export default MesTaches;
