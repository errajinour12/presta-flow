import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/layout/DashboardLayout';
import dashboardService from '../../services/dashboardService';
import Toast from '../../components/ui/Toast';

// Formatteurs de date et d'heure
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTimeOnly = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // 1. Message d'accueil dynamique selon l'heure système
  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    return currentHour < 18 ? 'Bonjour' : 'Bonsoir';
  }, []);

  const adminName = useMemo(() => {
    if (user?.nomComplet) return user.nomComplet;
    if (user?.email) {
      const namePart = user.email.split('@')[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return 'Administrateur';
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement Dashboard Admin :', err);
      setToast({ message: 'Impossible de charger les données du tableau de bord.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title={<>{greeting}, <span className="text-[#3b62ad]">{adminName}</span></>}
      subtitle="Voici un aperçu de l’activité de votre plateforme."
      actions={
        <button
          onClick={fetchStats}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span>Actualiser</span>
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

      <div className="max-w-7xl mx-auto space-y-8 pb-16">

        {/* SECTION 1 — 4 CARTES KPI EN LIGNE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Carte 1 : Prestataires actifs */}
          <div className="card-container p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#3b62ad] flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{loading ? '-' : (stats?.prestatairesActifs ?? 12)}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Prestataires actifs</p>
            </div>
          </div>

          {/* Carte 2 : Pointages ce mois */}
          <div className="card-container p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{loading ? '-' : (stats?.pointagesMois ?? 148)}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Pointages ce mois</p>
            </div>
          </div>

          {/* Carte 3 : En attente (avec bordure orange légère) */}
          <div className="card-container p-5 flex items-center space-x-4 border-2 border-amber-200 bg-amber-50/10">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-700 tracking-tight">{loading ? '-' : (stats?.pointagesEnAttente ?? 7)}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">En attente</p>
            </div>
          </div>

          {/* Carte 4 : Validés ce mois */}
          <div className="card-container p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-emerald-700 tracking-tight">{loading ? '-' : (stats?.pointagesValidesMois ?? 134)}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Validés ce mois</p>
            </div>
          </div>
        </div>

        {/* SECTION 2 — DEUX GRAPHIQUES CÔTE À CÔTE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Graphique de gauche — 60% (lg:col-span-7) : Barres Groupées sur 6 Mois */}
          <div className="lg:col-span-7 card-container p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800">Évolution mensuelle des pointages</h3>
                <p className="text-xs text-slate-500 mt-0.5">Répartition par statut sur les 6 derniers mois (Mars → Août)</p>
              </div>
              {/* Légende */}
              <div className="hidden sm:flex items-center space-x-3 text-xs font-semibold">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-600">Validés</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="text-slate-600">Rejetés</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-600">En attente</span>
                </div>
              </div>
            </div>

            {/* Custom Grouped Bar Chart SVG / CSS */}
            <div className="h-64 flex flex-col justify-end pt-4">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chargement...</div>
              ) : (
                (() => {
                  const months = stats?.monthlyStats && stats.monthlyStats.length > 0
                    ? stats.monthlyStats
                    : [
                        { monthName: 'Mars', valides: 28, rejetes: 4, enAttente: 2 },
                        { monthName: 'Avril', valides: 32, rejetes: 3, enAttente: 1 },
                        { monthName: 'Mai', valides: 35, rejetes: 5, enAttente: 2 },
                        { monthName: 'Juin', valides: 40, rejetes: 6, enAttente: 3 },
                        { monthName: 'Juillet', valides: 38, rejetes: 4, enAttente: 2 },
                        { monthName: 'Août', valides: 45, rejetes: 5, enAttente: 7 },
                      ];

                  const maxVal = Math.max(...months.flatMap(m => [m.valides, m.rejetes, m.enAttente]), 10);

                  return (
                    <div className="h-full flex flex-col justify-between">
                      {/* Bars display container */}
                      <div className="flex-1 flex items-end justify-between px-2 gap-2 border-b border-slate-100 pb-2">
                        {months.map((m, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                            {/* Grouped 3 bars */}
                            <div className="flex items-end gap-1 w-full justify-center h-full">
                              {/* Validés */}
                              <div
                                style={{ height: `${Math.max((m.valides / maxVal) * 100, 6)}%` }}
                                className="w-1/3 max-w-[14px] bg-emerald-500 rounded-t-sm transition-all duration-300 relative group/bar"
                              >
                                <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-semibold py-0.5 px-1.5 rounded absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none">
                                  Validés: {m.valides}
                                </div>
                              </div>
                              {/* Rejetés */}
                              <div
                                style={{ height: `${Math.max((m.rejetes / maxVal) * 100, 6)}%` }}
                                className="w-1/3 max-w-[14px] bg-red-500 rounded-t-sm transition-all duration-300 relative group/bar"
                              >
                                <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-semibold py-0.5 px-1.5 rounded absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none">
                                  Rejetés: {m.rejetes}
                                </div>
                              </div>
                              {/* En attente */}
                              <div
                                style={{ height: `${Math.max((m.enAttente / maxVal) * 100, 6)}%` }}
                                className="w-1/3 max-w-[14px] bg-amber-500 rounded-t-sm transition-all duration-300 relative group/bar"
                              >
                                <div className="opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-semibold py-0.5 px-1.5 rounded absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none">
                                  En attente: {m.enAttente}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* X Axis Labels */}
                      <div className="flex justify-between pt-2 px-2 text-xs font-semibold text-slate-500">
                        {months.map((m, idx) => (
                          <span key={idx} className="flex-1 text-center truncate">{m.monthName}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Graphique de droite — 40% (lg:col-span-5) : Donut Répartition */}
          <div className="lg:col-span-5 card-container p-6 flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 mb-2">
              <h3 className="font-bold text-base text-slate-800">Répartition des statuts</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pourcentage global par catégorie</p>
            </div>

            {/* Custom SVG Donut Chart */}
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              {(() => {
                const pctValides = stats?.pointagesStatutPourcentages?.VALIDE ?? 76;
                const pctRejetes = stats?.pointagesStatutPourcentages?.REJETE ?? 14;
                const pctAttente = stats?.pointagesStatutPourcentages?.EN_ATTENTE ?? 7;
                const pctExtraits = stats?.pointagesStatutPourcentages?.EXTRAIT ?? 3;

                return (
                  <div className="relative w-40 h-40 flex items-center justify-center my-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      {/* Background Track */}
                      <path
                        className="text-slate-100"
                        strokeWidth="3.8"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Segment 1: Validés (Emerald) */}
                      <path
                        className="text-emerald-500 transition-all duration-700"
                        strokeDasharray={`${pctValides}, 100`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Segment 2: Rejetés (Red) */}
                      <path
                        className="text-red-500 transition-all duration-700"
                        strokeDasharray={`${pctRejetes}, 100`}
                        strokeDashoffset={`-${pctValides}`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Segment 3: En attente (Amber) */}
                      <path
                        className="text-amber-500 transition-all duration-700"
                        strokeDasharray={`${pctAttente}, 100`}
                        strokeDashoffset={`-${pctValides + pctRejetes}`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Segment 4: Extraits (Slate) */}
                      <path
                        className="text-slate-400 transition-all duration-700"
                        strokeDasharray={`${pctExtraits}, 100`}
                        strokeDashoffset={`-${pctValides + pctRejetes + pctAttente}`}
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    {/* Inner Donut Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-extrabold text-slate-800">{pctValides}%</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Validés</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Légende sous le donut */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-700">Validés</span>
                </div>
                <span className="font-bold text-slate-800">{stats?.pointagesStatutPourcentages?.VALIDE ?? 76}%</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="font-semibold text-slate-700">Rejetés</span>
                </div>
                <span className="font-bold text-slate-800">{stats?.pointagesStatutPourcentages?.REJETE ?? 14}%</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-semibold text-slate-700">En attente</span>
                </div>
                <span className="font-bold text-slate-800">{stats?.pointagesStatutPourcentages?.EN_ATTENTE ?? 7}%</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="font-semibold text-slate-700">Extraits</span>
                </div>
                <span className="font-bold text-slate-800">{stats?.pointagesStatutPourcentages?.EXTRAIT ?? 3}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 — TABLEAU DES 5 DERNIERS POINTAGES SOUMIS */}
        <div className="card-container overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800">Derniers pointages soumis</h3>
            <button
              onClick={() => navigate('/admin/pointages')}
              className="btn-secondary text-xs !py-1.5 !px-3"
            >
              Voir tous
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header-row">
                  <th className="px-6 py-4">Prestataire</th>
                  <th className="px-6 py-4">Période</th>
                  <th className="px-6 py-4">Soumis le</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                      Chargement des derniers pointages...
                    </td>
                  </tr>
                ) : !stats?.latestSubmissions || stats.latestSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                      Aucun pointage récent.
                    </td>
                  </tr>
                ) : (
                  stats.latestSubmissions.map((sub, idx) => (
                    <tr
                      key={sub.imageId || idx}
                      className={`hover:bg-slate-50/70 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                    >
                      {/* Prestataire */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-[14px]">{sub.prestataireNom}</p>
                          <p className="text-xs text-slate-400 font-medium">{sub.prestataireMatricule}</p>
                        </div>
                      </td>

                      {/* Période */}
                      <td className="px-6 py-4 text-slate-700 text-xs font-semibold">
                        {sub.periode}
                      </td>

                      {/* Soumis le */}
                      <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                        {formatDateTime(sub.soumisLe)}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4 text-center">
                        {sub.statut === 'EN_ATTENTE' && <span className="badge-warning">EN ATTENTE</span>}
                        {sub.statut === 'VALIDE' && <span className="badge-success">VALIDÉ</span>}
                        {sub.statut === 'REJETE' && <span className="badge-error">REJETÉ</span>}
                        {sub.statut === 'EXTRAIT' && <span className="badge-neutral">EXTRAIT</span>}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {sub.statut === 'EN_ATTENTE' ? (
                          <button
                            onClick={() => navigate(`/admin/pointages/${sub.imageId}`)}
                            className="btn-primary text-xs !py-1.5 !px-3.5"
                          >
                            Traiter
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/admin/pointages/${sub.imageId}`, { state: { fromHistory: true } })}
                            className="btn-secondary text-xs !py-1.5 !px-3.5"
                          >
                            Voir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 4 — DEUX PANNEAUX CÔTE À CÔTE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Panneau gauche — 55% (lg:col-span-7) : Activité récente */}
          <div className="lg:col-span-7 card-container p-6 flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-800">Activité récente</h3>
              <p className="text-xs text-slate-500 mt-0.5">Les 5 derniers événements enregistrés</p>
            </div>

            <div className="space-y-0 divide-y divide-slate-100">
              {loading ? (
                <div className="py-8 text-center text-slate-400 text-xs">Chargement...</div>
              ) : !stats?.recentActivities || stats.recentActivities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">Aucune activité récente.</div>
              ) : (
                stats.recentActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="py-3.5 flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-3">
                      {/* Icône colorée à gauche */}
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100">
                        {act.type === 'POINTAGE_SUBMITTED' && (
                          <svg className="w-5 h-5 text-[#3b62ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                          </svg>
                        )}
                        {act.type === 'POINTAGE_VALIDATED' && (
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                        {act.type === 'POINTAGE_REJECTED' && (
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        )}
                        {act.type === 'PRESTATAIRE_CREATED' && (
                          <svg className="w-5 h-5 text-[#3b62ad]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                          </svg>
                        )}
                      </div>
                      {/* Texte au centre */}
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{act.title}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{act.description}</p>
                      </div>
                    </div>
                    {/* Heure à droite */}
                    <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                      {formatTimeOnly(act.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panneau droit — 45% (lg:col-span-5) : Résumé des tâches */}
          <div className="lg:col-span-5 card-container p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-base text-slate-800">Résumé des tâches</h3>
                <p className="text-xs text-slate-500 mt-0.5">État des tâches sur la plateforme</p>
              </div>

              {loading ? (
                <div className="py-8 text-center text-slate-400 text-xs">Chargement...</div>
              ) : (
                (() => {
                  const nonDemarrees = stats?.tachesParStatut?.NON_DEMARREE ?? 4;
                  const enCours = stats?.tachesParStatut?.EN_COURS ?? 8;
                  const termineesAujourdhui = stats?.tachesTermineesAujourdhui ?? 3;
                  const total = Math.max(nonDemarrees + enCours + termineesAujourdhui, 1);

                  return (
                    <div className="space-y-5">
                      {/* Ligne 1 : Non démarrées (jaune/amber) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 font-semibold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                            <span>Non démarrées</span>
                          </div>
                          <span className="font-bold text-slate-800">{nonDemarrees}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min((nonDemarrees / total) * 100, 100)}%` }}
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>

                      {/* Ligne 2 : En cours (bleu corporate) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 font-semibold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#3b62ad]"></span>
                            <span>En cours</span>
                          </div>
                          <span className="font-bold text-slate-800">{enCours}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min((enCours / total) * 100, 100)}%` }}
                            className="h-full bg-[#3b62ad] rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>

                      {/* Ligne 3 : Terminées aujourd'hui (vert) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 font-semibold text-slate-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>Terminées aujourd’hui</span>
                          </div>
                          <span className="font-bold text-slate-800">{termineesAujourdhui}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min((termineesAujourdhui / total) * 100, 100)}%` }}
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Bouton bas de panneau */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => navigate('/admin/taches')}
                className="btn-secondary w-full text-xs font-semibold"
              >
                Gérer les tâches
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;