import React, { useState, useRef, useCallback, useEffect } from 'react';
import PrestataireDashboardLayout from '../../components/layout/PrestataireDashboardLayout';
import AttendanceCorrectionModal from '../../components/prestataire/AttendanceCorrectionModal';
import Toast from '../../components/ui/Toast';
import ImageViewerModal from '../../components/ui/ImageViewerModal';
import imagePointageService from '../../services/imagePointageService';

// ---------------------------------------------------------------------------
// Helpers (duration calculation shared between table + modal)
// ---------------------------------------------------------------------------

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

const toHHmm = (time) => {
  if (!time) return '';
  return time.slice(0, 5);
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

const calcGrandTotal = (summaries) => {
  if (!summaries || summaries.length === 0) return '0h 00m';
  const mins = summaries.reduce((sum, s) => {
    // Active pointage rule: CORRIGEE ?? BRUT
    const p = s.corrigeePointage ?? s.brutPointage;
    const dayMins = (p?.creneaux || []).reduce(
      (d, c) => d + slotMinutes(toHHmm(c.heureEntree), toHHmm(c.heureSortie)),
      0
    );
    return sum + dayMins;
  }, 0);
  return formatMins(mins);
};

// ---------------------------------------------------------------------------
// Badge helpers (design system)
// ---------------------------------------------------------------------------

const dayTypeBadgeClass = (dayType) => {
  const t = (dayType || '').toUpperCase();
  if (t.includes('PRESENCE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (t.includes('CONGE') || t.includes('CONGÉ')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (t.includes('ABSENCE')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const statutBadgeClass = (statut) => {
  switch (statut) {
    case 'EXTRAIT':   return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'EN_ATTENTE': return 'bg-blue-50 text-[#3b62ad] border-blue-200';
    case 'VALIDE':    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'REJETE':    return 'bg-red-50 text-red-700 border-red-200';
    default:          return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

const origineBadgeClass = (origine) =>
  origine === 'CORRIGEE'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-500 border-slate-200';

// ---------------------------------------------------------------------------
// SessionStorage constants
// ---------------------------------------------------------------------------
const STORAGE_KEY_IMAGE_ID = 'activePointageImageId';
const STORAGE_KEY_IMAGE_NAME = 'activePointageImageName';

// ---------------------------------------------------------------------------
// ImportPointage page
// ---------------------------------------------------------------------------

const ImportPointage = () => {
  // ── File selection ─────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // ── Upload & summaries ────────────────────────────────────────────────
  const [imageId, setImageId] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // ── Submit ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Modal ─────────────────────────────────────────────────────────────
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ── Image Viewer Modal ────────────────────────────────────────────────
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Restore active import from sessionStorage on mount ────────────────
  useEffect(() => {
    const storedId = sessionStorage.getItem(STORAGE_KEY_IMAGE_ID);
    const storedName = sessionStorage.getItem(STORAGE_KEY_IMAGE_NAME);

    if (storedId) {
      const numericId = Number(storedId);
      setImageId(numericId);
      if (storedName) setImageName(storedName);

      setLoadingSummaries(true);
      imagePointageService
        .getPointagesByImage(numericId)
        .then((data) => {
          setSummaries(data);
        })
        .catch((err) => {
          console.error('Impossible de restaurer le pointage stocké :', err);
          sessionStorage.removeItem(STORAGE_KEY_IMAGE_ID);
          sessionStorage.removeItem(STORAGE_KEY_IMAGE_NAME);
          setImageId(null);
          setImageName(null);
          setSummaries([]);
        })
        .finally(() => {
          setLoadingSummaries(false);
        });
    }
  }, []);

  // ── Refresh summaries (single source of truth) ────────────────────────
  const refreshSummaries = useCallback(async (id) => {
    const targetId = id ?? imageId;
    if (!targetId) return;
    try {
      setLoadingSummaries(true);
      const data = await imagePointageService.getPointagesByImage(targetId);
      setSummaries(data);
    } catch (err) {
      console.error('Erreur lors du chargement des pointages :', err);
      showToast('Impossible de charger les données de pointage.', 'error');
    } finally {
      setLoadingSummaries(false);
    }
  }, [imageId]);

  // ── File handlers ─────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleChooseFileClick = () => fileInputRef.current?.click();

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Nouvelle importation handler ─────────────────────────────────────
  const handleNouvelleImportation = () => {
    sessionStorage.removeItem(STORAGE_KEY_IMAGE_ID);
    sessionStorage.removeItem(STORAGE_KEY_IMAGE_NAME);
    setImageId(null);
    setImageName(null);
    setSummaries([]);
    setSelectedFile(null);
    setSubmitted(false);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Analyse handler ───────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setUploadError(null);
    setSummaries([]);
    setImageId(null);
    setImageName(null);
    setSubmitted(false);

    try {
      // 1. Upload → get image metadata
      const uploadResponse = await imagePointageService.uploadImage(selectedFile);
      const newImageId = uploadResponse?.image?.id;
      const newImageName = uploadResponse?.image?.nomOriginal || selectedFile.name;

      if (!newImageId) throw new Error("L'identifiant de l'image n'a pas été retourné par le serveur.");

      setImageId(newImageId);
      setImageName(newImageName);
      sessionStorage.setItem(STORAGE_KEY_IMAGE_ID, String(newImageId));
      sessionStorage.setItem(STORAGE_KEY_IMAGE_NAME, newImageName);

      // 2. Immediately fetch DailyAttendanceSummaryResponse[] (single source of truth)
      const data = await imagePointageService.getPointagesByImage(newImageId);
      setSummaries(data);
    } catch (err) {
      console.error("Erreur lors de l'analyse de l'image :", err);
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'envoi et de l'analyse de l'image.";
      setUploadError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Submit handler ────────────────────────────────────────────────────
  const handleSoumettre = async () => {
    if (!imageId || submitted || submitting) return;
    try {
      setSubmitting(true);
      await imagePointageService.soumettre(imageId);
      showToast('Pointages soumis avec succès ! Ils sont maintenant en attente de validation.', 'success');
      setSubmitted(true);
      // Refresh to reflect new statuts
      await refreshSummaries(imageId);
    } catch (err) {
      console.error('Erreur lors de la soumission :', err);
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la soumission.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Modal handlers ────────────────────────────────────────────────────
  const handleOpenModal = (summary) => {
    setSelectedSummary(summary);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSummary(null);
  };

  // Callback: after correction saved, refresh summaries and update selectedSummary
  const handleCorrectionSaved = useCallback(async () => {
    await refreshSummaries(imageId);
    showToast('Correction enregistrée avec succès !', 'success');
    setIsModalOpen(false);
    setSelectedSummary(null);
  }, [imageId, refreshSummaries]);

  // ── Derived values ────────────────────────────────────────────────────
  const grandTotal = calcGrandTotal(summaries);

  // Is submission possible?
  // Submitted if ALL active pointages have a statut != EXTRAIT
  const allSubmitted = summaries.length > 0 &&
    summaries.every((s) => {
      const p = s.corrigeePointage ?? s.brutPointage;
      return p?.statut !== 'EXTRAIT';
    });

  const canSubmit = summaries.length > 0 && !allSubmitted && !submitting;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PrestataireDashboardLayout
      title="Importer une image de pointage"
      subtitle="Téléversez la photo ou le scan de votre fiche de présence. L'IA extrait automatiquement les dates et les heures travaillées."
      actions={
        imageId ? (
          <button
            type="button"
            onClick={handleNouvelleImportation}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nouvelle importation</span>
          </button>
        ) : null
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">

        {/* ── Card 1: Import form (shown when no active image or when starting a new import) ── */}
        {!imageId && (
          <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-slate-100/50 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
              <svg className="w-6 h-6 mr-3 text-[#3b62ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importer une image
            </h2>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Choose file button */}
              <button
                type="button"
                onClick={handleChooseFileClick}
                disabled={analyzing}
                className="px-6 py-3.5 rounded-2xl border-2 border-dashed border-[#3b62ad]/30 bg-[#f0f4f8]/50 text-[#3b62ad] font-bold text-sm hover:bg-[#f0f4f8] hover:border-[#3b62ad] transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Choisir un fichier</span>
              </button>

              {/* Selected file info */}
              {selectedFile ? (
                <div className="flex-1 flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm">
                  <div className="flex items-center space-x-3 truncate">
                    <svg className="w-5 h-5 text-[#3b62ad] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-semibold text-slate-700 truncate">{selectedFile.name}</span>
                    <span className="text-xs text-slate-400 font-medium shrink-0">
                      ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={handleClearFile}
                    disabled={analyzing}
                    className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex-1 text-sm text-slate-400 font-medium py-2 px-2">
                  Aucun fichier sélectionné (Formats acceptés : JPEG, PNG, WEBP, PDF)
                </div>
              )}

              {/* Analyse button */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!selectedFile || analyzing}
                className="px-8 py-3.5 rounded-2xl bg-[#3b62ad] text-white font-extrabold text-sm hover:bg-[#3b62ad]/90 transition-all shadow-md shadow-[#3b62ad]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyse Gemini en cours…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Analyser</span>
                  </>
                )}
              </button>
            </div>

            {/* Upload error banner */}
            {uploadError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Summaries section (single source of truth) ───────────────────── */}
        {(summaries.length > 0 || loadingSummaries) && (
          <div className="space-y-8 animate-fade-in">

            {/* Card 2: Image info */}
            <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-slate-100/50 space-y-6">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center justify-between">
                <span className="flex items-center">
                  <svg className="w-6 h-6 mr-3 text-[#3b62ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Informations de l'image
                </span>
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Extrait par Gemini
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsImageModalOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#3b62ad] hover:text-white text-slate-700 font-bold text-xs transition-colors shadow-sm border border-slate-200 hover:border-[#3b62ad]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Voir l'image originale</span>
                  </button>
                </div>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nom du fichier</p>
                  <p className="text-base font-extrabold text-slate-800 truncate" title={imageName}>{imageName || '-'}</p>
                </div>

                <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre de jours</p>
                  <p className="text-base font-extrabold text-slate-800">{summaries.length} jour{summaries.length > 1 ? 's' : ''}</p>
                </div>

                <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Durée totale cumulée</p>
                  <p className="text-base font-extrabold text-[#3b62ad]">{grandTotal}</p>
                </div>
              </div>
            </div>

            {/* Card 3: Attendance table */}
            <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-slate-100/50 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
                    <svg className="w-6 h-6 mr-3 text-[#3b62ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Relevé de présence
                  </h2>
                  <p className="text-sm font-medium text-slate-400 mt-1">
                    Cliquez sur <span className="font-bold text-slate-600">Voir</span> pour consulter ou corriger un pointage journalier.
                  </p>
                </div>
              </div>

              {/* Loading state */}
              {loadingSummaries ? (
                <div className="flex items-center justify-center py-16">
                  <svg className="animate-spin w-8 h-8 text-[#3b62ad]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="ml-3 text-slate-500 font-medium">Chargement des pointages…</span>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6">Type de journée</th>
                        <th className="py-4 px-6">Source</th>
                        <th className="py-4 px-6">Statut</th>
                        <th className="py-4 px-6">Créneaux</th>
                        <th className="py-4 px-6">Durée totale</th>
                        <th className="py-4 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {summaries.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-slate-400 font-semibold">
                            Aucun pointage trouvé.
                          </td>
                        </tr>
                      ) : (
                        summaries.map((summary, idx) => {
                          // Active pointage rule (single source of truth)
                          const activePointage = summary.corrigeePointage ?? summary.brutPointage;
                          if (!activePointage) return null;

                          const dur = calcDayDuration(activePointage.creneaux);
                          const slotsCount = activePointage.creneaux?.length ?? 0;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              {/* Date */}
                              <td className="py-4 px-6 font-bold text-slate-800">
                                {activePointage.date}
                              </td>

                              {/* Day type */}
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${dayTypeBadgeClass(activePointage.dayType)}`}>
                                  {activePointage.dayType || 'PRESENCE'}
                                </span>
                              </td>

                              {/* Source / Origine */}
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${origineBadgeClass(activePointage.origineDonnees)}`}>
                                  {activePointage.origineDonnees === 'CORRIGEE' ? '✏ CORRIGEE' : 'BRUT'}
                                </span>
                              </td>

                              {/* Statut */}
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statutBadgeClass(activePointage.statut)}`}>
                                  {activePointage.statut}
                                </span>
                              </td>

                              {/* Creneaux count */}
                              <td className="py-4 px-6 font-semibold text-slate-700">
                                {slotsCount} {slotsCount > 1 ? 'créneaux' : 'créneau'}
                              </td>

                              {/* Duration */}
                              <td className="py-4 px-6 font-extrabold text-[#3b62ad]">{dur}</td>

                              {/* Action */}
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => handleOpenModal(summary)}
                                  className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-[#3b62ad] hover:text-white text-slate-700 font-bold text-xs transition-colors shadow-sm"
                                >
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Voir
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Footer: Soumettre ──────────────────────────────────────── */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Status info */}
                <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  {allSubmitted ? (
                    <>
                      <svg className="w-4 h-4 mr-2 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Tous les pointages ont été soumis. En attente de validation par l'administrateur.</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Vérifiez et corrigez vos pointages, puis cliquez sur <span className="font-bold">Soumettre</span>.</span>
                    </>
                  )}
                </div>

                {/* Soumettre button */}
                <button
                  type="button"
                  onClick={handleSoumettre}
                  disabled={!canSubmit}
                  title={allSubmitted ? 'Déjà soumis' : !canSubmit ? 'Aucun pointage à soumettre' : ''}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 transition-all ${
                    canSubmit
                      ? 'bg-[#3b62ad] text-white hover:bg-[#3b62ad]/90 shadow-md shadow-[#3b62ad]/20'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-80'
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Soumission…</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Soumettre</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Correction modal ─────────────────────────────────────────────── */}
        <AttendanceCorrectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          summary={selectedSummary}
          onSaved={handleCorrectionSaved}
        />

        {/* ── Image Viewer Modal ────────────────────────────────────────────── */}
        <ImageViewerModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          loadImage={() => imagePointageService.getImageContent(imageId)}
          title={`Image originale${imageName ? ' — ' + imageName : ''}`}
        />

        {/* ── Toast ────────────────────────────────────────────────────────── */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      </div>
    </PrestataireDashboardLayout>
  );
};

export default ImportPointage;
