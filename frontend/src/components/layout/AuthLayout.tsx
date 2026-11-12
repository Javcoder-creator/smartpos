import React from 'react';
import { Outlet } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useTranslation, Locale } from '@/i18n';

export const AuthLayout: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  const toggleLanguage = () => {
    const nextLocale: Locale = locale === 'uz' ? 'ru' : 'uz';
    setLocale(nextLocale);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#152a45] via-[#1e3a5f] to-[#0d1b2a] flex flex-col justify-center items-center p-4 relative">
      {/* Top language switch */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="uppercase">{locale}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#10b981] to-[#34d399] items-center justify-center font-black text-white text-xl shadow-lg mb-3">
            SP
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">SMARTPOS</h1>
          <p className="text-xs text-emerald-400 font-medium tracking-wider uppercase mt-0.5">
            Professional SaaS POS Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-white/10">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} SMARTPOS Uzbekistan. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </div>
  );
};
