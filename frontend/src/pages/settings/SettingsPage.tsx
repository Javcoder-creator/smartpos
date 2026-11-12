import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  CreditCard,
  Building,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Save,
  Barcode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Feedback';
import api from '@/lib/axios';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'billing' | 'store' | 'hardware'>('billing');

  // Store form state
  const [storeName, setStoreName] = useState('SmartPOS Do‘koni');
  const [storePhone, setStorePhone] = useState('+998 71 200 00 00');
  const [receiptFooter, setReceiptFooter] = useState('Xaridingiz uchun rahmat! Yana kutib qolamiz.');
  const [receiptWidth, setReceiptWidth] = useState<'58mm' | '80mm'>('80mm');

  // 1. Fetch Current Subscription & Quota Usage
  const { data: subData, isLoading: isSubLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/current');
      return res.data.data;
    },
  });

  // 2. Fetch Available Plans for upgrade
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['available-plans'],
    queryFn: async () => {
      const res = await api.get('/subscriptions/plans');
      return res.data.data;
    },
  });

  // 3. Upgrade Plan Mutation
  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await api.post('/subscriptions/upgrade', {
        planId,
        billingCycle: 'monthly',
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast.success('Tarif rejangiz muvaffaqiyatli yangilandi!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Tarifni yangilashda xatolik');
    },
  });

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Do‘kon sozlamalari muvaffaqiyatli saqlandi');
  };

  const usage = subData?.usage || {
    branches: { current: 1, max: 1 },
    products: { current: 0, max: 100 },
    warehouses: { current: 1, max: 1 },
    cashiers: { current: 1, max: 1 },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tizim sozlamalari</h1>
          <p className="text-sm text-gray-500 mt-1">
            SaaS obunasi, do‘kon parametrlari va kassa uskunalari integratsiyasi
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'billing'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Obuna va Tariflar (Billing)
        </button>
        <button
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'store'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Do‘kon parametrlari
        </button>
        <button
          onClick={() => setActiveTab('hardware')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'hardware'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Printer va Skaner uskunalari
        </button>
      </div>

      {/* TAB 1: Billing & Subscription */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan Card */}
          <Card className="p-6 bg-gradient-to-r from-[#1e3a5f] to-[#2a4d7d] text-white shadow-md border-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Joriy faol obunangiz
                </span>
                <h2 className="text-3xl font-black mt-1">
                  {subData?.plan?.name || 'START'} tarifi
                </h2>
                <p className="text-xs text-gray-300 mt-1">
                  Holat: <strong>{subData?.subscription?.status?.toUpperCase()}</strong> | Qolgan muddat:{' '}
                  <strong>{subData?.daysLeft || 0} kun</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-300">Oylik to‘lov:</span>
                <div className="text-2xl font-black text-white">
                  {Number(subData?.plan?.monthlyPrice || 0).toLocaleString()} UZS
                </div>
              </div>
            </div>

            {/* Quota Progress Indicators */}
            <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-gray-300">Filiallar:</span>
                <div className="text-sm font-bold mt-0.5">
                  {usage.branches.current} / {usage.branches.max}
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (usage.branches.current / usage.branches.max) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-300">Tovarlar limiti:</span>
                <div className="text-sm font-bold mt-0.5">
                  {usage.products.current} / {usage.products.max}
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (usage.products.current / usage.products.max) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-300">Kassirlar:</span>
                <div className="text-sm font-bold mt-0.5">
                  {usage.cashiers.current} / {usage.cashiers.max}
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (usage.cashiers.current / usage.cashiers.max) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-300">Omborlar:</span>
                <div className="text-sm font-bold mt-0.5">
                  {usage.warehouses.current} / {usage.warehouses.max}
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (usage.warehouses.current / usage.warehouses.max) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Upgrade Plans Grid */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">
              Tarifni oshirish (Upgrade Plan)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((p: any) => {
                const isCurrent = subData?.plan?.id === p.id;
                return (
                  <Card
                    key={p.id}
                    className={`p-5 border flex flex-col justify-between transition ${
                      isCurrent
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-black text-gray-900">{p.name}</h4>
                        {isCurrent && <Badge variant="success">Joriy tarif</Badge>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{p.description || 'SaaS tarifi'}</p>

                      <div className="my-4">
                        <span className="text-xl font-black text-gray-900">
                          {Number(p.monthlyPrice).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400"> UZS / oy</span>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-600 border-t pt-3">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{p.maxBranches} ta filial</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{p.maxCashiers} ta kassa / kassir</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{p.maxProducts.toLocaleString()} ta tovar</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{p.maxWarehouses} ta ombor</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <Button
                        size="sm"
                        disabled={isCurrent}
                        onClick={() => upgradeMutation.mutate(p.id)}
                        isLoading={upgradeMutation.isPending}
                        className={`w-full text-xs font-bold ${
                          isCurrent
                            ? 'bg-gray-100 text-gray-400 hover:bg-gray-100'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isCurrent ? 'Faol tarif' : 'Ushbu tarifga o‘tish'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Store Settings */}
      {activeTab === 'store' && (
        <Card title="Asosiy do‘kon ma’lumotlari" className="max-w-xl">
          <form onSubmit={handleSaveStoreSettings} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Do‘kon / Savdo tarmog‘i nomi</label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Aloqa telefoni</label>
              <Input
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Valyuta</label>
                <Input value="UZS (So‘m)" disabled className="bg-gray-100 font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Vaqt mintaqasi</label>
                <Input value="Asia/Tashkent (UTC+5)" disabled className="bg-gray-100 font-semibold" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Chek osti matni (Footer)</label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full text-xs rounded-lg border border-gray-300 p-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="gap-1.5 text-xs">
                <Save className="w-4 h-4" />
                Sozlamalarni saqlash
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: Hardware Integration */}
      {activeTab === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Thermal Receipt Printer Settings */}
          <Card title="Termo chek printeri" subtitle="Chek formati va chop etish parametrlari">
            <div className="space-y-4 pt-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 block">Printer qog‘oz kengligi:</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: '80mm', label: '80mm (Standart kassa lentalari)' },
                    { id: '58mm', label: '58mm (Kichik ko‘chma printerlar)' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setReceiptWidth(w.id as any)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                        receiptWidth === w.id
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-1 ring-emerald-500'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                <p className="font-semibold text-gray-800">Brauzer orqali to‘g‘ridan-to‘g‘ri chop etish:</p>
                <p className="mt-1">
                  Har qanday USB yoki Tarmoq (LAN/Wi-Fi) orqali ulangan termo chek printeri brauzer dialogi orqali chop etishni qo‘llab-quvvatlaydi.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="gap-1.5 text-xs"
              >
                <Printer className="w-4 h-4" />
                Sinov chekini chop etish (Test Print)
              </Button>
            </div>
          </Card>

          {/* Barcode Scanner Settings */}
          <Card title="Shtrix-kod skaneri" subtitle="USB va Bluetooth skanerlar sozlamalari">
            <div className="space-y-4 pt-3 text-xs text-gray-600">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                <Barcode className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                <div>
                  <p className="font-bold">Avtomatik klaviatura rejimi (HID/KBD)</p>
                  <p className="mt-0.5 text-[11px]">
                    Barcha USB shtrix-kod skanerlari drayversiz ulanadi va Enter belgisi orqali tovarlarni savatchaga tezkor qo‘shadi.
                  </p>
                </div>
              </div>

              <p className="text-gray-500">
                Qo‘shimcha sozlash talab qilinmaydi. POS modulida qidiruv maydoni doimiy faol holatda saqlanadi.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
