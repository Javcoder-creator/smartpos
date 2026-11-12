import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { BranchesPage } from '@/pages/branches/BranchesPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { PurchasesPage } from '@/pages/purchases/PurchasesPage';
import { SuppliersPage } from '@/pages/suppliers/SuppliersPage';
import { POSPage } from '@/pages/pos/POSPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { SalesPage } from '@/pages/sales/SalesPage';
import { FinancePage } from '@/pages/finance/FinancePage';
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
            element: <POSPage />,
          },
          {
            path: '/products',
            element: <ProductsPage />,
          },
          {
            path: '/branches',
            element: <BranchesPage />,
          },
          {
            path: '/inventory',
            element: <InventoryPage />,
          },
          {
            path: '/purchases',
            element: <PurchasesPage />,
          },
          {
            path: '/suppliers',
            element: <SuppliersPage />,
          },
          {
            path: '/customers',
            element: <CustomersPage />,
          },
          {
            path: '/sales',
            element: <SalesPage />,
          },
          {
            path: '/finance',
            element: <FinancePage />,
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
