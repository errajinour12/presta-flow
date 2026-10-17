import React, { useState, useEffect, useMemo } from 'react';
import { prestataireService } from '../../services/prestataireService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import PrestataireForm from '../../components/prestataire/PrestataireForm';

// Helper for date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const AdminPrestataires = () => {
  const [prestataires, setPrestataires] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIF', 'INACTIF'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD'); // 'ADD' or 'EDIT'
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'success' });

  useEffect(() => {
    fetchPrestataires();
  }, []);

  const fetchPrestataires = async () => {
    try {
      setLoading(true);
      const data = await prestataireService.getAllPrestataires();
      setPrestataires(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des prestataires:", err);
      showToast("Impossible de charger les prestataires.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const openAddModal = () => {
    setModalMode('ADD');
    setSelectedPrestataire(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prestataire) => {
    setModalMode('EDIT');
    setSelectedPrestataire(prestataire);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      setActionLoading(true);
      if (modalMode === 'ADD') {
        const newPresta = await prestataireService.createPrestataire(formData);
        setPrestataires([newPresta, ...prestataires]);
        showToast("Prestataire ajouté avec succès !");
      } else {
        const updatedPresta = await prestataireService.updatePrestataire(selectedPrestataire.id, formData);
        setPrestataires(prestataires.map(p => p.id === updatedPresta.id ? updatedPresta : p));
        showToast("Prestataire mis à jour avec succès !");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
      // Extraire le message d'erreur si disponible dans la réponse backend
      const errMsg = err.response?.data?.message || "Une erreur est survenue.";
      showToast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatut = async (id) => {
    try {
      const updatedPresta = await prestataireService.toggleStatut(id);
      setPrestataires(prestataires.map(p => p.id === updatedPresta.id ? updatedPresta : p));
      showToast(`Le statut du prestataire a été ${updatedPresta.actif ? 'activé' : 'désactivé'}.`);
    } catch (err) {
      console.error("Erreur statut:", err);
      const errMsg = err.response?.data?.message || err.message || "Impossible de modifier le statut.";
      showToast(errMsg, "error");
    }
  };

  // Filtrage
  const filteredPrestataires = useMemo(() => {
    return prestataires.filter(p => {
      // Filtre statut
      if (statusFilter === 'ACTIF' && !p.actif) return false;
      if (statusFilter === 'INACTIF' && p.actif) return false;

      // Filtre recherche
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${p.prenom} ${p.nom}`.toLowerCase();
        const dateFormatted = formatDate(p.dateEmbauche).toLowerCase();
        return (
          fullName.includes(term) ||
          (p.email && p.email.toLowerCase().includes(term)) ||
          (p.matricule && p.matricule.toLowerCase().includes(term)) ||
          dateFormatted.includes(term)
        );
      }

      return true;
    });
  }, [prestataires, searchTerm, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPrestataires.length / itemsPerPage) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPrestataires.slice(start, start + itemsPerPage);
  }, [filteredPrestataires, currentPage, itemsPerPage]);

  // Handle page out of bounds when filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <DashboardLayout
      title="Gestion des Prestataires"
      subtitle="Gérez la liste de vos prestataires, leurs statuts et informations."
      actions={
        <button
          onClick={openAddModal}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Nouveau Prestataire
        </button>
      }
    >
      {/* Barre de recherche et filtres */}
      <div className="bg-white p-4 rounded-2xl shadow-[4px_0_24px_rgb(0,0,0,0.02)] border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom, email, matricule, date d'embauche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-11 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 transition-all text-slate-700"
          />
        </div>
        <div className="w-full md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 transition-all text-slate-700 appearance-none cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="INACTIF">Inactifs</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[4px_0_24px_rgb(0,0,0,0.02)] border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b62ad]"></div>
          </div>
        ) : filteredPrestataires.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-1">Aucun prestataire trouvé</h3>
            <p className="text-slate-500">Essayez de modifier vos critères de recherche.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[12px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="px-6 py-4">Prestataire</th>
                    <th className="px-6 py-4">Matricule</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Date d'embauche</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentItems.map((prestataire) => (
                    <tr key={prestataire.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-blue-50 text-[#3b62ad] flex items-center justify-center font-bold text-sm mr-3">
                            {prestataire.prenom?.charAt(0)}{prestataire.nom?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-[14px]">
                              {prestataire.prenom} {prestataire.nom}
                            </div>
                            <div className="text-slate-500 text-[13px]">{prestataire.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-medium text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded-md">
                          {prestataire.matricule}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium ${
                          prestataire.actif
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {prestataire.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[14px] text-slate-600">
                          {formatDate(prestataire.dateEmbauche) || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(prestataire)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-[#3b62ad] hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatut(prestataire.id)}
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                            prestataire.actif
                              ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={prestataire.actif ? "Désactiver" : "Activer"}
                        >
                          {prestataire.actif ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 mt-auto">
                <span className="text-[13px] text-slate-500 font-medium">
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredPrestataires.length)} sur {filteredPrestataires.length} prestataires
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <div className="flex items-center px-3 text-[13px] font-medium text-slate-600">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'ADD' ? 'Ajouter un Prestataire' : 'Modifier le Prestataire'}
      >
        <PrestataireForm
          initialData={selectedPrestataire}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          loading={actionLoading}
        />
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </DashboardLayout>
  );
};

export default AdminPrestataires;
