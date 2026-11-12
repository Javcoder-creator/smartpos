import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Card } from '@/components/ui/Card';

// Generic module placeholder for upcoming phases
const ModulePlaceholder = ({ title, desc }: { title: string; desc: string }) => (
  <div className="space-y-4">
    <Card title={title} subtitle={desc}>
      <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <h4 className="text-sm font-semibold text-gray-800">{title} moduli</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Ushbu modul keyingi bosqichda to‘liq funksional shaklda ulanadi.
        </p>
      </div>
    </Card>
  </div>
);

export const router = createBrowserRouter([
  // Public auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Protected app routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          {
            path: '/pos',
            element: (
              <ModulePlaceholder
                title="POS Kassa moduli"
                desc="Tezkor kassa checkout, shtrix-kod skaneri, chek chop etish va to‘lovlar"
              />
            ),
          },
          {
            path: '/products',
            element: (
              <ModulePlaceholder
                title="Mahsulotlar katalogi"
                desc="Kategoriya, brend, SKU, shtrix-kod va tovarlar bazasi"
              />
            ),
          },
          {
            path: '/inventory',
            element: (
              <ModulePlaceholder
                title="Omborxona va qoldiqlar"
                desc="Ko‘p omborli hisob, harakatlar daftari va inventarizatsiya"
              />
            ),
          },
          {
            path: '/purchases',
            element: (
              <ModulePlaceholder
                title="Kirim va Xaridlar"
                desc="Yetkazib beruvchilar va kirim fakturalari boshqaruvi"
              />
            ),
          },
          {
            path: '/customers',
            element: (
              <ModulePlaceholder
                title="Mijozlar (CRM)"
                desc="Mijozlar bazasi, sodiqlik ballari va qarz daftari"
              />
            ),
          },
          {
            path: '/sales',
            element: (
              <ModulePlaceholder
                title="Sotuvlar tarixi"
                desc="Barcha amalga oshirilgan tranzaksiyalar va cheklar"
              />
            ),
          },
          {
            path: '/finance',
            element: (
              <ModulePlaceholder
                title="Moliya va Kassa"
                desc="Kassa smenalari, xarajatlar va foyda-zarar tahlili"
              />
            ),
          },
          {
            path: '/reports',
            element: (
              <ModulePlaceholder
                title="Hisobotlar va Tahlil"
                desc="Savdo, tovar va rentabellik bo‘yicha batafsil hisobotlar"
              />
            ),
          },
          {
            path: '/employees',
            element: (
              <ModulePlaceholder
                title="Xodimlar va rollar"
                desc="Kassirlar, menejerlar va ularning ruxsatnomalari"
              />
            ),
          },
          {
            path: '/settings',
            element: (
              <ModulePlaceholder
                title="Tizim sozlamalari"
                desc="Do‘kon parametrlari, chek formati va fiskal sozlamalar"
              />
            ),
          },
          {
            path: '/admin',
            element: (
              <ModulePlaceholder
                title="Super Admin Paneli"
                desc="SaaS obunalar, barcha korxonalar va platforma ko‘rsatkichlari"
              />
            ),
          },
        ],
      },
    ],
  },

  // 404 Catch-all
  { path: '*', element: <NotFoundPage /> },
]);
