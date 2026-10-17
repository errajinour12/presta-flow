import React from 'react';
import { NavLink } from 'react-router-dom';
import UserDropdown from './UserDropdown';

const PrestataireDashboardLayout = ({ children, title, subtitle, badge, actions, headerContent }) => {
  return (
    <div className="h-screen bg-[#f8fafc] flex font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] h-screen bg-white border-r border-slate-100 hidden md:flex flex-col flex-shrink-0 rounded-tr-[24px] rounded-br-[24px] shadow-[4px_0_24px_rgb(0,0,0,0.02)] z-10">
        <div className="h-[88px] flex items-center px-8 border-b border-slate-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg width="34" height="34" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 60,160 C 60,160 80,80 80,60 C 80,30 130,30 150,50 C 170,70 170,110 140,130 C 110,150 90,130 90,130 C 90,130 80,120 75,130 C 70,140 60,160 60,160 Z" fill="url(#paint0_linear_layout_prestataire)"/>
                <rect x="25" y="55" width="25" height="12" rx="6" fill="#759ce6"/>
                <rect x="15" y="75" width="30" height="12" rx="6" fill="#5078c5"/>
                <rect x="35" y="95" width="22" height="12" rx="6" fill="#365899"/>
                <rect x="45" y="115" width="15" height="12" rx="6" fill="#233a66"/>
                <defs>
                  <linearGradient id="paint0_linear_layout_prestataire" x1="70" y1="30" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#82a9f0"/>
                    <stop offset="0.5" stopColor="#436bb5"/>
                    <stop offset="1" stopColor="#1e345e"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-[22px] font-bold text-[#3b62ad] tracking-tight">PrestaFlow</span>
          </div>
        </div>

        <nav className="flex-1 py-7 px-5 space-y-1.5 overflow-y-auto min-h-0">
          <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Espace Prestataire</div>

          <NavLink
            to="/prestataire/dashboard"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] rounded-2xl transition-colors ${
                isActive
                  ? 'font-semibold bg-[#f0f4f8] text-[#3b62ad]'
                  : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Dashboard
          </NavLink>

          <NavLink
            to="/prestataire/mes-taches"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] rounded-2xl transition-colors ${
                isActive
                  ? 'font-semibold bg-[#f0f4f8] text-[#3b62ad]'
                  : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            Mes Tâches
          </NavLink>

          <NavLink
            to="/prestataire/import-pointage"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] rounded-2xl transition-colors ${
                isActive
                  ? 'font-semibold bg-[#f0f4f8] text-[#3b62ad]'
                  : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Import Pointage
          </NavLink>

          <NavLink
            to="/prestataire/pointages"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] rounded-2xl transition-colors ${
                isActive
                  ? 'font-semibold bg-[#f0f4f8] text-[#3b62ad]'
                  : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Mes Pointages
          </NavLink>

          <NavLink
            to="/prestataire/rapports"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] rounded-2xl transition-colors ${
                isActive
                  ? 'font-semibold bg-[#f0f4f8] text-[#3b62ad]'
                  : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Générer Rapport
          </NavLink>

          <NavLink
            to="/prestataire/mes-rapports"
            className={({ isActive }) =>
              `flex items-center px-4 py-3.5 text-[15px] rounded-2xl transition-colors ${
                isActive
                  ? 'font-semibold bg-[#f0f4f8] text-[#3b62ad]'
                  : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Mes Rapports
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-[88px] flex-shrink-0 bg-[#f8fafc]/80 backdrop-blur-md flex items-center justify-between px-10 sticky top-0 z-20">
          {/* Left Title / Header Content */}
          <div className="flex-1 min-w-0 pr-6">
            {headerContent ? (
              headerContent
            ) : title ? (
              <div className="flex flex-col justify-center">
                <div className="flex items-center space-x-3">
                  <div className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight truncate">
                    {title}
                  </div>
                  {badge}
                </div>
                {subtitle && (
                  <p className="text-xs md:text-sm text-slate-500 font-medium truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Right Header Items */}
          <div className="flex items-center space-x-4 shrink-0">
            {actions && <div className="flex items-center space-x-3">{actions}</div>}
            <UserDropdown />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto px-10 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PrestataireDashboardLayout;
