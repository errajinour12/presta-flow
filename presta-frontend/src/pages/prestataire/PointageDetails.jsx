import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PrestataireDashboardLayout from '../../components/layout/PrestataireDashboardLayout';
import Toast from '../../components/ui/Toast';
import ImageViewerModal from '../../components/ui/ImageViewerModal';
import imagePointageService from '../../services/imagePointageService';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'VALIDE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'REJETE':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'EN_ATTENTE':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'EXTRAIT':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'VALIDE':
      return 'VALIDÉ';
    case 'REJETE':
      return 'REJETÉ';
    case 'EN_ATTENTE':
      return 'EN ATTENTE DE VALIDATION';
    case 'EXTRAIT':
      return 'EXTRAIT (NON SOUMIS)';
    default:
      return status || 'INCONNU';
  }
};

const PointageDetails = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [showBrutComparison, setShowBrutComparison] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDayType, setEditDayType] = useState('JOUR_TRAVAILLE');
  const [editCreneaux, setEditCreneaux] = useState([]);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Image viewer modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [imageId]);

  const fetchDetails = async (preserveSelectedDate = false) => {
    try {
      setLoading(true);
      const data = await imagePointageService.getPointagesByImage(imageId);
      setSummaries(data);
      if (data && data.length > 0 && !preserveSelectedDate) {
        setSelectedDayDate(data[0].date);
      }
    } catch (err) {
      console.error('Erreur chargement détails pointage :', err);
      showToast('Impossible de charger les détails de cette feuille de pointage.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!selectedSummary) return;
    const active = selectedSummary.corrigeePointage ?? selectedSummary.brutPointage;
    setEditDayType(active?.dayType || 'JOUR_TRAVAILLE');
    const creneauxList = (active?.creneaux || []).map((c, idx) => ({
      heureEntree: c.heureEntree || '',
      heureSortie: c.heureSortie || '',
      ordre: c.ordre || idx + 1,
    }));
    if (creneauxList.length === 0) {
      creneauxList.push({ heureEntree: '', heureSortie: '', ordre: 1 });
    }
    setEditCreneaux(creneauxList);
    setShowEditModal(true);
  };

  const handleAddCreneau = () => {
    setEditCreneaux((prev) => [
      ...prev,
      { heureEntree: '', heureSortie: '', ordre: prev.length + 1 },
    ]);
  };

  const handleRemoveCreneau = (index) => {
    setEditCreneaux((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreneauChange = (index, field, value) => {
    setEditCreneaux((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveAndResubmit = async () => {
    if (!selectedSummary || !selectedSummary.brutPointage) {
      showToast('Pointage d\'origine introuvable.', 'error');
      return;
    }

    try {
      setSubmittingCorrection(true);

      // Filter valid creneaux
      const validCreneaux = editCreneaux.filter(
        (c) => c.heureEntree?.trim() && c.heureSortie?.trim()
      );

      const payload = {
        brutPointageId: selectedSummary.brutPointage.id,
        dayType: editDayType,
        creneaux: validCreneaux,
      };

      // 1. Save or update the CORRIGEE pointage
      const savedCorrigee = await imagePointageService.saveCorrection(payload);

      // 2. Resubmit ONLY the CORRIGEE pointage (transitions to EN_ATTENTE)
      await imagePointageService.resubmitPointage(savedCorrigee.id);

      showToast('Journée corrigée et resoumise avec succès pour validation.', 'success');
      setShowEditModal(false);

      // 3. Refresh details while preserving current day selection
      await fetchDetails(true);
    } catch (err) {
      console.error('Erreur lors de la correction et resoumission :', err);
      const msg = err.response?.data?.message || 'Erreur lors de la resoumission du pointage.';
      showToast(msg, 'error');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Find currently selected day summary
  const selectedSummary = summaries.find((s) => s.date === selectedDayDate);

  // Active pointage for selected day: CORRIGEE takes priority over BRUT
  const activeP = selectedSummary
    ? (selectedSummary.corrigeePointage ?? selectedSummary.brutPointage)
    : null;

  // Active status directly from backend summary (or active pointage fallback)
  const activeStatus = selectedSummary?.statutActif ?? activeP?.statut;
  const activeMotifRejet = selectedSummary?.motifRejet ?? activeP?.motifRejet;

  return (
    <PrestataireDashboardLayout
      title={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/prestataire/pointages')}
            className="btn-secondary !p-2.5 !w-10 !h-10 shrink-0"
            title="Retour à mes pointages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
              Détails du pointage
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              Consultez l'état et les pointages extraits de votre document.
            </p>
          </div>
        </div>
      }
      actions={
        <button
          type="button"
          onClick={() => setIsImageModalOpen(true)}
          className="btn-secondary flex items-center space-x-2"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          <span>Voir le document original</span>
        </button>
      }
    >
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {loading ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#3b62ad] border-t-transparent mb-3"></div>
            <p className="text-slate-500 text-sm">Chargement des détails de la soumission...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm px-4">
            <h3 className="text-base font-semibold text-slate-800">Aucun pointage trouvé</h3>
            <p className="text-slate-500 text-sm mt-1">Cette feuille ne contient aucun relevé de pointage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Days Sidebar / List (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Journées relevées ({summaries.length})
                </h2>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {summaries.map((summary) => {
                  const dayActive = summary.corrigeePointage ?? summary.brutPointage;
                  const dayStatus = summary.statutActif ?? dayActive?.statut;
                  const isSelected = summary.date === selectedDayDate;

                  return (
                    <button
                      key={summary.date}
                      onClick={() => setSelectedDayDate(summary.date)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#3b62ad] bg-blue-50/50 shadow-sm'
                          : 'border-slate-100 hover:border-slate-200 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-800 capitalize">
                          {formatDate(summary.date)}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {dayActive?.dayType || 'Jour normal'}
                          {summary.hasCorrection && (
                            <span className="ml-2 px-1.5 py-0.5 bg-purple-50 text-purple-600 font-semibold rounded text-[10px]">
                              Modifié
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(dayStatus)}`}>
                        {dayStatus}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Details View (8 cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              {selectedSummary && activeP ? (
                <>
                  {/* Selected Day Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 capitalize">
                        {formatDate(selectedSummary.date)}
                      </h2>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Type: <span className="font-semibold text-slate-600">{activeP.dayType || 'Jour normal'}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(activeStatus)}`}>
                        {getStatusLabel(activeStatus)}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason Alert Box (If REJETE) & Correction Action */}
                  {activeStatus === 'REJETE' && activeMotifRejet && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-red-800 font-bold text-sm">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                          </svg>
                          <span>Motif de rejet par l'administrateur</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsImageModalOpen(true)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>Voir l'image</span>
                          </button>
                          <button
                            onClick={handleOpenEditModal}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            <span>Corriger ce jour</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-red-700 text-xs leading-relaxed pl-7">
                        "{activeMotifRejet}"
                      </p>
                    </div>
                  )}

                  {/* Pending Info Box */}
                  {activeStatus === 'EN_ATTENTE' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3 text-amber-800 text-xs font-medium">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Cette journée est en attente d'examen par l'administrateur. Aucune action requise de votre part.</span>
                    </div>
                  )}

                  {/* Validated Info Box */}
                  {activeStatus === 'VALIDE' && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-800 text-xs font-medium">
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Cette journée a été validée par l'administrateur.</span>
                    </div>
                  )}

                  {/* Version Comparison Toggle (if CORRIGEE exists) */}
                  {selectedSummary.hasCorrection && selectedSummary.brutPointage && (
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-xs text-slate-600 font-medium">
                        Une version corrigée existe pour cette journée.
                      </span>
                      <button
                        onClick={() => setShowBrutComparison(!showBrutComparison)}
                        className="text-xs font-bold text-[#3b62ad] hover:underline"
                      >
                        {showBrutComparison ? "Masquer la comparaison BRUT" : "Comparer avec la version BRUT"}
                      </button>
                    </div>
                  )}

                  {/* Display Créneaux Side by Side if comparison toggled, else show Active Créneaux */}
                  {showBrutComparison && selectedSummary.hasCorrection && selectedSummary.brutPointage ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Active Version (CORRIGEE) */}
                      <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/20">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-[#3b62ad] uppercase tracking-wider">
                            Version Active (CORRIGÉE)
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {selectedSummary.corrigeePointage?.creneaux?.length > 0 ? (
                            selectedSummary.corrigeePointage.creneaux.map((c, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 text-xs">
                                <span className="font-semibold text-slate-600">Créneau {c.ordre || idx + 1}</span>
                                <span className="font-bold text-slate-800">{c.heureEntree} - {c.heureSortie}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Aucun créneau renseigné</p>
                          )}
                        </div>
                      </div>

                      {/* BRUT Version */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Version d'Origine (BRUT)
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {selectedSummary.brutPointage?.creneaux?.length > 0 ? (
                            selectedSummary.brutPointage.creneaux.map((c, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 text-xs">
                                <span className="font-semibold text-slate-500">Créneau {c.ordre || idx + 1}</span>
                                <span className="font-semibold text-slate-600">{c.heureEntree} - {c.heureSortie}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">Aucun créneau extrait</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Active Créneaux Table */
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Créneaux de présence ({activeP.creneaux?.length || 0})
                      </h4>

                      {activeP.creneaux && activeP.creneaux.length > 0 ? (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Heure d'entrée</th>
                                <th className="px-4 py-3">Heure de sortie</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeP.creneaux.map((c, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-semibold text-slate-400">{c.ordre || idx + 1}</td>
                                  <td className="px-4 py-3 font-bold text-slate-700">{c.heureEntree || '--:--'}</td>
                                  <td className="px-4 py-3 font-bold text-slate-700">{c.heureSortie || '--:--'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                          Aucun créneau disponible pour cette journée.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center text-slate-400 text-sm">
                  Sélectionnez une journée à gauche pour consulter les détails.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Correction Modal for REJETE Day */}
        {showEditModal && selectedSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden space-y-5 p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Correction du {formatDate(selectedSummary.date)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifiez le type de jour et les créneaux horaire puis resoumettez la journée.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    title="Voir l'image originale"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-[#3b62ad] hover:border-[#3b62ad] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    disabled={submittingCorrection}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Day Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Type de journée
                  </label>
                  <select
                    value={editDayType}
                    onChange={(e) => setEditDayType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad]"
                  >
                    <option value="JOUR_TRAVAILLE">Jour travaillé</option>
                    <option value="WEEKEND">Weekend</option>
                    <option value="FERIE">Jour férié</option>
                    <option value="CONGE">Congé / Absence</option>
                  </select>
                </div>

                {/* Creneaux list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Créneaux horaire (HH:mm)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddCreneau}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-[#3b62ad] hover:underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                      </svg>
                      <span>Ajouter un créneau</span>
                    </button>
                  </div>

                  {editCreneaux.map((c, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-semibold text-slate-400 w-6 text-center">#{idx + 1}</span>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block mb-0.5">Entrée</span>
                          <input
                            type="time"
                            value={c.heureEntree}
                            onChange={(e) => handleCreneauChange(idx, 'heureEntree', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-bold focus:outline-none focus:border-[#3b62ad]"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-medium block mb-0.5">Sortie</span>
                          <input
                            type="time"
                            value={c.heureSortie}
                            onChange={(e) => handleCreneauChange(idx, 'heureSortie', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-bold focus:outline-none focus:border-[#3b62ad]"
                          />
                        </div>
                      </div>
                      {editCreneaux.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCreneau(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={submittingCorrection}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndResubmit}
                  disabled={submittingCorrection}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[#3b62ad] hover:bg-[#2d4d8c] text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {submittingCorrection ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Resoumission...</span>
                    </>
                  ) : (
                    <span>Enregistrer & Resoumettre</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        <ImageViewerModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          loadImage={() => imagePointageService.getImageContent(imageId)}
          title="Image originale de pointage"
        />
      </div>
    </PrestataireDashboardLayout>
  );
};

export default PointageDetails;
