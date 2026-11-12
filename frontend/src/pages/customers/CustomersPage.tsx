import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Edit2,
  Trash2,
  Award,
  CreditCard,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

interface CustomerItem {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  balance: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [selectedCustomerForDebt, setSelectedCustomerForDebt] = useState<CustomerItem | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayMethod, setRepayMethod] = useState<'cash' | 'card'>('cash');
  const [repayNotes, setRepayNotes] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  // 1. Fetch Customers
  const { data: customers = [], isLoading } = useQuery<CustomerItem[]>({
    queryKey: ['customers-list', search],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { search: search || undefined } });
      return res.data.data;
    },
  });

  // 2. Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/customers', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(editingCustomer ? 'Mijoz ma’lumotlari yangilandi' : 'Yangi mijoz qo‘shildi');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  // 3. Record Debt Repayment
  const debtPaymentMutation = useMutation({
    mutationFn: async ({ id, amount, method, notes }: any) => {
      const res = await api.post(`/finance/customers/${id}/debt-payment`, { amount, method, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Qarz to‘lovi muvaffaqiyatli qabul qilindi');
      setIsDebtModalOpen(false);
      setSelectedCustomerForDebt(null);
      setRepayAmount('');
      setRepayNotes('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Qarz to‘lovini qabul qilishda xatolik');
    },
  });

  // 4. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/customers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      toast.success('Mijoz o‘chirildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'O‘chirish imkoni bo‘lmadi');
    },
  });

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: CustomerItem) => {
    setEditingCustomer(c);
    setFormData({
      firstName: c.firstName,
      lastName: c.lastName || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const openDebtModal = (c: CustomerItem) => {
    setSelectedCustomerForDebt(c);
    setRepayAmount(String(c.balance > 0 ? c.balance : ''));
    setIsDebtModalOpen(true);
  };

  // Stats
  const totalDebt = customers.reduce((acc, c) => acc + (c.balance > 0 ? Number(c.balance) : 0), 0);
  const totalPoints = customers.reduce((acc, c) => acc + Number(c.loyaltyPoints || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mijozlar (CRM)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mijozlar bazasi, sodiqlik ballari va qarzdorliklar hisobi
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2 shadow-sm text-xs">
          <Plus className="w-4 h-4" />
          Yangi mijoz qo‘shish
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Jami mijozlar soni</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">{customers.length} ta</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Mijozlarning jami qarzi</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">
                {totalDebt.toLocaleString()} UZS
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Sodiqlik ballari fondi</p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">{totalPoints.toLocaleString()} ball</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm">
        {/* Search Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Ism, familiya yoki telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Mijozlar: <span className="text-gray-900 font-bold">{customers.length}</span>
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="Mijozlar topilmadi"
            description="Tizimda hali mijozlar yo‘q yoki qidiruv natijasi bo‘sh"
            action={
              <Button onClick={openCreateModal} size="sm">
                + Yangi qo‘shish
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mijoz</th>
                  <th className="py-3.5 px-4">Telefon</th>
                  <th className="py-3.5 px-4">Sodiqlik ballari</th>
                  <th className="py-3.5 px-4">Qarzdorlik</th>
                  <th className="py-3.5 px-4">Ro‘yxatdan o‘tgan</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      {c.firstName} {c.lastName || ''}
                      {c.address && (
                        <div className="text-[11px] text-gray-400 font-normal flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {c.address}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-xs text-gray-800 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Award className="w-3 h-3 mr-1" />
                        {Number(c.loyaltyPoints || 0).toLocaleString()} ball
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {Number(c.balance) > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {Number(c.balance).toLocaleString()} UZS qarz
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600">Qarzi yo‘q</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {Number(c.balance) > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDebtModal(c)}
                            className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            title="Qarzni to‘lash"
                          >
                            <DollarSign className="w-3.5 h-3.5 mr-1" />
                            Qarz to‘lovi
                          </Button>
                        )}
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${c.firstName}" mijozini o‘chirishni xohlaysizmi?`)) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="O‘chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Create/Edit Customer */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCustomer ? 'Mijoz ma’lumotlarini tahrirlash' : 'Yangi mijoz qo‘shish'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!formData.firstName || !formData.phone) {
              toast.error('Ism va telefon raqam kiritilishi shart');
              return;
            }
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Ismi *</label>
              <Input
                placeholder="Masalan: Dilshod"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Familiyasi</label>
              <Input
                placeholder="Masalan: Qodirov"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Telefon raqam *</label>
              <Input
                placeholder="+998 90 123 45 67"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Email</label>
              <Input
                type="email"
                placeholder="mijoz@pochta.uz"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Manzil</label>
              <Input
                placeholder="Shahar, tuman, ko‘cha..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Qayd va eslatmalar</label>
              <textarea
                rows={2}
                placeholder="Mijoz haqida qo‘shimcha eslatmalar..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-xs rounded-lg border border-gray-300 p-2.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Debt Repayment */}
      <Modal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setSelectedCustomerForDebt(null);
        }}
        title="Mijoz qarzini to‘lash"
      >
        {selectedCustomerForDebt && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Number(repayAmount);
              if (!amt || amt <= 0) {
                toast.error('Musbat summa kiriting');
                return;
              }
              debtPaymentMutation.mutate({
                id: selectedCustomerForDebt.id,
                amount: amt,
                method: repayMethod,
                notes: repayNotes,
              });
            }}
            className="space-y-4"
          >
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs text-amber-800">
                <span className="font-semibold">{selectedCustomerForDebt.firstName} {selectedCustomerForDebt.lastName || ''}</span> ning
                joriy qarzi:
              </div>
              <div className="text-lg font-bold text-amber-900 mt-1">
                {Number(selectedCustomerForDebt.balance).toLocaleString()} UZS
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">To‘lanayotgan summa (UZS) *</label>
              <Input
                type="number"
                min="1"
                placeholder="Masalan: 50000"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">To‘lov usuli</label>
              <select
                value={repayMethod}
                onChange={(e) => setRepayMethod(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-gray-300 p-2.5 bg-white outline-none focus:border-blue-500"
              >
                <option value="cash">Naqd pul</option>
                <option value="card">Plastik karta (Terminal)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Izoh</label>
              <Input
                placeholder="Masalan: Qarzning bir qismi to‘landi"
                value={repayNotes}
                onChange={(e) => setRepayNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDebtModalOpen(false);
                  setSelectedCustomerForDebt(null);
                }}
              >
                Bekor qilish
              </Button>
              <Button type="submit" isLoading={debtPaymentMutation.isPending}>
                To‘lovni qabul qilish
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
