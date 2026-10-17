import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PrestataireDashboardLayout from '../../components/layout/PrestataireDashboardLayout';
import dashboardService from '../../services/dashboardService';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState(30); // 7 or 30 days
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 18 ? 'Bonjour' : 'Bonsoir';
  }, []);

  const prestName = useMemo(() => {
    if (user?.nomComplet) return user.nomComplet;
    if (user?.email) {
      const part = user.email.split('@')[0];
      return part.charAt(0).toUpperCase() + part.slice(1);
    }
    return 'Prestataire';
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getPrestataireStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques prestataire :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Filter daily stats based on selected period (7 or 30 days)
  const chartData = useMemo(() => {
    if (!stats?.dailyStats) return [];
    return stats.dailyStats.slice(-chartPeriod);
  }, [stats, chartPeriod]);

  // Compute SVG line chart paths and points
  const chartGeometry = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;

    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 35, left: 40 };

    const maxVal = Math.max(...chartData.map((d) => d.total), 5);

    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const points = chartData.map((d, index) => {
      const x = padding.left + (index / (chartData.length - 1 || 1)) * innerWidth;
      const y = padding.top + innerHeight - (d.total / maxVal) * innerHeight;
      return { x, y, data: d };
    });

    // Create SVG path string
    const linePath = points.reduce((acc, point, i) => {
      return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, '');

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    // Horizontal grid lines (4 ticks)
    const gridTicks = [0, 0.33, 0.66, 1].map((ratio) => {
      const val = Math.round(maxVal * ratio);
      const y = padding.top + innerHeight - ratio * innerHeight;
      return { val, y };
    });

    return { width, height, padding, linePath, areaPath, points, gridTicks, maxVal };
  }, [chartData]);

  // Format date string for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return dateTimeStr;
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <PrestataireDashboardLayout
      title={<>{greeting}, <span className="text-[#3b62ad]">{prestName}</span></>}
      subtitle="Voici un aperçu synthétique de vos pointages et activités récentes."
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
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">

        {/* 1. 4 CARTES KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 : Pointages ce mois-ci */}
          <div className="card-container p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#3b62ad] flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {loading ? '-' : (stats?.pointagesMois ?? 0)}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Pointages ce mois-ci</p>
            </div>
          </div>

          {/* Card 2 : Pointages en attente */}
          <div className="card-container p-5 flex items-center space-x-4 border-2 border-amber-200 bg-amber-50/10">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-700 tracking-tight">
                {loading ? '-' : (stats?.pointagesEnAttente ?? 0)}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Pointages en attente</p>
            </div>
          </div>

          {/* Card 3 : Pointages validés */}
          <div className="card-container p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                {loading ? '-' : (stats?.pointagesValides ?? 0)}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Pointages validés</p>
            </div>
          </div>

          {/* Card 4 : Pointages rejetés */}
          <div className="card-container p-5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-red-600 tracking-tight">
                {loading ? '-' : (stats?.pointagesRejetes ?? 0)}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Pointages rejetés</p>
            </div>
          </div>
        </div>

        {/* 2. GRAPHIQUE PRINCIPAL (ÉVOLUTION DE VOS POINTAGES) */}
        <div className="card-container p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Évolution des pointages
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Nombre de pointages soumis par jour sur la période sélectionnée.
              </p>
            </div>

            {/* Toggle 7 vs 30 jours */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setChartPeriod(7)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === 7
                    ? 'bg-white text-[#3b62ad] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 derniers jours
              </button>
              <button
                onClick={() => setChartPeriod(30)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === 30
                    ? 'bg-white text-[#3b62ad] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                30 derniers jours
              </button>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full overflow-x-auto relative">
            {loading ? (
              <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm font-medium">
                Chargement du graphique...
              </div>
            ) : !chartGeometry || chartData.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm font-medium">
                Aucune donnée disponible pour cette période.
              </div>
            ) : (
              <div className="min-w-[600px] relative">
                <svg
                  viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                  className="w-full h-[240px] overflow-visible"
                >
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b62ad" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b62ad" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {chartGeometry.gridTicks.map((tick, idx) => (
                    <g key={idx}>
                      <line
                        x1={chartGeometry.padding.left}
                        y1={tick.y}
                        x2={chartGeometry.width - chartGeometry.padding.right}
                        y2={tick.y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartGeometry.padding.left - 8}
                        y={tick.y + 4}
                        fontSize="10"
                        fill="#94a3b8"
                        textAnchor="end"
                        fontWeight="600"
                      >
                        {tick.val}
                      </text>
                    </g>
                  ))}

                  {/* Area Fill */}
                  <path d={chartGeometry.areaPath} fill="url(#lineGradient)" />

                  {/* Line Path */}
                  <path
                    d={chartGeometry.linePath}
                    fill="none"
                    stroke="#3b62ad"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {chartGeometry.points.map((pt, i) => {
                    const showLabel =
                      chartPeriod === 7 ||
                      i === 0 ||
                      i === chartGeometry.points.length - 1 ||
                      i % Math.ceil(chartGeometry.points.length / 8) === 0;

                    return (
                      <g key={i}>
                        {/* Circle point */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint?.data?.fullDate === pt.data.fullDate ? '6' : '4'}
                          fill="#ffffff"
                          stroke="#3b62ad"
                          strokeWidth={hoveredPoint?.data?.fullDate === pt.data.fullDate ? '3' : '2'}
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />

                        {/* X Axis Date Label */}
                        {showLabel && (
                          <text
                            x={pt.x}
                            y={chartGeometry.height - 10}
                            fontSize="10"
                            fill="#64748b"
                            textAnchor="middle"
                            fontWeight="500"
                          >
                            {pt.data.date}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredPoint && (
                  <div
                    className="absolute bg-slate-900 text-white text-xs rounded-xl px-3 py-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 space-y-1"
                    style={{
                      left: `${(hoveredPoint.x / chartGeometry.width) * 100}%`,
                      top: `${(hoveredPoint.y / chartGeometry.height) * 100 - 12}px`,
                    }}
                  >
                    <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">
                      {hoveredPoint.data.date}
                    </p>
                    <p className="font-semibold text-white">
                      Total pointages : <span className="text-blue-400 font-extrabold">{hoveredPoint.data.total}</span>
                    </p>
                    {hoveredPoint.data.valides > 0 && (
                      <p className="text-emerald-400">Validés : {hoveredPoint.data.valides}</p>
                    )}
                    {hoveredPoint.data.enAttente > 0 && (
                      <p className="text-amber-400">En attente : {hoveredPoint.data.enAttente}</p>
                    )}
                    {hoveredPoint.data.rejetes > 0 && (
                      <p className="text-red-400">Rejetés : {hoveredPoint.data.rejetes}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. SECTION « MES TÂCHES » (3 PETITS COMPTEURS) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Mes tâches</h2>
            <button
              onClick={() => navigate('/prestataire/mes-taches')}
              className="text-xs font-semibold text-[#3b62ad] hover:text-[#30508d] transition-colors"
            >
              Voir toutes mes tâches &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Counter 1: Non démarrées */}
            <div className="card-container p-5 flex items-center justify-between group hover:border-slate-300 transition-all duration-200">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Non démarrées
                </p>
                <h3 className="text-3xl font-extrabold text-slate-700 tracking-tight">
                  {loading ? '-' : (stats?.tachesNonDemarrees ?? 0)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>

            {/* Counter 2: En cours */}
            <div className="card-container p-5 flex items-center justify-between group hover:border-[#3b62ad]/40 transition-all duration-200">
              <div>
                <p className="text-xs font-bold text-[#3b62ad] uppercase tracking-wider mb-1">
                  En cours
                </p>
                <h3 className="text-3xl font-extrabold text-[#3b62ad] tracking-tight">
                  {loading ? '-' : (stats?.tachesEnCours ?? 0)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#3b62ad]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>

            {/* Counter 3: Terminées */}
            <div className="card-container p-5 flex items-center justify-between group hover:border-emerald-300 transition-all duration-200">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Terminées
                </p>
                <h3 className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {loading ? '-' : (stats?.tachesTerminees ?? 0)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 4. SECTION « DERNIÈRES ACTIVITÉS » */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Dernières activités</h2>
            <button
              onClick={() => navigate('/prestataire/pointages')}
              className="text-xs font-semibold text-[#3b62ad] hover:text-[#30508d] transition-colors"
            >
              Historique des pointages &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Activity 1: Dernier pointage soumis */}
            <div className="card-container p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3b62ad] flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                </div>
                <span className="badge-warning">Soumis</span>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dernier pointage soumis
                </p>
                {loading ? (
                  <p className="text-sm text-slate-400 mt-1">Chargement...</p>
                ) : stats?.dernierPointageSoumis ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {stats.dernierPointageSoumis.nomFichier || `Pointage #${stats.dernierPointageSoumis.id}`}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Date pointage : <span className="font-semibold text-slate-700">{stats.dernierPointageSoumis.datePointage}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-1">Aucun pointage soumis récemment.</p>
                )}
              </div>

              {stats?.dernierPointageSoumis && (
                <p className="text-[11px] text-slate-400 font-medium border-t border-slate-100 pt-2">
                  Action : {formatDateTime(stats.dernierPointageSoumis.dateAction)}
                </p>
              )}
            </div>

            {/* Activity 2: Dernier pointage traité (validé / rejeté) */}
            <div className="card-container p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stats?.dernierPointageTraite?.statut === 'VALIDE'
                    ? 'bg-emerald-50 text-emerald-600'
                    : stats?.dernierPointageTraite?.statut === 'REJETE'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                {stats?.dernierPointageTraite ? (
                  <span className={stats.dernierPointageTraite.statut === 'VALIDE' ? 'badge-success' : 'badge-error'}>
                    {stats.dernierPointageTraite.statut === 'VALIDE' ? 'Validé' : 'Rejeté'}
                  </span>
                ) : (
                  <span className="badge-neutral">-</span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dernier pointage traité
                </p>
                {loading ? (
                  <p className="text-sm text-slate-400 mt-1">Chargement...</p>
                ) : stats?.dernierPointageTraite ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {stats.dernierPointageTraite.nomFichier || `Pointage #${stats.dernierPointageTraite.id}`}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Date : <span className="font-semibold text-slate-700">{stats.dernierPointageTraite.datePointage}</span>
                    </p>
                    {stats.dernierPointageTraite.motifRejet && (
                      <p className="text-xs text-red-600 font-medium line-clamp-1">
                        Motif : {stats.dernierPointageTraite.motifRejet}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-1">Aucun pointage traité à ce jour.</p>
                )}
              </div>

              {stats?.dernierPointageTraite && (
                <p className="text-[11px] text-slate-400 font-medium border-t border-slate-100 pt-2">
                  Traité le : {formatDateTime(stats.dernierPointageTraite.dateAction)}
                </p>
              )}
            </div>

            {/* Activity 3: Dernière tâche affectée */}
            <div className="card-container p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                {stats?.derniereTacheAffectee ? (
                  <span className={
                    stats.derniereTacheAffectee.statut === 'TERMINEE'
                      ? 'badge-success'
                      : stats.derniereTacheAffectee.statut === 'EN_COURS'
                      ? 'badge-warning'
                      : 'badge-neutral'
                  }>
                    {stats.derniereTacheAffectee.statut === 'TERMINEE'
                      ? 'Terminée'
                      : stats.derniereTacheAffectee.statut === 'EN_COURS'
                      ? 'En cours'
                      : 'Non démarrée'}
                  </span>
                ) : (
                  <span className="badge-neutral">-</span>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dernière tâche affectée
                </p>
                {loading ? (
                  <p className="text-sm text-slate-400 mt-1">Chargement...</p>
                ) : stats?.derniereTacheAffectee ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {stats.derniereTacheAffectee.nomTache}
                    </p>
                    {stats.derniereTacheAffectee.categorie && (
                      <p className="text-xs text-slate-500 font-medium">
                        Catégorie : <span className="font-semibold text-slate-700">{stats.derniereTacheAffectee.categorie}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-1">Aucune tâche affectée récemment.</p>
                )}
              </div>

              {stats?.derniereTacheAffectee && (
                <p className="text-[11px] text-slate-400 font-medium border-t border-slate-100 pt-2">
                  Affectée le : {formatDateTime(stats.derniereTacheAffectee.dateAffectation)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PrestataireDashboardLayout>
  );
};

export default Dashboard;