import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Toast from '../../components/ui/Toast';
import rapportService from '../../services/rapportService';
import { prestataireService } from '../../services/prestataireService';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  if (year && month && day) {
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return 'N/A';
  try {
    const d = new Date(dateTimeStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateTimeStr;
  }
};

const Rapports = () => {
  const [rapports, setRapports] = useState([]);
  const [prestataires, setPrestataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Filters state
  const [selectedPrestataireId, setSelectedPrestataireId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal preview state
  const [previewReport, setPreviewReport] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rapportsData, prestatairesData] = await Promise.all([
        rapportService.getAllRapportsForAdmin(),
        prestataireService.getAllPrestataires(),
      ]);
      setRapports(rapportsData);
      setPrestataires(prestatairesData);
    } catch (err) {
      console.error('Erreur lors du chargement des données :', err);
      showToast('Impossible de charger les rapports et prestataires.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Manage Blob Object URL for PDF viewer
  useEffect(() => {
    if (!pdfBlob) {
      setPdfUrl(null);
      return;
    }
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfBlob]);

  // Handle clicking "Voir" to open PDF preview
  const handleVoir = async (rapport) => {
    setPreviewReport(rapport);
    setPdfBlob(null);
    setLoadingPdf(true);

    try {
      const blob = await rapportService.downloadReportForAdmin(rapport.id);
      setPdfBlob(blob);
    } catch (err) {
      console.error('Erreur lors de la récupération du PDF :', err);
      showToast('Erreur lors du chargement du fichier PDF du rapport.', 'error');
      setPreviewReport(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleCloseModal = () => {
    setPreviewReport(null);
    setPdfBlob(null);
    setPdfUrl(null);
  };

  // Handle downloading PDF from preview modal
  const handleDownload = (rapport) => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = rapport.nom || `Rapport_Assiduite_${rapport.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered reports
  const filteredRapports = useMemo(() => {
    return rapports.filter((item) => {
      // Prestataire filter
      const matchesPrestataire =
        !selectedPrestataireId || String(item.prestataireId) === String(selectedPrestataireId);

      // Name search
      const matchesName = !searchTerm || item.nom?.toLowerCase().includes(searchTerm.toLowerCase());

      // Period start date filter (dateDebut >= filterStartDate)
      const matchesStartDate = !filterStartDate || (item.dateDebut && item.dateDebut >= filterStartDate);

      // Period end date filter (dateFin <= filterEndDate)
      const matchesEndDate = !filterEndDate || (item.dateFin && item.dateFin <= filterEndDate);

      return matchesPrestataire && matchesName && matchesStartDate && matchesEndDate;
    });
  }, [rapports, selectedPrestataireId, searchTerm, filterStartDate, filterEndDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRapports.length / itemsPerPage);
  const paginatedRapports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRapports.slice(start, start + itemsPerPage);
  }, [filteredRapports, currentPage]);

  const handleResetFilters = () => {
    setSelectedPrestataireId('');
    setSearchTerm('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  return (
    <DashboardLayout
      title="Rapports des Prestataires"
      badge={
        <span className="px-3 py-1 bg-blue-50 text-[#3b62ad] text-xs font-bold rounded-full border border-blue-100">
          {rapports.length} rapport{rapports.length > 1 ? 's' : ''} au total
        </span>
      }
      subtitle="Consultez l'ensemble des rapports d'assiduité générés par tous les prestataires (lecture seule)."
    >
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8 pb-12">

        {/* Filters Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Prestataire Dropdown Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Filtrer par Prestataire
              </label>
              <select
                value={selectedPrestataireId}
                onChange={(e) => {
                  setSelectedPrestataireId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad] transition-all text-slate-700 font-medium"
              >
                <option value="">Tous les prestataires</option>
                {prestataires.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nomComplet || p.email} ({p.matricule || `ID: ${p.id}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Recherche par nom
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Ex: Rapport_Assiduite..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad] transition-all text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Filter Date Debut */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Période à partir du
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad] transition-all text-slate-700"
              />
            </div>

            {/* Filter Date Fin */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Période jusqu'au
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad] transition-all text-slate-700"
              />
            </div>
          </div>

          {/* Action buttons bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <span className="text-xs text-slate-400 font-medium">
              {filteredRapports.length} résultat{filteredRapports.length > 1 ? 's' : ''} trouvé{filteredRapports.length > 1 ? 's' : ''}
            </span>

            <div className="flex items-center space-x-3">
              {(selectedPrestataireId || searchTerm || filterStartDate || filterEndDate) && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Réinitialiser les filtres</span>
                </button>
              )}

              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#3b62ad] border-t-transparent mb-3"></div>
              <p className="text-slate-500 text-sm">Chargement des rapports...</p>
            </div>
          ) : filteredRapports.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-800">Aucun rapport trouvé</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
                {selectedPrestataireId || searchTerm || filterStartDate || filterEndDate
                  ? "Aucun rapport ne correspond aux filtres sélectionnés."
                  : "Aucun rapport n'a encore été généré par les prestataires."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Prestataire</th>
                    <th className="px-6 py-4">Nom du rapport</th>
                    <th className="px-6 py-4">Date de génération</th>
                    <th className="px-6 py-4 text-center">Période du rapport</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedRapports.map((rapport) => (
                    <tr key={rapport.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Prestataire */}
                      <td className="px-6 py-4 font-medium text-slate-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#3b62ad] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-blue-100">
                            {rapport.prestataireNomComplet
                              ? rapport.prestataireNomComplet.charAt(0).toUpperCase()
                              : 'P'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {rapport.prestataireNomComplet || 'Prestataire inconnu'}
                            </span>
                            <span className="text-xs text-slate-400">ID: {rapport.prestataireId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Nom du rapport */}
                      <td className="px-6 py-4 font-medium text-slate-700">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-red-50 text-red-600 rounded-xl flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="font-medium text-slate-800 block truncate max-w-xs" title={rapport.nom}>
                            {rapport.nom}
                          </span>
                        </div>
                      </td>

                      {/* Date de génération */}
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {formatDateTime(rapport.createdAt)}
                      </td>

                      {/* Période du rapport */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-[#3b62ad] border border-blue-100">
                          <span>{formatDate(rapport.dateDebut)}</span>
                          <svg className="w-3 h-3 text-[#3b62ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span>{formatDate(rapport.dateFin)}</span>
                        </span>
                      </td>

                      {/* Action Voir */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleVoir(rapport)}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#3b62ad] hover:bg-[#2d4d8c] text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Voir</span>
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
                <span className="font-semibold text-slate-700">{totalPages}</span> ({filteredRapports.length} éléments)
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

      {/* PDF Modal Viewer */}
      {previewReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 truncate max-w-lg">
                    {previewReport.nom}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prestataire : <span className="font-semibold text-slate-700">{previewReport.prestataireNomComplet}</span> | Période : {formatDate(previewReport.dateDebut)} → {formatDate(previewReport.dateFin)} | Généré le {formatDateTime(previewReport.createdAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content / PDF Viewer */}
            <div className="flex-1 bg-slate-100 p-4 min-h-[500px] flex items-center justify-center overflow-hidden">
              {loadingPdf ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#3b62ad] border-t-transparent mb-3"></div>
                  <p className="text-slate-600 font-medium text-sm">Chargement du document PDF en cours...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-[650px] border-none rounded-2xl bg-white shadow-inner"
                  title={`Visualisation - ${previewReport.nom}`}
                />
              ) : (
                <div className="text-center py-20 text-slate-500">
                  <p>Impossible d'afficher le document PDF.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Document de rapport d'assiduité (Mode consultation Administrateur)
              </span>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Fermer
                </button>

                {pdfUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownload(previewReport)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-600/10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Télécharger le PDF</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Rapports;
