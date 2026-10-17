import React, { useState, useEffect } from 'react';
import { TASK_CATEGORIES, CATEGORY_LABELS } from '../../utils/constants';

/**
 * Formulaire utilisé dans l'admin pour créer ou mettre à jour une tâche.
 * Fields: nom, description, categorie.
 */
const TaskForm = ({ initialData = null, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    categorie: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.nom || '',
        description: initialData.description || '',
        categorie: initialData.categorie || ''
      });
    } else {
      setFormData({ nom: '', description: '', categorie: '' });
    }
  }, [initialData]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Nom</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Ex: Réparer serveur"
          />
        </div>
        {/* Catégorie */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Catégorie</label>
          <select
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            required
            className="select-field"
          >
            <option value="">Sélectionner une catégorie</option>
            {TASK_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </div>
        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="input-field resize-none"
            placeholder="Détails de la tâche"
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {initialData ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>

    </form>
  );
};

export default TaskForm;
