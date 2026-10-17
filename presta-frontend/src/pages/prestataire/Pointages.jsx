import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PrestataireDashboardLayout from '../../components/layout/PrestataireDashboardLayout';
import Toast from '../../components/ui/Toast';
import imagePointageService from '../../services/imagePointageService';

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

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'VALIDE':
      return 'badge-success';
    case 'REJETE':
      return 'badge-error';
    case 'EN_ATTENTE':
    case 'EN_COURS':
      return 'badge-warning';
    case 'EXTRAIT':
    default:
      return 'badge-neutral';
  }
};


const getStatusLabel = (status) => {
  switch (status) {
    case 'VALIDE':
      return 'VALIDÉ';
    case 'REJETE':
      return 'REJETÉ';
    case 'EN_ATTENTE':
      return 'EN ATTENTE';
    case 'EN_COURS':
      return 'EN COURS';
    case 'EXTRAIT':
      return 'EXTRAIT';
    default:
      return status || 'INCONNU';
  }
};

const Pointages = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const data = await imagePointageService.getMesImages();
      setImages(data);
    } catch (err) {
      console.error('Erreur chargement des pointages :', err);
      showToast('Impossible de charger vos pointages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Filtered images based on search term
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const searchLower = searchTerm.toLowerCase();
      return img.nomOriginal?.toLowerCase().includes(searchLower);
    });
  }, [images, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredImages.length / itemsPerPage);
  const paginatedImages = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredImages.slice(start, start + itemsPerPage);
  }, [filteredImages, currentPage]);

  const handleConsulter = (imageId) => {
    navigate(`/prestataire/pointages/${imageId}`);
  };

  return (
    <PrestataireDashboardLayout
      title="Mes Soumissions de Pointage"
      badge={
        <span className="px-3 py-1 bg-blue-50 text-[#3b62ad] text-xs font-bold rounded-full border border-blue-100">
          {images.length} soumission{images.length > 1 ? 's' : ''}
        </span>
      }
      subtitle="Consultez et suivez l'état de validation de vos feuilles de pointage téléversées."
    >
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8 pb-12">

        {/* Search bar & Refresh */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom de fichier..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field pl-10"
            />
          </div>

          <button
            onClick={fetchImages}
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
              <p className="text-slate-500 text-sm">Chargement de vos pointages...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800">Aucune feuille de pointage trouvée</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
                {searchTerm
                  ? "Aucun résultat ne correspond à votre recherche."
                  : "Vous n'avez pas encore téléversé de feuille de pointage."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header-row">
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Date d'import</th>
                    <th className="px-6 py-4 text-center">Nombre de jours</th>
                    <th className="px-6 py-4 text-center">Statut global</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {paginatedImages.map((img) => (
                    <tr key={img.id} className="table-data-row">
                      {/* Document */}
                      <td className="px-6 py-4 font-medium text-slate-700">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 text-[#3b62ad] rounded-xl flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block truncate max-w-xs">{img.nomOriginal || 'Feuille de pointage'}</span>
                            <span className="text-xs text-slate-400">{img.mimeType || 'Image'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date d'import */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDateTime(img.createdAt)}
                      </td>

                      {/* Nombre de jours */}
                      <td className="px-6 py-4 text-center">
                        <span className="badge-neutral">
                          {img.nombreJours} jour{img.nombreJours > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Statut global */}
                      <td className="px-6 py-4 text-center">
                        <span className={getStatusBadgeClass(img.statutGlobal)}>
                          {getStatusLabel(img.statutGlobal)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleConsulter(img.id)}
                          className="btn-primary text-xs !py-1.5 !px-3.5"
                        >
                          <span>Consulter</span>
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
                <span className="font-semibold text-slate-700">{totalPages}</span> ({filteredImages.length} éléments)
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
    </PrestataireDashboardLayout>
  );
};

export default Pointages;
