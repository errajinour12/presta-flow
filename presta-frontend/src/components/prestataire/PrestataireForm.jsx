import React, { useState, useEffect } from 'react';

const PrestataireForm = ({ initialData = null, onSubmit, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    matricule: '',
    motDePasse: '',
    dateNaissance: '',
    dateEmbauche: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nom: initialData.nom || '',
        prenom: initialData.prenom || '',
        email: initialData.email || '',
        matricule: initialData.matricule || '',
        motDePasse: '********', // Valeur fictive pour la modification
        dateNaissance: initialData.dateNaissance || '',
        dateEmbauche: initialData.dateEmbauche || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Prénom */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Prénom</label>
          <input
            type="text"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad]/50 transition-all"
            placeholder="Ex: Youssef"
          />
        </div>

        {/* Nom */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Nom</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad]/50 transition-all"
            placeholder="Ex: Benjelloun"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad]/50 transition-all"
            placeholder="nom.prenom@email.com"
          />
        </div>

        {/* Matricule */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Matricule</label>
          <input
            type="text"
            name="matricule"
            value={formData.matricule}
            onChange={handleChange}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad]/50 transition-all"
            placeholder="Ex: PRESTA001"
          />
        </div>

        {/* Date de naissance */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Date de Naissance</label>
          <input
            type="date"
            name="dateNaissance"
            value={formData.dateNaissance}
            onChange={handleChange}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad]/50 transition-all"
          />
        </div>

        {/* Date d'embauche */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Date de début de mission</label>
          <input
            type="date"
            name="dateEmbauche"
            value={formData.dateEmbauche}
            onChange={handleChange}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad]/50 transition-all"
          />
        </div>

        {/* Mot de passe */}
        {!initialData && (
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700">Mot de passe provisoire</label>
            <input
              type="password"
              name="motDePasse"
              value={formData.motDePasse}
              onChange={handleChange}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20 focus:border-[#3b62ad]/50 transition-all"
              placeholder="Mot de passe"
            />
          </div>
        )}
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
          disabled={loading}
          className="px-6 py-3 rounded-xl font-medium text-white bg-[#3b62ad] hover:bg-[#30508d] transition-colors focus:outline-none flex items-center"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {initialData ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
};

export default PrestataireForm;
