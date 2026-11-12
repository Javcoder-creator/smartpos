import React from 'react';
import { Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarStore } from '@/store/sidebarStore';

export const MainLayout: React.FC = () => {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div
        className={clsx(
          'flex-1 flex flex-col transition-all duration-300',
          isCollapsed ? 'ml-[72px]' : 'ml-64'
        )}
      >
        <Header />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
