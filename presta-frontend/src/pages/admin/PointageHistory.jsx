import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Toast from '../../components/ui/Toast';
import adminAttendanceService from '../../services/adminAttendanceService';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'N/A';
  return new Date(dateTimeStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusGlobalBadge = (statut) => {
  switch (statut) {
    case 'VALIDE':
      return <span className="badge-success">VALIDÉ</span>;
    case 'REJETE':
      return <span className="badge-error">REJETÉ</span>;
    case 'PARTIEL':
      return <span className="badge-warning">PARTIEL</span>;
    default:
      return <span className="badge-neutral">{statut || 'TRAITÉ'}</span>;
  }
};


const PointageHistory = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPrestataire, setSelectedPrestataire] = useState('ALL');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchProcessedSubmissions();
  }, []);

  const fetchProcessedSubmissions = async () => {
    try {
      setLoading(true);
      const data = await adminAttendanceService.getProcessedSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Erreur chargement historique pointages :', err);
      showToast('Impossible de charger l\'historique des pointages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Distinct prestataires list for filter dropdown
  const prestatairesList = useMemo(() => {
    const map = new Map();
    submissions.forEach((sub) => {
      if (sub.prestataireId && !map.has(sub.prestataireId)) {
        map.set(sub.prestataireId, sub.prestataireNomComplet || `Prestataire #${sub.prestataireId}`);
      }
    });
    return Array.from(map.entries()).map(([id, nom]) => ({ id, nom }));
  }, [submissions]);

  // Overall Statistics KPI
  const stats = useMemo(() => {
    let totalValides = 0;
    let totalRejetes = 0;
    let totalPartiels = 0;

    submissions.forEach((sub) => {
      if (sub.statutGlobal === 'VALIDE') totalValides++;
      else if (sub.statutGlobal === 'REJETE') totalRejetes++;
      else if (sub.statutGlobal === 'PARTIEL') totalPartiels++;
    });

    return {
      total: submissions.length,
      totalValides,
      totalRejetes,
      totalPartiels,
    };
  }, [submissions]);

  // Filtered submissions based on search term, status, and prestataire
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Search term
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = sub.prestataireNomComplet?.toLowerCase().includes(searchLower);
      const matMatch = sub.prestataireMatricule?.toLowerCase().includes(searchLower);
      const imgMatch = sub.nomOriginal?.toLowerCase().includes(searchLower);
      const adminMatch = sub.traiteParAdminNom?.toLowerCase().includes(searchLower);
      const matchesSearch = !searchTerm || nameMatch || matMatch || imgMatch || adminMatch;

      // Status filter
      const matchesStatus = selectedStatus === 'ALL' || sub.statutGlobal === selectedStatus;

      // Prestataire filter
      const matchesPrestataire =
        selectedPrestataire === 'ALL' || String(sub.prestataireId) === String(selectedPrestataire);

      return matchesSearch && matchesStatus && matchesPrestataire;
    });
  }, [submissions, searchTerm, selectedStatus, selectedPrestataire]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage) || 1;
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(start, start + itemsPerPage);
  }, [filteredSubmissions, currentPage]);

  const handleConsulter = (imageId) => {
    navigate(`/admin/pointages/${imageId}`, { state: { fromHistory: true } });
  };

  return (
    <DashboardLayout
      title="Historique des Pointages"
      badge={
        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
          {submissions.length} soumission(s) traitée(s)
        </span>
      }
      subtitle="Consultez l'historique complet des fiches de pointage soumises et traitées."
    >
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8 pb-12">

        {/* KPI Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card-container p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3b62ad] flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Traités</p>
              <p className="text-lg font-bold text-slate-800">{stats.total} fiches</p>
            </div>
          </div>

          <div className="card-container p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Validées</p>
              <p className="text-lg font-bold text-emerald-700">{stats.totalValides} fiche(s)</p>
            </div>
          </div>

          <div className="card-container p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Partielles</p>
              <p className="text-lg font-bold text-amber-700">{stats.totalPartiels} fiche(s)</p>
            </div>
          </div>

          <div className="card-container p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Rejetées</p>
              <p className="text-lg font-bold text-red-700">{stats.totalRejetes} fiche(s)</p>
            </div>
          </div>
        </div>

        {/* Search bar & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Rechercher par prestataire, matricule, fichier..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="select-field w-auto"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="VALIDE">Validé</option>
              <option value="PARTIEL">Partiel</option>
              <option value="REJETE">Rejeté</option>
            </select>

            {/* Prestataire Filter */}
            {prestatairesList.length > 0 && (
              <select
                value={selectedPrestataire}
                onChange={(e) => {
                  setSelectedPrestataire(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-field w-auto max-w-xs truncate"
              >
                <option value="ALL">Tous les prestataires</option>
                {prestatairesList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={fetchProcessedSubmissions}
            className="btn-secondary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span>Actualiser</span>
          </button>
        </div>


        {/* Table / Loading / Empty state */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#3b62ad] border-t-transparent mb-3"></div>
              <p className="text-slate-500 text-sm">Chargement de l'historique des pointages...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800">Aucun pointage trouvé</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
                {searchTerm || selectedStatus !== 'ALL' || selectedPrestataire !== 'ALL'
                  ? "Aucun résultat ne correspond à vos critères de recherche."
                  : "Aucune soumission de pointage n'a encore été traitée."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header-row">
                    <th className="px-6 py-4">Prestataire</th>
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Période</th>
                    <th className="px-6 py-4">Importé le</th>
                    <th className="px-6 py-4">Traité le</th>
                    <th className="px-6 py-4">Traité par</th>
                    <th className="px-6 py-4 text-center">Statut global</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {paginatedSubmissions.map((sub) => (
                    <tr key={sub.imageId} className="table-data-row">
                      {/* Prestataire */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#3b62ad] font-bold flex items-center justify-center text-sm">
                            {sub.prestataireNomComplet ? sub.prestataireNomComplet.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">
                              {sub.prestataireNomComplet || 'Inconnu'}
                            </div>
                            <span className="inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                              {sub.prestataireMatricule || 'Sans matricule'}
                            </span>
                          </div>
                        </div>
                      </td>


                      {/* Document */}
                      <td className="px-6 py-4 font-medium text-slate-700">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="truncate max-w-xs">{sub.nomOriginal || 'Image de pointage'}</span>
                        </div>
                      </td>

                      {/* Période */}
                      <td className="px-6 py-4 text-slate-600">
                        <div className="text-xs font-semibold text-slate-700">
                          {formatDate(sub.dateDebut)} → {formatDate(sub.dateFin)}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {sub.nombreJours} jour(s)
                        </span>
                      </td>

                      {/* Importé le */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDateTime(sub.dateImport)}
                      </td>

                      {/* Traité le */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {formatDateTime(sub.dateTraitement)}
                      </td>

                      {/* Traité par */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {sub.traiteParAdminNom ? (
                          <span className="inline-flex items-center space-x-1">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>{sub.traiteParAdminNom}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Non spécifié</span>
                        )}
                      </td>

                      {/* Statut Global */}
                      <td className="px-6 py-4 text-center">
                        {statusGlobalBadge(sub.statutGlobal)}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleConsulter(sub.imageId)}
                          className="btn-secondary text-xs !py-1.5 !px-3.5"
                        >
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Consulter</span>
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
              <div>
                Page <span className="font-semibold text-slate-700">{currentPage}</span> sur{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span> ({filteredSubmissions.length} éléments)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PointageHistory;
