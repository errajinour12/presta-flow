import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ProfileModal from '../profile/ProfileModal';
import ChangePasswordModal from '../profile/ChangePasswordModal';

const UserDropdown = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const getInitial = () => {
    if (user?.nomComplet) return user.nomComplet.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const displayName = user?.nomComplet || (user?.email ? user.email.split('@')[0] : 'Utilisateur');
  const roleLabel = user?.role === 'ADMIN' ? 'Administrateur' : 'Prestataire';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Card Trigger Button */}
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="flex items-center space-x-3 bg-white pl-3.5 pr-4 py-2 rounded-full shadow-sm border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3b62ad] flex items-center justify-center font-bold text-sm flex-shrink-0 border border-blue-100/80">
          {getInitial()}
        </div>

        <div className="hidden sm:block text-left">
          <p className="text-[13px] font-bold text-slate-700 leading-tight truncate max-w-[140px]">
            {displayName}
          </p>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
            {roleLabel}
          </p>
        </div>

        {/* Chevron Icon */}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isDropdownOpen ? 'transform rotate-180 text-[#3b62ad]' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.08)] border border-slate-100 py-2 z-50 animate-fade-in text-sm">
          {/* User info header inside dropdown */}
          <div className="px-4 py-2.5 border-b border-slate-50">
            <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 font-medium truncate">{user?.email}</p>
          </div>

          <div className="py-1">
            {/* Option 1 : Mon profil */}
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="w-full text-left px-4 py-2.5 flex items-center space-x-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Mon profil</span>
            </button>

            {/* Option 2 : Modifier le mot de passe */}
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsChangePasswordModalOpen(true);
              }}
              className="w-full text-left px-4 py-2.5 flex items-center space-x-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Modifier le mot de passe</span>
            </button>
          </div>

          <div className="border-t border-slate-100 my-1" />

          {/* Option 3 : Déconnexion */}
          <div className="py-0.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 flex items-center space-x-3 text-red-600 hover:bg-red-50/80 transition-colors font-semibold cursor-pointer"
            >
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default UserDropdown;
