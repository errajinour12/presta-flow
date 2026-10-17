import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Toast from '../../components/ui/Toast';
import RejectReasonModal from '../../components/admin/RejectReasonModal';
import adminAttendanceService from '../../services/adminAttendanceService';
import ImageViewerModal from '../../components/ui/ImageViewerModal';

// ---------------------------------------------------------------------------
// Helpers (Duration calculation & formatting)
// ---------------------------------------------------------------------------

const toHHmm = (time) => {
  if (!time) return '';
  return time.slice(0, 5);
};

const slotMinutes = (entry, exit) => {
  if (!entry || !exit) return 0;
  try {
    const toMins = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    let diff = toMins(exit) - toMins(entry);
    if (diff < 0) diff += 24 * 60;
    return diff;
  } catch {
    return 0;
  }
};

const formatMins = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

const calcDayDuration = (creneaux) => {
  if (!creneaux || creneaux.length === 0) return '0h 00m';
  const mins = creneaux.reduce(
    (sum, c) => sum + slotMinutes(toHHmm(c.heureEntree), toHHmm(c.heureSortie)),
    0
  );
  return formatMins(mins);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const dayTypeBadgeClass = () => {
  return 'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60';
};


const statusBadge = (statut) => {
  switch (statut) {
    case 'VALIDE':
      return <span className="badge-success">VALIDÉ</span>;
    case 'REJETE':
      return <span className="badge-error">REJETÉ</span>;
    case 'EN_ATTENTE':
      return <span className="badge-warning">EN ATTENTE</span>;
    default:
      return <span className="badge-neutral">{statut || 'EXTRAIT'}</span>;
  }
};


const AdminPointageDetails = () => {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode history flag from navigation state or URL context
  const isFromHistoryState = location.state?.fromHistory === true;

  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected date for detailed view
  const [selectedDate, setSelectedDate] = useState(null);

  // Single Pointage targeted for rejection
  const [rejectingPointageId, setRejectingPointageId] = useState(null);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Image viewer modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (imageId) {
      fetchDetails();
    }
  }, [imageId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await adminAttendanceService.getSubmissionDetails(imageId);
      setSummaries(data);
      if (data && data.length > 0) {
        // Keep selected date if valid, otherwise select first date
        setSelectedDate((prevDate) => {
          const exists = data.some((s) => s.date === prevDate);
          return exists ? prevDate : data[0].date;
        });
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des détails :', err);
      showToast('Impossible de charger les détails de cette soumission.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Client-side calculations
  const stats = useMemo(() => {
    if (!summaries || summaries.length === 0) {
      return { totalDays: 0, pendingDays: 0, validatedDays: 0, rejectedDays: 0, formattedDuration: '0h 00m' };
    }

    let grandTotalMins = 0;
    let pendingDays = 0;
    let validatedDays = 0;
    let rejectedDays = 0;

    summaries.forEach((s) => {
      const activeP = s.corrigeePointage ?? s.brutPointage;
      const creneaux = activeP?.creneaux || [];
      const dayMins = creneaux.reduce(
        (sum, c) => sum + slotMinutes(toHHmm(c.heureEntree), toHHmm(c.heureSortie)),
        0
      );
      grandTotalMins += dayMins;

      if (activeP?.statut === 'EN_ATTENTE') pendingDays++;
      else if (activeP?.statut === 'VALIDE') validatedDays++;
      else if (activeP?.statut === 'REJETE') rejectedDays++;
    });

    return {
      totalDays: summaries.length,
      pendingDays,
      validatedDays,
      rejectedDays,
      formattedDuration: formatMins(grandTotalMins),
    };
  }, [summaries]);

  // Determine if this view should act as read-only (History mode)
  const isHistoryMode = isFromHistoryState || (stats.totalDays > 0 && stats.pendingDays === 0);

  // Selected summary for inline inspection
  const selectedSummary = useMemo(() => {
    return summaries.find((s) => s.date === selectedDate) || null;
  }, [summaries, selectedDate]);

  // Active pointage rule: CORRIGEE ?? BRUT
  const activePointage = useMemo(() => {
    if (!selectedSummary) return null;
    return selectedSummary.corrigeePointage ?? selectedSummary.brutPointage;
  }, [selectedSummary]);

  // Header info
  const headerInfo = useMemo(() => {
    if (!summaries || summaries.length === 0) return null;
    const firstP = summaries[0].corrigeePointage ?? summaries[0].brutPointage;
    return {
      prestataireNom: firstP?.prestataireNomComplet || 'Prestataire',
      prestataireId: firstP?.prestataireId,
    };
  }, [summaries]);

  // Validate single pointage
  const handleValidatePointage = async (pointageId) => {
    if (!pointageId) return;
    try {
      setActionLoading(true);
      await adminAttendanceService.validatePointage(pointageId);
      showToast('Le pointage pour ce jour a été validé !');
      await fetchDetails();
    } catch (err) {
      console.error('Erreur lors de la validation :', err);
      const errMsg = err.response?.data?.message || err.message || 'Impossible de valider ce pointage.';
      showToast(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject single pointage
  const handleRejectPointage = async (motifRejet) => {
    if (!rejectingPointageId) return;
    try {
      setActionLoading(true);
      await adminAttendanceService.rejectPointage(rejectingPointageId, motifRejet);
      setRejectingPointageId(null);
      showToast('Le pointage pour ce jour a été rejeté.');
      await fetchDetails();
    } catch (err) {
      console.error('Erreur lors du rejet :', err);
      const errMsg = err.response?.data?.message || err.message || 'Impossible de rejeter ce pointage.';
      showToast(errMsg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout
      title={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(isFromHistoryState ? '/admin/pointages/historique' : '/admin/pointages')}
            className="btn-secondary !p-2.5 !w-10 !h-10 shrink-0"
            title={isFromHistoryState ? "Retour à l'historique" : "Retour au traitement"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                {isFromHistoryState ? "Consultation du Pointage Traité" : "Examen des Pointages par Jour"}
              </h1>
              {stats.pendingDays > 0 ? (
                <span className="badge-warning">
                  {stats.pendingDays} en attente
                </span>
              ) : (
                <span className="badge-success">
                  Saisie entièrement traitée
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs md:text-sm font-medium mt-0.5">
              Prestataire : <span className="font-semibold text-slate-700">{headerInfo?.prestataireNom}</span>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Voir l'image originale</span>
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

      <RejectReasonModal
        isOpen={!!rejectingPointageId}
        onClose={() => setRejectingPointageId(null)}
        onSubmit={handleRejectPointage}
        loading={actionLoading}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        loadImage={() => adminAttendanceService.getImageContent(imageId)}
        title="Image originale de pointage"
      />

      <div className="max-w-7xl mx-auto space-y-6 pb-16">

        {/* Completion notice banner only shown when active in Traitement workflow */}
        {!loading && stats.pendingDays === 0 && !isFromHistoryState && (
          <div className="p-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3 text-emerald-800">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p className="text-sm font-bold">Tous les jours de cette fiche ont été traités.</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Il n'y a plus aucun pointage en attente de validation pour cette soumission.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/pointages')}
              className="btn-primary text-xs !py-2 !px-4"
            >
              Retour aux soumissions
            </button>
          </div>
        )}

        {/* KPI Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Total Jours */}
          <div className="card-container p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Jours</p>
              <p className="text-lg font-bold text-slate-800">{stats.totalDays} jours</p>
            </div>
          </div>

          {/* En Attente */}
          <div className="card-container p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">En Attente</p>
              <p className="text-lg font-bold text-slate-800">{stats.pendingDays} jour(s)</p>
            </div>
          </div>

          {/* Validés */}
          <div className="card-container p-4 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Validés</p>
              <p className="text-lg font-bold text-slate-800">{stats.validatedDays} jour(s)</p>
            </div>
          </div>

          {/* Rejetés (Rouge uniquement si > 0, sinon gris neutre) */}
          <div className="card-container p-4 flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              stats.rejectedDays > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Rejetés</p>
              <p className={`text-lg font-bold ${stats.rejectedDays > 0 ? 'text-red-700' : 'text-slate-800'}`}>
                {stats.rejectedDays} jour(s)
              </p>
            </div>
          </div>
        </div>




        {loading ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#3b62ad] border-t-transparent mb-3"></div>
            <p className="text-slate-500 text-sm">Chargement des relevés quotidiens...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Day-by-Day List */}
            <div className="lg:col-span-5 card-container p-5 flex flex-col space-y-3">
              <h2 className="text-base font-bold text-slate-800 px-1 mb-1">
                Jours de la soumission ({summaries.length})
              </h2>

              <div className="space-y-2 overflow-y-auto max-h-[620px] pr-1">
                {summaries.map((s) => {
                  const dayActiveP = s.corrigeePointage ?? s.brutPointage;
                  const isSelected = s.date === selectedDate;
                  const dayDuration = calcDayDuration(dayActiveP?.creneaux);

                  return (
                    <div
                      key={s.date}
                      onClick={() => setSelectedDate(s.date)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#3b62ad] bg-blue-50/40 ring-2 ring-[#3b62ad]/10'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm text-slate-800">
                          {formatDate(s.date)}
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {s.hasCorrection && (
                            <span className="badge-neutral">
                              CORRIGÉ
                            </span>
                          )}
                          {statusBadge(dayActiveP?.statut)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 text-xs">
                        <span className={dayTypeBadgeClass(dayActiveP?.dayType)}>
                          {dayActiveP?.dayType || 'PRESENCE'}
                        </span>
                        <span className="font-medium text-slate-500">
                          {dayActiveP?.creneaux?.length || 0} créneau(x) • <span className="font-semibold text-slate-700">{dayDuration}</span>
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Day Detail & Actions */}
            <div className="lg:col-span-7 card-container p-6 flex flex-col">
              <div className="border-b border-slate-100 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg font-bold text-slate-800">
                      {selectedDate ? formatDate(selectedDate) : ''}
                    </h2>
                    {statusBadge(activePointage?.statut)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Données pour cette journée • <strong className="text-slate-600">{calcDayDuration(activePointage?.creneaux)}</strong>
                  </p>
                </div>

                {/* Per-Day Action Buttons (only in Traitement workflow when pending) */}
                {!isHistoryMode && activePointage?.statut === 'EN_ATTENTE' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setRejectingPointageId(activePointage.id)}
                      disabled={actionLoading}
                      className="btn-danger text-xs !py-1.5 !px-3.5"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <span>Rejeter ce jour</span>
                    </button>

                    <button
                      onClick={() => handleValidatePointage(activePointage.id)}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-medium text-xs shadow-sm transition-all flex items-center"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Valider ce jour</span>
                    </button>
                  </div>
                )}
              </div>


              {/* Status Notice Banners for Selected Day */}
              {activePointage?.statut === 'VALIDE' && (
                <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-xs text-emerald-800">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <div>
                    <span className="font-bold">Journée validée par l'administrateur.</span> Cette journée est verrouillée.
                  </div>
                </div>
              )}

              {activePointage?.statut === 'REJETE' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-800">
                  <div className="flex items-center space-x-2 font-bold text-red-900">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Journée rejetée par l'administrateur</span>
                  </div>
                  {activePointage.motifRejet && (
                    <p className="text-slate-700 pt-1">
                      <strong className="text-red-700">Motif de rejet :</strong> {activePointage.motifRejet}
                    </p>
                  )}
                  <p className="text-[11px] text-red-600 pt-1">
                    En attente de correction et de resoumission par le prestataire pour cette journée.
                  </p>
                </div>
              )}

              {!selectedSummary ? (
                <div className="py-20 text-center text-slate-400 text-sm">
                  Sélectionnez un jour dans la liste de gauche pour afficher les détails.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  {/* BRUT Panel (Left) */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 flex flex-col space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                          1. BRUT (OCR Gemini)
                        </h3>
                      </div>
                      <span className="badge-neutral text-[11px]">
                        Original
                      </span>
                    </div>

                    {selectedSummary.brutPointage ? (
                      <div className="space-y-4 text-sm">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Type de journée</label>
                          <p className="font-semibold text-slate-700 mt-0.5 text-xs">
                            {selectedSummary.brutPointage.dayType || 'PRESENCE'}
                          </p>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Créneaux extraits ({selectedSummary.brutPointage.creneaux?.length || 0})
                          </label>
                          <div className="space-y-2">
                            {selectedSummary.brutPointage.creneaux?.map((c, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-700">
                                <span>Créneau {i + 1}</span>
                                <span className="font-semibold text-slate-800">
                                  {toHHmm(c.heureEntree)} → {toHHmm(c.heureSortie)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex justify-between text-xs font-semibold text-slate-600">
                          <span>Durée calculée :</span>
                          <span>{calcDayDuration(selectedSummary.brutPointage.creneaux)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 py-8 text-center">Aucun relevé BRUT enregistré.</div>
                    )}
                  </div>

                  {/* CORRIGEE Panel (Right) */}
                  <div className="p-5 rounded-2xl border border-slate-200/60 bg-slate-50/40 flex flex-col space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${selectedSummary.hasCorrection ? 'bg-slate-500' : 'bg-slate-300'}`}></span>
                        <h3 className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                          2. CORRIGÉE (Prestataire)
                        </h3>
                      </div>
                      {selectedSummary.hasCorrection ? (
                        <span className="badge-neutral text-[11px]">
                          Modifié
                        </span>
                      ) : (
                        <span className="badge-neutral text-[11px]">
                          Identique
                        </span>
                      )}
                    </div>

                    {selectedSummary.corrigeePointage ? (
                      <div className="space-y-4 text-sm">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Type de journée</label>
                          <p className="font-semibold text-slate-800 mt-0.5 text-xs">
                            {selectedSummary.corrigeePointage.dayType || 'PRESENCE'}
                          </p>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Créneaux corrigés ({selectedSummary.corrigeePointage.creneaux?.length || 0})
                          </label>
                          <div className="space-y-2">
                            {selectedSummary.corrigeePointage.creneaux?.map((c, i) => (
                              <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-800">
                                <span>Créneau {i + 1}</span>
                                <span className="font-semibold text-slate-800">
                                  {toHHmm(c.heureEntree)} → {toHHmm(c.heureSortie)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex justify-between text-xs font-semibold text-slate-700">
                          <span>Durée corrigée :</span>
                          <span className="text-slate-800 font-semibold">{calcDayDuration(selectedSummary.corrigeePointage.creneaux)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 py-12 text-center flex flex-col items-center justify-center">
                        <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>Aucune correction apportée par le prestataire pour cette journée.</span>
                      </div>
                    )}
                  </div>


                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPointageDetails;
