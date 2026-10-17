import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import AffectationForm from '../../components/affectation/AffectationForm';
import AutocompleteField from '../../components/ui/AutocompleteField';
import { affectationService } from '../../services/affectationService';
import { prestataireService } from '../../services/prestataireService';
import tacheService from '../../services/tacheService';

/**
 * Page d'administration – Gestion des Affectations.
 * Reprend la même structure que les pages Prestataires et Tâches.
 */
const AdminAffectations = () => {
  // Données
  const [affectations, setAffectations] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [taches, setTaches] = useState([]);
  /** Tâches du catalogue (créées par des administrateurs) — alimentent la modal Nouvelle Affectation */
  const [catalogueTaches, setCatalogueTaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recherche / filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [prestataireFilter, setPrestataireFilter] = useState(null);
  const [tacheFilter, setTacheFilter] = useState(null);

  // Pagination (client-side) — même valeur que Prestataires et Tâches
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal (ajout)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Toasts
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // ---------------------------------------------------------------------------
  // Chargement initial
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [affectData, prestaData, tacheData, catalogueData] = await Promise.all([
        affectationService.getAll(),
        prestataireService.getAllPrestataires(),
        tacheService.getAll(),
        tacheService.getCatalogue(),
      ]);
      setAffectations(affectData);
      setPrestataires(prestaData);
      setTaches(tacheData);
      setCatalogueTaches(catalogueData);
    } catch (err) {
      console.error('Erreur chargement affectations :', err);
      showToast('Impossible de charger les affectations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // ---------------------------------------------------------------------------
  // Création d'une affectation
  // ---------------------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      const result = await affectationService.create(formData);
      const { successCount, failureCount, failures } = result;

      if (successCount > 0) {
        await fetchAll();
      }

      if (failureCount === 0) {
        showToast(`${successCount} affectation(s) créée(s) avec succès !`);
        setIsModalOpen(false);
      } else if (successCount > 0) {
        // Succès partiel
        const errorDetails = failures.map(f => {
          const task = catalogueTaches.find(t => t.id === f.tacheId);
          return `${task ? task.nom : f.tacheId} (${f.error})`;
        }).join(', ');
        showToast(`${successCount} affectation(s) réussie(s). Échec(s) : ${errorDetails}`, 'warning');
        setIsModalOpen(false);
      } else {
        // Échec total
        const errorDetails = failures.map(f => {
          const task = catalogueTaches.find(t => t.id === f.tacheId);
          return `${task ? task.nom : f.tacheId} (${f.error})`;
        }).join(', ');
        showToast(`Échec des affectations : ${errorDetails}`, 'error');
      }
    } catch (err) {
      console.error('Erreur création affectation :', err);
      const msg = err.response?.data?.erreur || err.response?.data?.message || 'Une erreur est survenue.';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Suppression d'une affectation
  // ---------------------------------------------------------------------------
  const handleDelete = async (id) => {
    try {
      await affectationService.remove(id);
      setAffectations(affectations.filter((a) => a.id !== id));
      showToast('Affectation supprimée avec succès.');
    } catch (err) {
      console.error('Erreur suppression affectation :', err);
      const msg = err.response?.data?.message || 'Impossible de supprimer l\'affectation.';
      showToast(msg, 'error');
    }
  };

  // Options pour les autocompletes (filtres actifs uniquement, identique au formulaire de création)
  const prestataireOptions = useMemo(() => {
    return prestataires
      .filter((p) => p.actif)
      .map((p) => ({
        id: String(p.id),
        label: p.nomComplet || `${p.prenom} ${p.nom}`,
      }));
  }, [prestataires]);

  const tacheOptions = useMemo(() => {
    return taches
      .filter((t) => t.actif)
      .map((t) => ({
        id: String(t.id),
        label: t.nom,
      }));
  }, [taches]);

  // ---------------------------------------------------------------------------
  // Filtrage & recherche (client-side)
  // ---------------------------------------------------------------------------
  const filteredAffectations = useMemo(() => {
    return affectations.filter((a) => {
      if (prestataireFilter && String(a.prestataireId) !== String(prestataireFilter)) return false;
      if (tacheFilter && String(a.tacheId) !== String(tacheFilter)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches =
          (a.prestataireNomComplet && a.prestataireNomComplet.toLowerCase().includes(term)) ||
          (a.tacheNom && a.tacheNom.toLowerCase().includes(term));
        if (!matches) return false;
      }
      return true;
    });
  }, [affectations, searchTerm, prestataireFilter, tacheFilter]);

  const totalPages = Math.ceil(filteredAffectations.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAffectations.slice(start, start + itemsPerPage);
  }, [filteredAffectations, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'NON_DEMARREE':
        return <span className="badge-neutral">Non démarrée</span>;
      case 'EN_COURS':
        return <span className="badge-warning">En cours</span>;
      case 'TERMINEE':
        return <span className="badge-success">Terminée</span>;
      default:
        return <span className="badge-neutral">{status || 'Non démarrée'}</span>;
    }
  };


  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <DashboardLayout
      title="Gestion des Affectations"
      subtitle="Associez des prestataires à des tâches."
      actions={
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle affectation
        </button>
      }
    >
      {/* Recherche & filtres */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6 flex flex-col md:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher par prestataire ou tâche…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-11"
          />
        </div>

        {/* Filtre Prestataire */}
        <div className="w-full md:w-56">
          <AutocompleteField
            id="filter-prestataire"
            options={prestataireOptions}
            value={prestataireFilter}
            onChange={setPrestataireFilter}
            placeholder="Tous les prestataires"
          />
        </div>

        {/* Filtre Tâche */}
        <div className="w-full md:w-56">
          <AutocompleteField
            id="filter-tache"
            options={tacheOptions}
            value={tacheFilter}
            onChange={setTacheFilter}
            placeholder="Toutes les tâches"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b62ad]" />
          </div>
        ) : filteredAffectations.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">Aucune affectation trouvée</h3>
            <p className="text-slate-500">Essayez d'ajuster vos critères de recherche.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header-row">
                    <th className="px-6 py-4">Prestataire</th>
                    <th className="px-6 py-4">Tâche</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Date d'affectation</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {currentItems.map((affectation) => (
                    <tr key={affectation.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Prestataire */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-blue-50 text-[#3b62ad] flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                            {affectation.prestataireNomComplet
                              ? affectation.prestataireNomComplet.split(' ').map((n) => n.charAt(0)).slice(0, 2).join('')
                              : '?'}
                          </div>
                          <span className="font-semibold text-slate-800 text-[14px]">
                            {affectation.prestataireNomComplet || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Tâche */}
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          {affectation.tacheNom || '—'}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        {getStatusBadge(affectation.statut)}
                      </td>

                      {/* Date d'affectation — on utilise createdAt (identique à dateAffectation) */}
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-slate-600">
                          {affectation.createdAt
                            ? new Date(affectation.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(affectation.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Supprimer l'affectation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
                  {Math.min(currentPage * itemsPerPage, filteredAffectations.length)} sur{' '}
                  {filteredAffectations.length} affectations
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

      {/* Modal création */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle affectation"
      >
        <AffectationForm
          prestataires={prestataires}
          taches={catalogueTaches}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </DashboardLayout>
  );
};

export default AdminAffectations;
