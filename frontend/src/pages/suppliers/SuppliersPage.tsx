import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Edit2,
  Trash2,
  CreditCard,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  balance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
}

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    notes: '',
  });

  // 1. Fetch suppliers
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers', search],
    queryFn: async () => {
      const res = await api.get('/suppliers', { params: { search: search || undefined } });
      return res.data.data;
    },
  });

  // 2. Create or Update mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      if (editingSupplier) {
        const res = await api.put(`/suppliers/${editingSupplier.id}`, payload);
        return res.data;
      } else {
        const res = await api.post('/suppliers', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(editingSupplier ? 'Ta’minotchi yangilandi' : 'Yangi ta’minotchi qo‘shildi');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  // 3. Record Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const res = await api.post(`/suppliers/${id}/payment`, { amount });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Qarz to‘lovi muvaffaqiyatli qayd etildi');
      setIsPaymentModalOpen(false);
      setSelectedSupplierForPayment(null);
      setPaymentAmount('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'To‘lovni qayd etishda xatolik');
    },
  });

  // 4. Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/suppliers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Ta’minotchi o‘chirildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Ta’minotchini o‘chirish imkoni bo‘lmadi');
    },
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxNumber: supplier.taxNumber || '',
      notes: supplier.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const openPaymentModal = (supplier: Supplier) => {
    setSelectedSupplierForPayment(supplier);
    setPaymentAmount(String(supplier.balance > 0 ? supplier.balance : ''));
    setIsPaymentModalOpen(true);
  };

  // Calculations for stats
  const totalDebt = suppliers.reduce((acc, s) => acc + (s.balance > 0 ? Number(s.balance) : 0), 0);
  const activeCount = suppliers.filter((s) => s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ta’minotchilar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mahsulot yetkazib beruvchilar va hisob-kitoblar boshqaruvi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/purchases">
            <Button variant="outline" className="flex items-center gap-1.5 text-xs">
              <FileText className="w-4 h-4 text-gray-500" />
              Kirim fakturalari
            </Button>
          </Link>
          <Button onClick={openCreateModal} className="flex items-center gap-2 shadow-sm text-xs">
            <Plus className="w-4 h-4" />
            Yangi ta’minotchi
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Jami ta’minotchilar</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">{suppliers.length} ta</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Jami qarzimiz</p>
              <h3 className="text-xl font-bold text-rose-600 mt-0.5">
                {totalDebt.toLocaleString()} UZS
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Faol hamkorlar</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">{activeCount} ta</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Nomi, telefon yoki INN bo‘yicha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Topildi: <span className="text-gray-900 font-bold">{suppliers.length}</span>
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState
            title="Ta’minotchilar topilmadi"
            description="Tizimda hali ta’minotchilar yo‘q yoki qidiruv bo‘yicha mos kelmadi"
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
                  <th className="py-3.5 px-4">Ta’minotchi</th>
                  <th className="py-3.5 px-4">Kontakt & Telefon</th>
                  <th className="py-3.5 px-4">Manzil & INN</th>
                  <th className="py-3.5 px-4">Qarzdorlik</th>
                  <th className="py-3.5 px-4 text-center">Holat</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{s.name}</div>
                      {s.notes && <div className="text-xs text-gray-400 truncate max-w-xs">{s.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-900 font-medium">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {s.phone}
                      </div>
                      {s.contactPerson && (
                        <div className="text-xs text-gray-500 mt-0.5">{s.contactPerson}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.address ? (
                        <div className="flex items-center gap-1 text-xs text-gray-600 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {s.address}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                      {s.taxNumber && (
                        <div className="text-xs text-gray-400 mt-0.5">INN: {s.taxNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.balance > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {Number(s.balance).toLocaleString()} UZS qarz
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-emerald-600">Qarz yo‘q (0 UZS)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={s.isActive ? 'success' : 'default'}>
                        {s.isActive ? 'Faol' : 'Nofaol'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPaymentModal(s)}
                          className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          title="Qarz to‘lash"
                        >
                          <DollarSign className="w-3.5 h-3.5 mr-1" />
                          To‘lov
                        </Button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${s.name}" ta’minotchisini o‘chirishni xohlaysizmi?`)) {
                              deleteMutation.mutate(s.id);
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

      {/* Modal: Create/Edit Supplier */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSupplier ? 'Ta’minotchi ma’lumotlarini tahrirlash' : 'Yangi ta’minotchi qo‘shish'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!formData.name || !formData.phone) {
              toast.error('Nomi va telefon raqami kiritilishi shart');
              return;
            }
            saveMutation.mutate(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Ta’minotchi nomi *</label>
              <Input
                placeholder="Masalan: Grand Distribution MCHJ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Mas’ul shaxs</label>
              <Input
                placeholder="Masalan: Sardor Aliyev"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
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
                placeholder="supplier@company.uz"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">INN (STIR)</label>
              <Input
                placeholder="123456789"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Manzil</label>
              <Input
                placeholder="Toshkent sh., Chilonzor tumani..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Izoh va qaydlar</label>
              <textarea
                rows={2}
                placeholder="Shartnoma shartlari, yetkazib berish kunlari..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={closeModal}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Supplier Payment */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedSupplierForPayment(null);
        }}
        title="Ta’minotchi qarzini to‘lash"
      >
        {selectedSupplierForPayment && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const amt = Number(paymentAmount);
              if (!amt || amt <= 0) {
                toast.error('Musbat summa kiriting');
                return;
              }
              paymentMutation.mutate({
                id: selectedSupplierForPayment.id,
                amount: amt,
              });
            }}
            className="space-y-4"
          >
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs text-amber-800">
                <span className="font-semibold">{selectedSupplierForPayment.name}</span> ga joriy
                qarzdorlik:
              </div>
              <div className="text-lg font-bold text-amber-900 mt-1">
                {Number(selectedSupplierForPayment.balance).toLocaleString()} UZS
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">To‘lov summasi (UZS) *</label>
              <Input
                type="number"
                min="1"
                placeholder="Masalan: 500000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setSelectedSupplierForPayment(null);
                }}
              >
                Bekor qilish
              </Button>
              <Button type="submit" isLoading={paymentMutation.isPending}>
                To‘lovni tasdiqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
