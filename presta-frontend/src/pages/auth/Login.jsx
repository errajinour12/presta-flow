import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';





const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login({
                           email,
                           motDePasse: password
                         });
      if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user?.role === 'PRESTATAIRE') {
        navigate('/prestataire/dashboard');
      } else {
        setError('Role not recognized');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.erreur) {
        setError(err.response.data.erreur);
      } else {
        setError('Email ou mot de passe incorrect, ou erreur serveur.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6 font-sans text-slate-800">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">

        {/* Left Side */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <svg width="70" height="70" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 60,160 C 60,160 80,80 80,60 C 80,30 130,30 150,50 C 170,70 170,110 140,130 C 110,150 90,130 90,130 C 90,130 80,120 75,130 C 70,140 60,160 60,160 Z" fill="url(#paint0_linear)"/>
                <rect x="25" y="55" width="25" height="12" rx="6" fill="#759ce6"/>
                <rect x="15" y="75" width="30" height="12" rx="6" fill="#5078c5"/>
                <rect x="35" y="95" width="22" height="12" rx="6" fill="#365899"/>
                <rect x="45" y="115" width="15" height="12" rx="6" fill="#233a66"/>
                <defs>
                  <linearGradient id="paint0_linear" x1="70" y1="30" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#82a9f0"/>
                    <stop offset="0.5" stopColor="#436bb5"/>
                    <stop offset="1" stopColor="#1e345e"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#3b62ad] tracking-tight">PrestaFlow</h1>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-[#0f172a] leading-[1.1] tracking-tight">
            Gestion intelligente<br />des prestataires
          </h2>
        </div>

        {/* Right Side */}
        <div className="flex-1 w-full max-w-[480px]">
          <div className="bg-white rounded-[32px] p-8 sm:p-12 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
            <div className="text-center mb-10">
              <h3 className="text-[26px] font-bold text-[#74829b] mb-2 tracking-tight">Identifiez-vous</h3>
              <p className="text-[15px] text-slate-500 font-medium">Accédez à votre espace personnel</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <label className="block text-[15px] font-medium text-slate-700 ml-1">Entrez votre adresse e-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Adresse e-mail"
                  required
                  className="w-full px-6 py-4 bg-[#f1f5f9] border-2 border-transparent rounded-full focus:bg-white focus:border-[#3b62ad]/30 focus:ring-4 focus:ring-[#3b62ad]/10 focus:outline-none transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center ml-1 mr-1">
                  <label className="block text-[15px] font-medium text-slate-700">Mot de passe</label>
                  <a href="#" className="text-[13px] text-slate-400 font-medium hover:text-[#3b62ad] transition-colors"></a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-6 py-4 bg-[#f1f5f9] border-2 border-transparent rounded-full focus:bg-white focus:border-[#3b62ad]/30 focus:ring-4 focus:ring-[#3b62ad]/10 focus:outline-none transition-all placeholder:text-slate-400 text-slate-700 text-lg tracking-widest font-medium"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-[#4a6baf] hover:bg-[#3b62ad] text-white text-[17px] font-semibold rounded-full shadow-[0_8px_20px_rgb(59,98,173,0.25)] transition-all hover:shadow-[0_8px_25px_rgb(59,98,173,0.35)] active:scale-[0.98]"
                >
                  Se connecter
                </button>
              </div>
            </form>

            {/*<div className="mt-10 text-center">
              <p className="text-[14.5px] text-slate-600 font-medium">
                Nouveau sur la plateforme ? <a href="#" className="text-[#1e293b] hover:text-[#3b62ad] transition-colors hover:underline decoration-2 underline-offset-4">Créer un compte</a>
              </p>
            </div>*/}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
