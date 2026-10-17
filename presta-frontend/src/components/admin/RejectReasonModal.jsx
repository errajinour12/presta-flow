import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

const RejectReasonModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [motifRejet, setMotifRejet] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMotifRejet('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motifRejet.trim()) {
      setError('Veuillez saisir un motif de rejet obligatoirement.');
      return;
    }
    setError('');
    onSubmit(motifRejet.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rejeter la soumission de pointage">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Motif du rejet <span className="text-red-500">*</span>
          </label>
          <textarea
            rows="4"
            value={motifRejet}
            onChange={(e) => {
              setMotifRejet(e.target.value);
              if (error) setError('');
            }}
            placeholder="Précisez la raison pour laquelle cette fiche de pointage est rejetée (ex: horaires incohérents, feuille illisible, etc.)..."
            className={`w-full p-4 rounded-xl border ${
              error ? 'border-red-300 bg-red-50/20' : 'border-slate-200 focus:border-[#3b62ad]'
            } text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 transition-all resize-none`}
            disabled={loading}
          />
          {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={loading || !motifRejet.trim()}
            className="btn-danger"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Traitement...</span>
              </>
            ) : (
              <span>Confirmer le rejet</span>
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
};

export default RejectReasonModal;
