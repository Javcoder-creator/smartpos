import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Warehouse,
  Truck,
  Trash2,
  Eye,
  AlertCircle,
  DollarSign,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

interface PurchaseItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    name: string;
    sku: string;
    unit: string;
  };
}

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  warehouseId: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  receivedAt?: string;
  notes?: string;
  createdAt: string;
  supplier?: { id: string; name: string; phone: string };
  warehouse?: { id: string; name: string };
  user?: { id: string; firstName: string; lastName: string };
  items?: PurchaseItem[];
}

export const PurchasesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<Purchase | null>(null);

  // New Purchase Form state
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'received'>('received');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formPaid, setFormPaid] = useState('0');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<
    Array<{ productId: string; quantity: number; unitPrice: number }>
  >([{ productId: '', quantity: 1, unitPrice: 0 }]);

  // 1. Fetch Purchases
  const { data: purchaseData, isLoading } = useQuery({
    queryKey: ['purchases', selectedWarehouse, selectedSupplier, selectedStatus, page],
    queryFn: async () => {
      const params: any = { page, limit: 12 };
      if (selectedWarehouse) params.warehouseId = selectedWarehouse;
      if (selectedSupplier) params.supplierId = selectedSupplier;
      if (selectedStatus) params.status = selectedStatus;
      const res = await api.get('/purchases', { params });
      return res.data;
    },
  });

  const purchases: Purchase[] = purchaseData?.data || [];
  const meta = purchaseData?.meta;

  // 2. Fetch Suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const res = await api.get('/suppliers');
      return res.data.data;
    },
  });

  // 3. Fetch Warehouses for dropdown
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data.data;
    },
  });

  // 4. Fetch Products for line item selection
  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 100 } });
      return res.data.data;
    },
  });

  // 5. Create Purchase Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/purchases', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast.success('Kirim hujjati muvaffaqiyatli saqlandi');
      closeCreateModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Kirim yaratishda xatolik');
    },
  });

  // 6. Receive Goods Mutation
  const receiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/purchases/${id}/receive`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Tovarlar omborga muvaffaqiyatli qabul qilindi');
      if (selectedPurchaseDetails) setSelectedPurchaseDetails(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Qabul qilishda xatolik');
    },
  });

  // 7. Cancel Purchase Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/purchases/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Kirim hujjati bekor qilindi');
      if (selectedPurchaseDetails) setSelectedPurchaseDetails(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bekor qilishda xatolik');
    },
  });

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setFormSupplierId('');
    setFormWarehouseId('');
    setFormDiscount('0');
    setFormPaid('0');
    setFormNotes('');
    setFormItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleAddItem = () => {
    setFormItems([...formItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...formItems];
    if (field === 'productId') {
      const foundProduct = products.find((p: any) => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        unitPrice: foundProduct ? Number(foundProduct.costPrice || 0) : updated[index].unitPrice,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: Number(value),
      };
    }
    setFormItems(updated);
  };

  // Form financial calculations
  const subtotal = formItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discount = Number(formDiscount) || 0;
  const finalTotal = Math.max(0, subtotal - discount);
  const paid = Number(formPaid) || 0;
  const remainingDebt = Math.max(0, finalTotal - paid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSupplierId) {
      toast.error('Yetkazib beruvchini tanlang');
      return;
    }
    if (!formWarehouseId) {
      toast.error('Omborni tanlang');
      return;
    }
    const validItems = formItems.filter((it) => it.productId && it.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Kamida bitta mahsulot va miqdorni kiriting');
      return;
    }

    createMutation.mutate({
      supplierId: formSupplierId,
      warehouseId: formWarehouseId,
      items: validItems,
      discountAmount: discount,
      paidAmount: paid,
      notes: formNotes,
      status: formStatus,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge variant="success">Qabul qilingan</Badge>;
      case 'ordered':
        return <Badge variant="info">Buyurtma qilingan</Badge>;
      case 'draft':
        return <Badge variant="warning">Qoralama</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Bekor qilingan</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kirim va Xaridlar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Yetkazib beruvchilardan tovarlarni omborga qabul qilish va hisob-kitob
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/suppliers">
            <Button variant="outline" className="flex items-center gap-1.5 text-xs">
              <Truck className="w-4 h-4 text-gray-500" />
              Ta’minotchilar
            </Button>
          </Link>
          <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 shadow-sm text-xs">
            <Plus className="w-4 h-4" />
            Yangi kirim hujjati
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Jami kirimlar soni</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">{meta?.total || 0} ta</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Qabul qilinganlar</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">
                {purchases.filter((p) => p.status === 'received').length} ta
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Kutilayotgan qoralamalar</p>
              <h3 className="text-xl font-bold text-amber-600 mt-0.5">
                {purchases.filter((p) => p.status === 'draft').length} ta
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
          <div className="min-w-[180px]">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="">Barcha omborlar</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[180px]">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="">Barcha ta’minotchilar</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="">Barcha holatlar</option>
              <option value="received">Qabul qilingan</option>
              <option value="draft">Qoralama</option>
              <option value="ordered">Buyurtma</option>
              <option value="cancelled">Bekor qilingan</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : purchases.length === 0 ? (
          <EmptyState
            title="Kirim hujjatlari topilmadi"
            description="Tanlangan parametrlar bo‘yicha hech qanday xarid topilmadi"
            action={
              <Button onClick={() => setIsCreateOpen(true)} size="sm">
                + Yangi kirim ochish
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Hujjat №</th>
                  <th className="py-3.5 px-4">Ta’minotchi</th>
                  <th className="py-3.5 px-4">Ombor</th>
                  <th className="py-3.5 px-4">Umumiy summa</th>
                  <th className="py-3.5 px-4">To‘langan / Qarz</th>
                  <th className="py-3.5 px-4 text-center">Holat</th>
                  <th className="py-3.5 px-4">Sana</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {purchases.map((p) => {
                  const debt = Number(p.finalAmount) - Number(p.paidAmount);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 font-mono text-xs">
                        {p.purchaseNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">
                          {p.supplier?.name || 'Noma’lum'}
                        </div>
                        {p.supplier?.phone && (
                          <div className="text-xs text-gray-400">{p.supplier.phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                        {p.warehouse?.name || 'Asosiy'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">
                          {Number(p.finalAmount).toLocaleString()} UZS
                        </div>
                        {Number(p.discountAmount) > 0 && (
                          <div className="text-xs text-emerald-600">
                            Chegirma: -{Number(p.discountAmount).toLocaleString()} UZS
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-gray-800">
                          To‘landi: {Number(p.paidAmount).toLocaleString()} UZS
                        </div>
                        {debt > 0 ? (
                          <div className="text-xs font-bold text-rose-600">
                            Qarz: {debt.toLocaleString()} UZS
                          </div>
                        ) : (
                          <div className="text-xs font-medium text-emerald-600">To‘liq to‘langan</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(p.status)}</td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('uz-UZ', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPurchaseDetails(p)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Ko‘rish"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {p.status !== 'received' && p.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                if (confirm(`Ushbu hujjatdagi tovarlarni omborga qabul qilasizmi?`)) {
                                  receiveMutation.mutate(p.id);
                                }
                              }}
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Omborga qabul qilish"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {p.status !== 'cancelled' && p.status !== 'received' && (
                            <button
                              onClick={() => {
                                if (confirm(`Kirim hujjatini bekor qilishni xohlaysizmi?`)) {
                                  cancelMutation.mutate(p.id);
                                }
                              }}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Bekor qilish"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: New Purchase Invoice */}
      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        title="Yangi kirim hujjati (Faktura)"
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Top row: Supplier & Warehouse & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Yetkazib beruvchi *</label>
              <select
                value={formSupplierId}
                onChange={(e) => setFormSupplierId(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white outline-none focus:border-blue-500"
                required
              >
                <option value="">Tanlang...</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Omborxona *</label>
              <select
                value={formWarehouseId}
                onChange={(e) => setFormWarehouseId(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white outline-none focus:border-blue-500"
                required
              >
                <option value="">Tanlang...</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Hujjat holati</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white outline-none focus:border-blue-500"
              >
                <option value="received">Darhol omborga qabul qilish</option>
                <option value="draft">Qoralama (Keyinroq qabul qilinadi)</option>
              </select>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Mahsulotlar ro‘yxati
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs h-7 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Qator qo‘shish
              </Button>
            </div>

            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
              {formItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full text-xs rounded-lg border border-gray-300 p-2 bg-white outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Mahsulotni tanlang...</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku || 'SKU yo‘q'}) — Tannarx: {Number(p.costPrice).toLocaleString()} UZS
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <Input
                      type="number"
                      min="0.001"
                      step="any"
                      placeholder="Miqdor"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Kelim narxi"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </div>

                  <div className="w-32 text-right text-xs font-bold text-gray-800 pr-2">
                    {(item.quantity * item.unitPrice).toLocaleString()} UZS
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={formItems.length === 1}
                    className="p-1.5 text-gray-400 hover:text-rose-600 disabled:opacity-30 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Financial summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Izoh va eslatmalar</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Yuk xati raqami yoki boshqa ma’lumotlar..."
                  className="w-full text-xs rounded-lg border border-gray-300 p-2 bg-white mt-1 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Jami tovarlar summasi:</span>
                <span className="font-semibold">{subtotal.toLocaleString()} UZS</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Chegirma:</span>
                <div className="w-36">
                  <Input
                    type="number"
                    min="0"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    className="h-8 text-xs text-right"
                  />
                </div>
              </div>

              <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2">
                <span>Yakuniy to‘lanishi kerak:</span>
                <span className="text-blue-600">{finalTotal.toLocaleString()} UZS</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Oldindan to‘langan (Kassa/Hisob):</span>
                <div className="w-36">
                  <Input
                    type="number"
                    min="0"
                    value={formPaid}
                    onChange={(e) => setFormPaid(e.target.value)}
                    className="h-8 text-xs text-right font-medium text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs font-bold text-rose-600 border-t pt-1">
                <span>Ta’minotchiga qarz:</span>
                <span>{remainingDebt.toLocaleString()} UZS</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeCreateModal}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              {formStatus === 'received' ? 'Omborga qabul qilish' : 'Qoralama saqlash'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Details */}
      <Modal
        isOpen={!!selectedPurchaseDetails}
        onClose={() => setSelectedPurchaseDetails(null)}
        title={`Kirim hujjati № ${selectedPurchaseDetails?.purchaseNumber || ''}`}
        size="lg"
      >
        {selectedPurchaseDetails && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg">
              <div>
                <span className="text-gray-500">Ta’minotchi:</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {selectedPurchaseDetails.supplier?.name}
                </p>
                <p className="text-gray-400">{selectedPurchaseDetails.supplier?.phone}</p>
              </div>
              <div>
                <span className="text-gray-500">Ombor:</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {selectedPurchaseDetails.warehouse?.name}
                </p>
                <div className="mt-1">{getStatusBadge(selectedPurchaseDetails.status)}</div>
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-2.5">Mahsulot</th>
                    <th className="p-2.5 text-right">Miqdor</th>
                    <th className="p-2.5 text-right">Kelim narxi</th>
                    <th className="p-2.5 text-right">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedPurchaseDetails.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5 font-medium text-gray-900">
                        {item.product?.name || 'Mahsulot'}
                        <span className="block text-[10px] text-gray-400">{item.product?.sku}</span>
                      </td>
                      <td className="p-2.5 text-right font-semibold">
                        {Number(item.quantity).toLocaleString()} {item.product?.unit || 'dona'}
                      </td>
                      <td className="p-2.5 text-right">
                        {Number(item.unitPrice).toLocaleString()} UZS
                      </td>
                      <td className="p-2.5 text-right font-bold text-gray-900">
                        {Number(item.totalPrice).toLocaleString()} UZS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Oraliq summa:</span>
                <span className="font-semibold">
                  {Number(selectedPurchaseDetails.totalAmount).toLocaleString()} UZS
                </span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Chegirma:</span>
                <span>-{Number(selectedPurchaseDetails.discountAmount).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 border-t pt-1">
                <span>Yakuniy summa:</span>
                <span>{Number(selectedPurchaseDetails.finalAmount).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>To‘langan summa:</span>
                <span>{Number(selectedPurchaseDetails.paidAmount).toLocaleString()} UZS</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600">
                <span>Qarzdorlik:</span>
                <span>
                  {(
                    Number(selectedPurchaseDetails.finalAmount) -
                    Number(selectedPurchaseDetails.paidAmount)
                  ).toLocaleString()}{' '}
                  UZS
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPurchaseDetails(null)}
              >
                Yopish
              </Button>
              {selectedPurchaseDetails.status !== 'received' &&
                selectedPurchaseDetails.status !== 'cancelled' && (
                  <Button
                    size="sm"
                    onClick={() => receiveMutation.mutate(selectedPurchaseDetails.id)}
                    isLoading={receiveMutation.isPending}
                  >
                    Omborga qabul qilish
                  </Button>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
