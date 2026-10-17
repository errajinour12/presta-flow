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

const AdminPointages = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      const data = await adminAttendanceService.getPendingSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Erreur chargement soumissions :', err);
      showToast('Impossible de charger les soumissions en attente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Filtered submissions based on search term
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = sub.prestataireNomComplet?.toLowerCase().includes(searchLower);
      const matMatch = sub.prestataireMatricule?.toLowerCase().includes(searchLower);
      const imgMatch = sub.nomOriginal?.toLowerCase().includes(searchLower);
      return nameMatch || matMatch || imgMatch;
    });
  }, [submissions, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(start, start + itemsPerPage);
  }, [filteredSubmissions, currentPage]);

  const handleExaminer = (imageId) => {
    navigate(`/admin/pointages/${imageId}`);
  };

  return (
    <DashboardLayout
      title="Validation des Pointages"
      badge={<span className="badge-warning">{submissions.length} en attente</span>}
      subtitle="Examinez et validez les fiches de pointage soumises par les prestataires."
    >
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8 pb-12">

        {/* Search bar & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Rechercher par prestataire, matricule ou fichier..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field pl-10"
            />
          </div>

          <button
            onClick={fetchPendingSubmissions}
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
              <p className="text-slate-500 text-sm">Chargement des soumissions en attente...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800">Aucune soumission en attente</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
                {searchTerm
                  ? "Aucun résultat ne correspond à votre recherche."
                  : "Toutes les soumissions de pointage ont été traitées."}
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
                    <th className="px-6 py-4 text-center">Jours / Relevés</th>
                    <th className="px-6 py-4">Soumis le</th>
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
                      </td>

                      {/* Jours / Relevés */}
                      <td className="px-6 py-4 text-center">
                        <span className="badge-warning">
                          {sub.nombreJours} j ({sub.nombrePointages} relevés)
                        </span>
                      </td>

                      {/* Soumis le */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDateTime(sub.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleExaminer(sub.imageId)}
                          className="btn-primary text-xs !py-1.5 !px-3.5"
                        >
                          <span>Examiner</span>
                          <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path>
                          </svg>
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

export default AdminPointages;
