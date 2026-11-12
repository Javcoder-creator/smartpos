import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Users,
  Receipt,
  Wallet,
  BarChart3,
  UserCheck,
  Store,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Globe,
} from 'lucide-react';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation, Locale } from '@/i18n';

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggle } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: t('sidebar.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('sidebar.pos'), path: '/pos', icon: ShoppingCart, highlight: true },
    { label: t('sidebar.products'), path: '/products', icon: Package },
    { label: t('sidebar.inventory'), path: '/inventory', icon: Warehouse },
    { label: t('sidebar.purchases'), path: '/purchases', icon: Truck },
    { label: t('sidebar.customers'), path: '/customers', icon: Users },
    { label: t('sidebar.sales'), path: '/sales', icon: Receipt },
    { label: t('sidebar.finance'), path: '/finance', icon: Wallet },
    { label: t('sidebar.reports'), path: '/reports', icon: BarChart3 },
    { label: t('sidebar.employees'), path: '/employees', icon: UserCheck },
    { label: t('sidebar.branches'), path: '/branches', icon: Store },
    { label: t('sidebar.settings'), path: '/settings', icon: Settings },
  ];

  if (user?.role === 'super_admin') {
    navItems.push({ label: t('sidebar.superAdmin'), path: '/admin', icon: ShieldCheck });
  }

  const toggleLanguage = () => {
    const nextLocale: Locale = locale === 'uz' ? 'ru' : 'uz';
    setLocale(nextLocale);
  };

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 z-30 h-screen bg-[#1e3a5f] text-white flex flex-col transition-all duration-300 shadow-xl select-none',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#10b981] to-[#34d399] flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md">
              SP
            </div>
            <div className="truncate">
              <h1 className="font-bold text-base tracking-wide text-white">SMARTPOS</h1>
              <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">SaaS Platform</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#10b981] to-[#34d399] flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md">
              SP
            </div>
          </div>
        )}

        <button
          onClick={toggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={clsx(
            'p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors',
            isCollapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative',
                  isActive
                    ? 'bg-[#10b981] text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/10',
                  item.highlight && !isActive && 'text-emerald-300 hover:text-emerald-200'
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse button when collapsed */}
      {isCollapsed && (
        <div className="px-3 py-2 border-t border-white/10 flex justify-center">
          <button
            onClick={toggle}
            aria-label="Expand sidebar"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Profile */}
      <div className="p-3 border-t border-white/10 shrink-0 bg-[#152a45]">
        <div className={clsx('flex items-center gap-2', isCollapsed ? 'justify-center' : 'justify-between')}>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-gray-300 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={toggleLanguage}
              title="Tilni almashtirish / Сменить язык"
              className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center text-xs font-bold gap-0.5"
            >
              <Globe className="w-4 h-4" />
              {!isCollapsed && <span className="uppercase text-[10px]">{locale}</span>}
            </button>

            <button
              onClick={handleLogout}
              title={t('auth.logout')}
              className="p-1.5 rounded-lg text-red-300 hover:text-red-100 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
