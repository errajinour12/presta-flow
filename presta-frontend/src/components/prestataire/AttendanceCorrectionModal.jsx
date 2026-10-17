import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import imagePointageService from '../../services/imagePointageService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip seconds from "HH:mm:ss" -> "HH:mm" */
const toHHmm = (time) => {
  if (!time) return '';
  return time.slice(0, 5);
};

/** Compute duration in minutes between two "HH:mm" strings */
const slotMinutes = (entry, exit) => {
  if (!entry || !exit) return 0;
  try {
    const [eh, em] = entry.split(':').map(Number);
    const [xh, xm] = exit.split(':').map(Number);
    let diff = (xh * 60 + xm) - (eh * 60 + em);
    if (diff < 0) diff += 24 * 60;
    return diff;
  } catch {
    return 0;
  }
};

/** Format minutes as "Xh Ym" */
const formatMins = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
};

const totalDuration = (creneaux) => {
  const mins = (creneaux || []).reduce(
    (sum, c) => sum + slotMinutes(toHHmm(c.heureEntree), toHHmm(c.heureSortie)),
    0
  );
  return formatMins(mins);
};

// ---------------------------------------------------------------------------
// Statut / Origine badge helpers (matches app design system)
// ---------------------------------------------------------------------------

const statutBadge = (statut) => {
  switch (statut) {
    case 'EXTRAIT':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'EN_ATTENTE':
      return 'bg-blue-50 text-[#3b62ad] border-blue-200';
    case 'VALIDE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'REJETE':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-500 border-slate-200';
  }
};

const origineBadge = (origine) =>
  origine === 'CORRIGEE'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-500 border-slate-200';

const dayTypeBadge = (dayType) => {
  const t = (dayType || '').toUpperCase();
  if (t.includes('PRESENCE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (t.includes('CONGE') || t.includes('CONGÉ')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (t.includes('ABSENCE')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const DAY_TYPES = ['PRESENCE', 'ABSENCE', 'CONGE'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Read-only time-slots table */
const SlotsTable = ({ creneaux }) => {
  if (!creneaux || creneaux.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-semibold text-slate-500">Aucun créneau horaire pour cette journée.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <th className="py-3 px-4">#</th>
            <th className="py-3 px-4">Heure d'entrée</th>
            <th className="py-3 px-4">Heure de sortie</th>
            <th className="py-3 px-4">Durée</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
          {creneaux.map((c, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3.5 px-4 font-bold text-slate-400">{i + 1}</td>
              <td className="py-3.5 px-4 font-semibold text-slate-800">{toHHmm(c.heureEntree) || '-'}</td>
              <td className="py-3.5 px-4 font-semibold text-slate-800">{toHHmm(c.heureSortie) || '-'}</td>
              <td className="py-3.5 px-4 text-[#3b62ad] font-bold">
                {formatMins(slotMinutes(toHHmm(c.heureEntree), toHHmm(c.heureSortie)))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * AttendanceCorrectionModal
 *
 * Props:
 *   isOpen       {boolean}
 *   onClose      {() => void}
 *   summary      {DailyAttendanceSummaryResponse | null}
 *   onSaved      {() => Promise<void>}  called after a successful save (parent refreshes summaries)
 */
const AttendanceCorrectionModal = ({ isOpen, onClose, summary, onSaved }) => {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Edit-form state
  const [dayType, setDayType] = useState('');
  const [creneaux, setCreneaux] = useState([]);

  // Active pointage rule (single source of truth for display: CORRIGEE ?? BRUT)
  const activePointage = summary?.corrigeePointage ?? summary?.brutPointage;

  // Editable rule:
  // • No CORRIGEE exists -> editable if brutPointage.statut === 'EXTRAIT' (disabled if EN_ATTENTE/VALIDE/REJETE)
  // • CORRIGEE exists    -> follow corrigeePointage.editable (true = EXTRAIT, false = submitted/locked)
  const editable = summary?.corrigeePointage == null
    ? summary?.brutPointage?.statut === 'EXTRAIT'
    : summary?.corrigeePointage?.editable === true;

  // Seed edit form when entering edit mode
  const enterEditMode = useCallback(() => {
    if (!activePointage) return;
    setDayType(activePointage.dayType || 'PRESENCE');
    setCreneaux(
      (activePointage.creneaux || []).map((c, i) => ({
        heureEntree: toHHmm(c.heureEntree),
        heureSortie: toHHmm(c.heureSortie),
        ordre: c.ordre ?? i + 1,
      }))
    );
    setError(null);
    setEditMode(true);
  }, [activePointage]);

  // Reset to read mode when modal closes or summary changes
  useEffect(() => {
    if (!isOpen) {
      setEditMode(false);
      setError(null);
    }
  }, [isOpen]);

  // Creneau helpers
  const addCreneau = () =>
    setCreneaux((prev) => [...prev, { heureEntree: '', heureSortie: '', ordre: prev.length + 1 }]);

  const removeCreneau = (index) =>
    setCreneaux((prev) => prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, ordre: i + 1 })));

  const updateCreneau = (index, field, value) =>
    setCreneaux((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));

  // Save handler
  const handleSave = async () => {
    setError(null);
    if (!summary?.brutPointage?.id) {
      setError('Pointage BRUT introuvable.');
      return;
    }

    // Validate creneaux
    for (let i = 0; i < creneaux.length; i++) {
      const c = creneaux[i];
      if (!c.heureEntree || !c.heureSortie) {
        setError(`Le créneau ${i + 1} est incomplet. Veuillez saisir l'heure d'entrée et de sortie.`);
        return;
      }
    }

    const payload = {
      brutPointageId: summary.brutPointage.id,
      dayType,
      creneaux: creneaux.map((c, i) => ({
        heureEntree: c.heureEntree,
        heureSortie: c.heureSortie,
        ordre: i + 1,
      })),
    };

    try {
      setSaving(true);
      await imagePointageService.saveCorrection(payload);
      await onSaved();       // parent refreshes summaries
      setEditMode(false);    // return to read mode
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Guard
  if (!summary || !activePointage) return null;

  const dur = totalDuration(activePointage.creneaux);
  const slotsCount = activePointage.creneaux?.length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pointage du ${activePointage.date}`}
    >
      <div className="space-y-6">

        {/* Overview banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Jour & Type</span>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-base font-bold text-slate-800">{activePointage.date}</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${dayTypeBadge(activePointage.dayType)}`}>
                {activePointage.dayType || 'PRESENCE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Origine pill */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${origineBadge(activePointage.origineDonnees)}`}>
              {activePointage.origineDonnees === 'CORRIGEE' ? '✏ CORRIGEE' : 'BRUT'}
            </span>

            {/* Statut pill */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statutBadge(activePointage.statut)}`}>
              {activePointage.statut}
            </span>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Créneaux</span>
              <span className="text-base font-extrabold text-slate-800">{slotsCount}</span>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Durée</span>
              <span className="text-base font-extrabold text-[#3b62ad]">{dur}</span>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* READ MODE                                                          */}
        {/* ------------------------------------------------------------------ */}
        {!editMode && (
          <>
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                Créneaux horaires
              </h3>
              <SlotsTable creneaux={activePointage.creneaux} />
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              {/* Locked message: shown whenever pointage is not editable (submitted/validated/rejected) */}
              {!editable && (
                <div className="flex items-center text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <svg className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pointage soumis — aucune modification possible.
                </div>
              )}

              <div className="flex items-center space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={() => enterEditMode()}
                  disabled={!editable}
                  title={!editable ? 'Ce pointage ne peut plus être modifié.' : 'Créer ou modifier la correction pour ce jour'}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center transition-colors ${
                    editable
                      ? 'bg-[#f0f4f8] text-[#3b62ad] hover:bg-[#3b62ad] hover:text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modifier
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#3b62ad] text-white hover:bg-[#3b62ad]/90 transition-colors shadow-sm"
                >
                  Fermer
                </button>
              </div>
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* EDIT MODE                                                          */}
        {/* ------------------------------------------------------------------ */}
        {editMode && (
          <>
            {/* Creneaux editor */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Créneaux horaires
                </h3>
                <button
                  type="button"
                  onClick={addCreneau}
                  className="flex items-center text-xs font-bold text-[#3b62ad] hover:text-[#3b62ad]/80 bg-[#f0f4f8] hover:bg-[#e8edf7] px-3 py-1.5 rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Ajouter un créneau
                </button>
              </div>

              {creneaux.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-400">Aucun créneau. Cliquez sur « Ajouter un créneau ».</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 px-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-7">#</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entrée</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sortie</span>
                    <span className="w-8" />
                  </div>

                  {creneaux.map((c, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3"
                    >
                      {/* Index */}
                      <span className="text-sm font-bold text-slate-400 w-7">{i + 1}</span>

                      {/* Heure d'entrée */}
                      <input
                        type="time"
                        value={c.heureEntree}
                        onChange={(e) => updateCreneau(i, 'heureEntree', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/30 focus:border-[#3b62ad]"
                      />

                      {/* Heure de sortie */}
                      <input
                        type="time"
                        value={c.heureSortie}
                        onChange={(e) => updateCreneau(i, 'heureSortie', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/30 focus:border-[#3b62ad]"
                      />

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeCreneau(i)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer ce créneau"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Running total */}
                  {creneaux.length > 0 && (
                    <div className="text-right text-sm font-bold text-[#3b62ad] pr-4 pt-1">
                      Durée totale : {formatMins(
                        creneaux.reduce((sum, c) => sum + slotMinutes(c.heureEntree, c.heureSortie), 0)
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setEditMode(false); setError(null); }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-[#3b62ad] text-white hover:bg-[#3b62ad]/90 transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Enregistrement…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default AttendanceCorrectionModal;
