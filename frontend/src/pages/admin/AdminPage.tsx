import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Unlock,
  CreditCard,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

export const AdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'businesses' | 'plans'>('businesses');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedBusinessForSub, setSelectedBusinessForSub] = useState<any>(null);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<any>(null);

  // Sub Form
  const [subFormPlanId, setSubFormPlanId] = useState('');
  const [subFormMonths, setSubFormMonths] = useState(1);
  const [subFormBilling, setSubFormBilling] = useState<'monthly' | 'annual'>('monthly');

  // Plan Edit Form
  const [planForm, setPlanForm] = useState({
    name: '',
    monthlyPrice: 0,
    annualPrice: 0,
    maxBranches: 1,
    maxCashiers: 1,
    maxProducts: 100,
    maxWarehouses: 1,
  });

  // 1. Fetch Super Admin Stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.data;
    },
  });

  // 2. Fetch Businesses List
  const { data: businessRes, isLoading: isBusinessesLoading } = useQuery({
    queryKey: ['admin-businesses', search, statusFilter, page],
    queryFn: async () => {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/businesses', { params });
      return res.data;
    },
  });

  const businesses: any[] = businessRes?.data || [];

  // 3. Fetch Pricing Plans
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const res = await api.get('/admin/plans');
      return res.data.data;
    },
  });

  // 4. Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.put(`/admin/businesses/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(data.message || 'Holat yangilandi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  // 5. Change Subscription Mutation
  const changeSubMutation = useMutation({
    mutationFn: async ({ businessId, payload }: any) => {
      const res = await api.put(`/admin/businesses/${businessId}/subscription`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Korxona obunasi muvaffaqiyatli uzaytirildi');
      setSelectedBusinessForSub(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Obunani o‘zgartirishda xatolik');
    },
  });

  // 6. Update Plan Mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, payload }: any) => {
      const res = await api.put(`/admin/plans/${planId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Tarif narxi va limitlari yangilandi');
      setSelectedPlanForEdit(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Tarifni yangilashda xatolik');
    },
  });

  const openSubModal = (b: any) => {
    setSelectedBusinessForSub(b);
    setSubFormPlanId(b.subscription?.planId || plans[0]?.id || '');
    setSubFormMonths(1);
    setSubFormBilling('monthly');
  };

  const openPlanEditModal = (p: any) => {
    setSelectedPlanForEdit(p);
    setPlanForm({
      name: p.name,
      monthlyPrice: Number(p.monthlyPrice),
      annualPrice: Number(p.annualPrice),
      maxBranches: p.maxBranches,
      maxCashiers: p.maxCashiers,
      maxProducts: p.maxProducts,
      maxWarehouses: p.maxWarehouses,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-700 rounded-xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Super Admin Paneli</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              SMARTPOS SaaS platforma boshqaruvi, korxonalar va obuna tariflari
            </p>
          </div>
        </div>
      </div>

      {/* Platform KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Jami korxonalar</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalBusinesses || 0} ta</h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-2">
            <span className="text-emerald-600 font-bold">{stats?.activeBusinesses || 0} faol</span>
            <span>•</span>
            <span className="text-rose-600 font-bold">{stats?.suspendedBusinesses || 0} bloklangan</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Foydalanuvchilar</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalUsers || 0} ta</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-gray-400">Platformadagi barcha faol akkauntlar</div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">SaaS Obuna tushumi</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-1">
                {Number(stats?.totalSubscriptionRevenue || 0).toLocaleString()} UZS
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-gray-500">
            {stats?.subscriptions?.active || 0} ta faol obunachi
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Jami savdo hajmi</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">
                {Number(stats?.totalSalesVolume || 0).toLocaleString()} UZS
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-gray-400">
            {stats?.totalSalesCount || 0} ta kassa cheki orqali
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'businesses'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Barcha korxonalar (Tenants)
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'plans'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Obuna tarif rejalari (Pricing Plans)
        </button>
      </div>

      {/* TAB 1: Businesses List */}
      {activeTab === 'businesses' && (
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Nomi, email, telefon yoki slug bo‘yicha..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs font-medium rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="">Barcha holatlar</option>
                <option value="active">Faqat faollar</option>
                <option value="suspended">Faqat bloklanganlar</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {isBusinessesLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : businesses.length === 0 ? (
            <EmptyState
              title="Korxonalar topilmadi"
              description="Qidiruv parametrlari bo‘yicha hech qanday korxona topilmadi"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/75 text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Korxona</th>
                    <th className="py-3.5 px-4">Obuna tarifi</th>
                    <th className="py-3.5 px-4">Filiallar / Xodimlar</th>
                    <th className="py-3.5 px-4 text-center">Akkaunt holati</th>
                    <th className="py-3.5 px-4">Ro‘yxatdan o‘tgan</th>
                    <th className="py-3.5 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {businesses.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{b.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          ID: {b.slug} | {b.email || b.phone || 'Aloqa yo‘q'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="info">
                          {b.subscription?.plan?.name || 'START'} ({b.subscription?.status || 'trial'})
                        </Badge>
                        {b.subscription?.endDate && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            Gacha: {new Date(b.subscription.endDate).toLocaleDateString('uz-UZ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {b.branches?.length || 1} ta filial / {b.users?.length || 1} ta xodim
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={b.isActive ? 'success' : 'danger'}>
                          {b.isActive ? 'Faol' : 'Bloklangan'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-400 font-mono">
                        {new Date(b.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSubModal(b)}
                            className="h-8 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                          >
                            Obuna
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newStatus = !b.isActive;
                              if (confirm(`Ushbu korxonani ${newStatus ? 'faollashtirasizmi' : 'bloklaysizmi'}?`)) {
                                toggleStatusMutation.mutate({ id: b.id, isActive: newStatus });
                              }
                            }}
                            className={`h-8 text-xs ${
                              b.isActive
                                ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {b.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: Pricing Plans */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan: any) => (
            <Card key={plan.id} className="p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">{plan.name}</h3>
                  <Badge variant="success">Tartib: {plan.sortOrder}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{plan.description || 'SaaS tarif rejasi'}</p>

                <div className="my-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">Oylik to‘lov:</span>
                  <div className="text-xl font-black text-emerald-600">
                    {Number(plan.monthlyPrice).toLocaleString()} UZS
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Yillik: {Number(plan.annualPrice).toLocaleString()} UZS
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span>Maks. Filiallar:</span>
                    <strong className="text-gray-900">{plan.maxBranches} ta</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Maks. Kassirlar:</span>
                    <strong className="text-gray-900">{plan.maxCashiers} ta</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Maks. Tovar turlari:</span>
                    <strong className="text-gray-900">{plan.maxProducts.toLocaleString()} ta</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Maks. Omborlar:</span>
                    <strong className="text-gray-900">{plan.maxWarehouses} ta</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPlanEditModal(plan)}
                  className="w-full text-xs gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Tarifni tahrirlash
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Change / Extend Tenant Subscription */}
      <Modal
        isOpen={!!selectedBusinessForSub}
        onClose={() => setSelectedBusinessForSub(null)}
        title={`Obunani uzaytirish: ${selectedBusinessForSub?.name || ''}`}
      >
        {selectedBusinessForSub && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              changeSubMutation.mutate({
                businessId: selectedBusinessForSub.id,
                payload: {
                  planId: subFormPlanId,
                  billingCycle: subFormBilling,
                  months: Number(subFormMonths) || 1,
                  status: 'active',
                },
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Tarif rejasi *</label>
              <select
                value={subFormPlanId}
                onChange={(e) => setSubFormPlanId(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 p-2.5 bg-white outline-none focus:border-blue-500"
                required
              >
                {plans.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {Number(p.monthlyPrice).toLocaleString()} UZS/oy
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Muddat (Oy)</label>
              <Input
                type="number"
                min="1"
                max="36"
                value={subFormMonths}
                onChange={(e) => setSubFormMonths(Number(e.target.value))}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedBusinessForSub(null)}>
                Bekor qilish
              </Button>
              <Button type="submit" isLoading={changeSubMutation.isPending}>
                Obunani saqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Edit Pricing Plan */}
      <Modal
        isOpen={!!selectedPlanForEdit}
        onClose={() => setSelectedPlanForEdit(null)}
        title={`Tarifni tahrirlash: ${selectedPlanForEdit?.name || ''}`}
      >
        {selectedPlanForEdit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePlanMutation.mutate({
                planId: selectedPlanForEdit.id,
                payload: planForm,
              });
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Oylik narx (UZS)</label>
              <Input
                type="number"
                value={planForm.monthlyPrice}
                onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Yillik narx (UZS)</label>
              <Input
                type="number"
                value={planForm.annualPrice}
                onChange={(e) => setPlanForm({ ...planForm, annualPrice: Number(e.target.value) })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Maks. Filiallar</label>
                <Input
                  type="number"
                  value={planForm.maxBranches}
                  onChange={(e) => setPlanForm({ ...planForm, maxBranches: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Maks. Kassirlar</label>
                <Input
                  type="number"
                  value={planForm.maxCashiers}
                  onChange={(e) => setPlanForm({ ...planForm, maxCashiers: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Maks. Tovarlar</label>
                <Input
                  type="number"
                  value={planForm.maxProducts}
                  onChange={(e) => setPlanForm({ ...planForm, maxProducts: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Maks. Omborlar</label>
                <Input
                  type="number"
                  value={planForm.maxWarehouses}
                  onChange={(e) => setPlanForm({ ...planForm, maxWarehouses: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedPlanForEdit(null)}>
                Bekor qilish
              </Button>
              <Button type="submit" isLoading={updatePlanMutation.isPending}>
                Saqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
