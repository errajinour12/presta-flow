import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import TaskForm from '../../components/tache/TaskForm';
import TaskTable from '../../components/tache/TaskTable';
import tacheService from '../../services/tacheService';
import { CATEGORY_LABELS } from '../../utils/constants';

/**
 * Page d'administration – Gestion des Tâches.
 * Reprend la même structure que la page Gestion des Prestataires.
 */
const AdminTaches = () => {
  // Liste des tâches
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recherche / filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIF | INACTIF
  const [origineFilter, setOrigineFilter] = useState('ALL'); // ALL | CATALOGUE | PERSONNELLE

  // Pagination (client‑side)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal (ajout / édition)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // ADD | EDIT
  const [selectedTache, setSelectedTache] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toasts
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // ---------------------------------------------------------------------------
  // Chargement initial
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchTaches();
  }, []);

  const fetchTaches = async () => {
    try {
      setLoading(true);
      const data = await tacheService.getAll();
      setTaches(data);
    } catch (err) {
      console.error('Erreur chargement tâches :', err);
      showToast('Impossible de charger les tâches.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // ---------------------------------------------------------------------------
  // Ouverture/fermeture du modal
  // ---------------------------------------------------------------------------
  const openAddModal = () => {
    setModalMode('ADD');
    setSelectedTache(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tache) => {
    setModalMode('EDIT');
    setSelectedTache(tache);
    setIsModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Soumission du formulaire
  // ---------------------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      if (modalMode === 'ADD') {
        const created = await tacheService.create(formData);
        setTaches([created, ...taches]);
        showToast('Tâche créée avec succès !');
      } else {
        const updated = await tacheService.update(selectedTache.id, formData);
        setTaches(taches.map(t => (t.id === updated.id ? updated : t)));
        showToast('Tâche mise à jour avec succès !');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur sauvegarde tâche :', err);
      const msg = err.response?.data?.message || 'Une erreur est survenue.';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Activation / désactivation d'une tâche
  // ---------------------------------------------------------------------------
  const handleToggleStatut = async (id) => {
    try {
      const updated = await tacheService.toggleStatut(id);
      setTaches(taches.map(t => (t.id === updated.id ? updated : t)));
      showToast('Statut de la tâche mis à jour.');
    } catch (err) {
      console.error('Erreur toggle statut :', err);
      const msg = err.response?.data?.message || 'Impossible de modifier le statut.';
      showToast(msg, 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Filtrage & recherche (client‑side)
  // ---------------------------------------------------------------------------
  const filteredTaches = useMemo(() => {
    return taches.filter(t => {
      if (statusFilter === 'ACTIF' && !t.actif) return false;
      if (statusFilter === 'INACTIF' && t.actif) return false;

      if (origineFilter === 'CATALOGUE' && t.createdByRole !== 'ADMIN') return false;
      if (origineFilter === 'PERSONNELLE' && t.createdByRole !== 'PRESTATAIRE') return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const categoryLabel = CATEGORY_LABELS[t.categorie] || t.categorie || '';
        const matches =
          (t.nom && t.nom.toLowerCase().includes(term)) ||
          (t.description && t.description.toLowerCase().includes(term)) ||
          (categoryLabel.toLowerCase().includes(term));
        if (!matches) return false;
      }
      return true;
    });
  }, [taches, searchTerm, statusFilter, origineFilter]);

  const totalPages = Math.ceil(filteredTaches.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTaches.slice(start, start + itemsPerPage);
  }, [filteredTaches, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  return (
    <DashboardLayout
      title="Gestion des Tâches"
      subtitle="Administrez le catalogue de tâches."
      actions={
        <button
          onClick={openAddModal}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
          Nouvelle Tâche
        </button>
      }
    >
      {/* Recherche & filtres */}
      <div className="bg-white p-4 rounded-2xl shadow-[4px_0_24px_rgb(0,0,0,0.02)] border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 transition-all text-slate-700 placeholder:text-slate-400 font-medium"
          />
        </div>
        <div className="w-full md:w-48">
          <select
            value={origineFilter}
            onChange={e => setOrigineFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 transition-all text-slate-700 appearance-none cursor-pointer"
          >
            <option value="ALL">Toutes les origines</option>
            <option value="CATALOGUE">Catalogue</option>
            <option value="PERSONNELLE">Personnelles</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 transition-all text-slate-700 appearance-none cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="INACTIF">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-[4px_0_24px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex justify-center items-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b62ad]"/></div>
        ) : filteredTaches.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">Aucune tâche trouvée</h3>
            <p className="text-slate-500">Essayez d'ajuster vos critères de recherche.</p>
          </div>
        ) : (
          <>
            <TaskTable tasks={currentItems} onEdit={openEditModal} onToggleStatut={handleToggleStatut} />
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 mt-auto">
                <span className="text-[13px] text-slate-500 font-medium">
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredTaches.length)} sur {filteredTaches.length} tâches
                </span>
                <div className="flex space-x-1">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="flex items-center px-3 text-[13px] font-medium text-slate-600">Page {currentPage} sur {totalPages}</div>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal formulaire */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'ADD' ? 'Créer une tâche' : 'Modifier la tâche'}>
        <TaskForm initialData={selectedTache} onSubmit={handleFormSubmit} onCancel={() => setIsModalOpen(false)} loading={actionLoading} />
      </Modal>

      {/* Toast notifications */}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </DashboardLayout>
  );
};

export default AdminTaches;
