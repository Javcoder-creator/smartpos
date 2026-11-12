import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Warehouse,
  ArrowRightLeft,
  SlidersHorizontal,
  Trash2,
  Search,
  AlertTriangle,
  History,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');

  // Filter state
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isWriteOffOpen, setIsWriteOffOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Forms state
  const [transferData, setTransferData] = useState({
    productId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: '',
    notes: '',
  });

  const [adjustData, setAdjustData] = useState({
    productId: '',
    warehouseId: '',
    newQuantity: '',
    reason: '',
  });

  const [writeOffData, setWriteOffData] = useState({
    productId: '',
    warehouseId: '',
    quantity: '',
    reason: '',
  });

  // 1. Fetch Warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data.data;
    },
  });

  // 2. Fetch Stock Balances
  const { data: balanceData, isLoading: isBalancesLoading } = useQuery({
    queryKey: ['inventory-balances', selectedWarehouse, search, page],
    queryFn: async () => {
      const params: any = { page, limit: 12 };
      if (selectedWarehouse) params.warehouseId = selectedWarehouse;
      if (search) params.search = search;
      const res = await api.get('/inventory/balances', { params });
      return res.data;
    },
    enabled: activeTab === 'balances',
  });

  // 3. Fetch Stock Movements
  const { data: movementData, isLoading: isMovementsLoading } = useQuery({
    queryKey: ['inventory-movements', selectedWarehouse, page],
    queryFn: async () => {
      const params: any = { page, limit: 15 };
      if (selectedWarehouse) params.warehouseId = selectedWarehouse;
      const res = await api.get('/inventory/movements', { params });
      return res.data;
    },
    enabled: activeTab === 'movements',
  });

  // 4. Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/inventory/transfer', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Tovarlar omborlararo muvaffaqiyatli ko‘chirildi');
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      setIsTransferOpen(false);
      setTransferData({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '', notes: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Ko‘chirishda xatolik yuz berdi');
    },
  });

  // 5. Adjust Mutation
  const adjustMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/inventory/adjust', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Qoldiq muvaffaqiyatli to‘g‘rilandi');
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      setIsAdjustOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Korreksiyada xatolik');
    },
  });

  // 6. Write-off Mutation
  const writeOffMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/inventory/write-off', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Tovar hisobdan chiqarildi');
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      setIsWriteOffOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Hisobdan chiqarishda xatolik');
    },
  });

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    transferMutation.mutate({
      ...transferData,
      quantity: Number(transferData.quantity),
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustMutation.mutate({
      ...adjustData,
      newQuantity: Number(adjustData.newQuantity),
    });
  };

  const handleWriteOffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    writeOffMutation.mutate({
      ...writeOffData,
      quantity: Number(writeOffData.quantity),
    });
  };

  const balances = balanceData?.data || [];
  const balanceMeta = balanceData?.meta;
  const movements = movementData?.data || [];
  const movementMeta = movementData?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Omborxona va Harakatlar</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tovar qoldiqlari, omborlararo ko‘chirish va harakatlar daftari
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTransferOpen(true)}
            leftIcon={<ArrowRightLeft className="w-4 h-4 text-blue-600" />}
          >
            Ko‘chirish
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWriteOffOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4 text-red-600" />}
          >
            Hisobdan chiqarish
          </Button>
        </div>
      </div>

      {/* Tabs & Warehouse Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('balances');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'balances'
                ? 'bg-[#1e3a5f] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Ombor qoldiqlari
          </button>
          <button
            onClick={() => {
              setActiveTab('movements');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'movements'
                ? 'bg-[#1e3a5f] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4" />
            Harakatlar daftari
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Barcha omborlar</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isDefault ? '(Asosiy)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: BALANCES */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          <Card noPadding className="p-4">
            <Input
              placeholder="Mahsulot nomi yoki SKU bo‘yicha qidirish..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </Card>

          <Card noPadding className="overflow-hidden">
            {isBalancesLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : balances.length === 0 ? (
              <EmptyState
                icon={<Warehouse className="w-10 h-10" />}
                title="Qoldiqlar topilmadi"
                description="Ushbu omborda hali mahsulotlar mavjud emas yoki qidiruv bo‘yicha topilmadi."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Mahsulot</th>
                      <th className="py-3.5 px-4">SKU</th>
                      <th className="py-3.5 px-4">Kategoriya</th>
                      <th className="py-3.5 px-4 text-center">Minimal me’yor</th>
                      <th className="py-3.5 px-4 text-right">Mavjud qoldiq</th>
                      <th className="py-3.5 px-4 text-center">Holat</th>
                      <th className="py-3.5 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {balances.map((item: any) => {
                      const p = item.product;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-gray-900">{p.name}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">{p.sku}</td>
                          <td className="py-3.5 px-4 text-gray-600">{p.category?.name || '—'}</td>
                          <td className="py-3.5 px-4 text-center text-gray-500">
                            {p.minStockQty} {p.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-sm">
                            <span className={item.isLowStock ? 'text-amber-600' : 'text-gray-900'}>
                              {item.currentStock} {p.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {item.isLowStock ? (
                              <Badge variant="warning" size="sm" className="gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Kam qolgan
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                Yetarli
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setAdjustData({
                                    productId: p.id,
                                    warehouseId: selectedWarehouse || warehouses[0]?.id || '',
                                    newQuantity: String(item.currentStock),
                                    reason: 'Inventarizatsiya to‘g‘rilash',
                                  });
                                  setIsAdjustOpen(true);
                                }}
                                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />}
                              >
                                Tuzatish
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {balanceMeta && balanceMeta.totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-gray-50/50">
                <span>
                  Jami <strong>{balanceMeta.total}</strong> ta tovardan
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={balanceMeta.page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Oldingi
                  </Button>
                  <span className="px-2 font-medium">
                    {balanceMeta.page} / {balanceMeta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={balanceMeta.page >= balanceMeta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Keyingi
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: AUDIT MOVEMENTS */}
      {activeTab === 'movements' && (
        <Card noPadding className="overflow-hidden">
          {isMovementsLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : movements.length === 0 ? (
            <EmptyState
              icon={<History className="w-10 h-10" />}
              title="Harakatlar topilmadi"
              description="Omborda hali tovarlar kirim-chiqimi amalga oshirilmagan."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Sana va vaqt</th>
                    <th className="py-3.5 px-4">Mahsulot</th>
                    <th className="py-3.5 px-4">Ombor</th>
                    <th className="py-3.5 px-4">Operatsiya turi</th>
                    <th className="py-3.5 px-4 text-right">Miqdor</th>
                    <th className="py-3.5 px-4 text-right">Avvalgi / Yangi</th>
                    <th className="py-3.5 px-4">Xodim / Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((m: any) => {
                    const isPositive = Number(m.quantity) > 0;
                    return (
                      <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-gray-900">{m.product?.name}</p>
                          <p className="font-mono text-[10px] text-gray-400">{m.product?.sku}</p>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 font-medium">{m.warehouse?.name}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                              m.type === 'purchase_in' || m.type === 'transfer_in' || m.type === 'return_in'
                                ? 'bg-emerald-50 text-emerald-700'
                                : m.type === 'sale_out' || m.type === 'transfer_out'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {isPositive ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {m.type === 'purchase_in' && 'Xarid kirimi'}
                            {m.type === 'sale_out' && 'Sotuv chiqimi'}
                            {m.type === 'transfer_in' && 'Ko‘chirish (kirim)'}
                            {m.type === 'transfer_out' && 'Ko‘chirish (chiqim)'}
                            {m.type === 'adjustment' && 'Tuzatish'}
                            {m.type === 'write_off' && 'Hisobdan chiqarish'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                            {isPositive ? `+${m.quantity}` : m.quantity} {m.product?.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-500 text-[11px]">
                          {m.previousQty} ➡️ <strong>{m.currentQty}</strong>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500">
                          <p className="font-medium text-gray-700 text-xs">{m.user?.firstName || 'Tizim'}</p>
                          <p className="text-[11px] text-gray-400 truncate max-w-xs">{m.notes || '—'}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* MODAL: STOCK TRANSFER */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Omborlararo tovar ko‘chirish"
        subtitle="Tovarlarni bir ombordan ikkinchisiga xavfsiz o‘tkazish"
        size="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mahsulot *</label>
            <select
              required
              value={transferData.productId}
              onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Mahsulotni tanlang</option>
              {balances.map((b: any) => (
                <option key={b.product.id} value={b.product.id}>
                  {b.product.name} ({b.currentStock} {b.product.unit} mavjud)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Qaysi ombordan *</label>
              <select
                required
                value={transferData.fromWarehouseId}
                onChange={(e) => setTransferData({ ...transferData, fromWarehouseId: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
              >
                <option value="">Chiqish ombori</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Qaysi omborga *</label>
              <select
                required
                value={transferData.toWarehouseId}
                onChange={(e) => setTransferData({ ...transferData, toWarehouseId: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
              >
                <option value="">Kirish ombori</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Ko‘chirish miqdori *"
            type="number"
            required
            placeholder="Masalan: 10"
            value={transferData.quantity}
            onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
          />

          <Input
            label="Izoh (ixtiyoriy)"
            placeholder="Yangi filialga ajratildi"
            value={transferData.notes}
            onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsTransferOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="accent" size="md" type="submit" isLoading={transferMutation.isPending}>
              Ko‘chirishni tasdiqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: STOCK ADJUST */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Qoldiqni tuzatish (Korreksiya)"
        subtitle={selectedProduct ? selectedProduct.name : ''}
        size="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ombor *</label>
            <select
              required
              value={adjustData.warehouseId}
              onChange={(e) => setAdjustData({ ...adjustData, warehouseId: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
            >
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Haqiqiy sanalgan yangi qoldiq *"
            type="number"
            required
            value={adjustData.newQuantity}
            onChange={(e) => setAdjustData({ ...adjustData, newQuantity: e.target.value })}
          />

          <Input
            label="Tuzatish sababi *"
            required
            placeholder="Inventarizatsiya natijasi"
            value={adjustData.reason}
            onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsAdjustOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="accent" size="md" type="submit" isLoading={adjustMutation.isPending}>
              Qoldiqni saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: WRITE-OFF */}
      <Modal
        isOpen={isWriteOffOpen}
        onClose={() => setIsWriteOffOpen(false)}
        title="Tovarni hisobdan chiqarish"
        subtitle="Zararlangan, muddati o‘tgan yoki yo‘qolgan tovarlarni hisobdan o‘chirish"
        size="md"
      >
        <form onSubmit={handleWriteOffSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mahsulot *</label>
            <select
              required
              value={writeOffData.productId}
              onChange={(e) => setWriteOffData({ ...writeOffData, productId: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Mahsulotni tanlang</option>
              {balances.map((b: any) => (
                <option key={b.product.id} value={b.product.id}>
                  {b.product.name} ({b.currentStock} {b.product.unit} mavjud)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ombor *</label>
            <select
              required
              value={writeOffData.warehouseId}
              onChange={(e) => setWriteOffData({ ...writeOffData, warehouseId: e.target.value })}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-xs text-gray-700 outline-none focus:border-[#1e3a5f]"
            >
              <option value="">Omborni tanlang</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Hisobdan chiqariladigan miqdor *"
            type="number"
            required
            placeholder="Masalan: 3"
            value={writeOffData.quantity}
            onChange={(e) => setWriteOffData({ ...writeOffData, quantity: e.target.value })}
          />

          <Input
            label="Sababi *"
            required
            placeholder="Shishasi singan / Muddati o‘tgan"
            value={writeOffData.reason}
            onChange={(e) => setWriteOffData({ ...writeOffData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="md" type="button" onClick={() => setIsWriteOffOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="danger" size="md" type="submit" isLoading={writeOffMutation.isPending}>
              Hisobdan chiqarish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
