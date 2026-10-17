import React, { useState, useMemo } from 'react';
import AutocompleteField from '../ui/AutocompleteField';
import MultiSelectField from '../ui/MultiSelectField';

/**
 * Formulaire de création d'une affectation.
 * Utilise AutocompleteField pour la sélection du prestataire et MultiSelectField pour les tâches.
 *
 * Props :
 *  - prestataires : array of { id, nomComplet?, prenom?, nom }
 *  - taches       : array of { id, nom }
 *  - onSubmit(data) : appelé avec { prestataireId: Number, tacheIds: Array<Number> }
 *  - onCancel()
 *  - loading      : boolean
 */
const AffectationForm = ({ prestataires = [], taches = [], onSubmit, onCancel, loading = false }) => {
  const [selectedPrestataireId, setSelectedPrestataireId] = useState(null);
  const [selectedTacheIds, setSelectedTacheIds] = useState([]);

  // Map raw data to the { id, label } shape expected by AutocompleteField / MultiSelectField
  const prestataireOptions = useMemo(
    () =>
      prestataires
        .filter((p) => p.actif)
        .map((p) => ({
          id: p.id,
          label: p.nomComplet || `${p.prenom} ${p.nom}`,
        })),
    [prestataires]
  );

  const tacheOptions = useMemo(
    () =>
      taches
        .filter((t) => t.actif)
        .map((t) => ({
          id: t.id,
          label: t.nom,
        })),
    [taches]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPrestataireId || selectedTacheIds.length === 0) return;
    onSubmit({
      prestataireId: Number(selectedPrestataireId),
      tacheIds: selectedTacheIds.map(Number),
    });
  };

  const isValid = selectedPrestataireId !== null && selectedTacheIds.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Prestataire */}
        <AutocompleteField
          id="affectation-prestataire"
          label="Prestataire"
          options={prestataireOptions}
          value={selectedPrestataireId}
          onChange={setSelectedPrestataireId}
          placeholder="Sélectionner un prestataire"
          required
        />

        {/* Tâches */}
        <MultiSelectField
          id="affectation-taches"
          label="Tâches"
          options={tacheOptions}
          value={selectedTacheIds}
          onChange={setSelectedTacheIds}
          placeholder="Sélectionner des tâches"
          required
        />
      </div>

      <div className="pt-4 flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || !isValid}
          className="px-6 py-3 rounded-xl font-medium text-white bg-[#3b62ad] hover:bg-[#30508d] transition-colors focus:outline-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          Créer les affectations
        </button>
      </div>
    </form>
  );
};


export default AffectationForm;
