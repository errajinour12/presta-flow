import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import authService from '../../services/authService';

const ProfileModal = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Erreur lors du chargement du profil :', err);
      setError('Impossible de charger les informations de votre profil.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getInitial = () => {
    if (profile?.prenom) return profile.prenom.charAt(0).toUpperCase();
    if (profile?.nomComplet) return profile.nomComplet.charAt(0).toUpperCase();
    if (profile?.email) return profile.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mon Profil">
      {loading ? (
        <div className="space-y-6 animate-pulse py-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
          {error}
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Header Banner with Avatar & Name */}
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3b62ad] flex items-center justify-center font-bold text-xl flex-shrink-0 border border-blue-100">
              {getInitial()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {profile.nomComplet || `${profile.prenom || ''} ${profile.nom || ''}`.trim() || 'Utilisateur'}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={profile.role === 'ADMIN' ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#3b62ad] border border-blue-200/60' : 'badge-neutral'}>
                  {profile.role === 'ADMIN' ? 'Administrateur' : 'Prestataire'}
                </span>
                {profile.actif !== undefined && (
                  <span className={profile.actif ? 'badge-success' : 'badge-error'}>
                    {profile.actif ? 'Actif' : 'Inactif'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Nom */}
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Nom</span>
              <p className="font-bold text-slate-700">{profile.nom || '-'}</p>
            </div>

            {/* Prénom */}
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Prénom</span>
              <p className="font-bold text-slate-700">{profile.prenom || '-'}</p>
            </div>

            {/* Email */}
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 md:col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Email</span>
              <p className="font-bold text-slate-700">{profile.email || '-'}</p>
            </div>

            {/* Matricule */}
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Matricule</span>
              <p className="font-bold text-slate-700">{profile.matricule || '-'}</p>
            </div>

            {/* Rôle */}
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Rôle système</span>
              <p className="font-bold text-slate-700">{profile.role || '-'}</p>
            </div>

            {/* Spécifique Prestataire: Date de naissance */}
            {profile.dateNaissance && (
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date de naissance</span>
                <p className="font-bold text-slate-700">{formatDate(profile.dateNaissance)}</p>
              </div>
            )}

            {/* Spécifique Prestataire: Date d'embauche */}
            {profile.dateEmbauche && (
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date d'embauche</span>
                <p className="font-bold text-slate-700">{formatDate(profile.dateEmbauche)}</p>
              </div>
            )}

            {/* Spécifique Prestataire: Admin Référent */}
            {profile.adminNomComplet && (
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 md:col-span-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Administrateur référent</span>
                <p className="font-bold text-slate-700">{profile.adminNomComplet}</p>
              </div>
            )}

            {/* Date de création du compte */}
            {profile.createdAt && (
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 md:col-span-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Compte créé le</span>
                <p className="font-medium text-slate-600">{formatDate(profile.createdAt)}</p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ProfileModal;
