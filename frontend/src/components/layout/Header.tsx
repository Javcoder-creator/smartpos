import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ShoppingCart, Store } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/i18n';

export const Header: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Store / Branch Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
          <Store className="w-4 h-4 text-[#10b981]" />
          <span>{user?.businessName || 'SMARTPOS Do‘kon'}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Quick POS button */}
        <Link to="/pos">
          <Button variant="accent" size="sm" leftIcon={<ShoppingCart className="w-4 h-4" />}>
            {t('sidebar.pos')}
          </Button>
        </Link>

        {/* Notifications */}
        <button
          aria-label="Bildirishnomalar"
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-xs">
            {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-gray-800 leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
