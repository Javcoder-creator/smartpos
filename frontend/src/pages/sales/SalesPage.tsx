import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Search,
  Eye,
  RotateCcw,
  Calendar,
  CheckCircle2,
  XCircle,
  CreditCard,
  Banknote,
  AlertTriangle,
  User,
  Store,
  DollarSign,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, EmptyState } from '@/components/ui/Feedback';
import api from '@/lib/axios';

export const SalesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [selectedSaleForView, setSelectedSaleForView] = useState<any>(null);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<any>(null);

  // Return Form State
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');

  // 1. Fetch Sales List
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-history', search, selectedBranch, selectedStatus, page],
    queryFn: async () => {
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedStatus) params.status = selectedStatus;
      const res = await api.get('/sales', { params });
      return res.data;
    },
  });

  const sales: any[] = salesData?.data || [];
  const meta = salesData?.meta;

  // 2. Fetch Branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data;
    },
  });

  // 3. Return Mutation
  const returnMutation = useMutation({
    mutationFn: async ({ saleId, payload }: { saleId: string; payload: any }) => {
      const res = await api.post(`/sales/${saleId}/return`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-history'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balances'] });
      toast.success('Tovarlar muvaffaqiyatli qaytarildi va omborga tiklandi');
      setSelectedSaleForReturn(null);
      setReturnItems({});
      setReturnReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Qaytarishda xatolik yuz berdi');
    },
  });

  const openReturnModal = (sale: any) => {
    setSelectedSaleForReturn(sale);
    // Initialize return quantities to 0
    const initialQtys: Record<string, number> = {};
    sale.items?.forEach((it: any) => {
      initialQtys[it.id] = 0;
    });
    setReturnItems(initialQtys);
    setReturnReason('');
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));

    if (itemsToReturn.length === 0) {
      toast.error('Kamida bitta tovar uchun qaytariladigan miqdorni kiriting');
      return;
    }

    returnMutation.mutate({
      saleId: selectedSaleForReturn.id,
      payload: {
        items: itemsToReturn,
        reason: returnReason || 'Mijoz tomonidan qaytarildi',
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Bajarilgan</Badge>;
      case 'returned':
        return <Badge variant="warning">Qisman / Qaytarilgan</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Bekor qilingan</Badge>;
      case 'held':
        return <Badge variant="default">Kechiktirilgan</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sotuvlar tarixi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Barcha kassa cheklari, to‘lovlar va tovarlarni qaytarish (vozvrat) boshqaruvi
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden border border-gray-100 shadow-sm">
        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Chek raqami bo‘yicha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="min-w-[160px]">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="">Barcha filiallar</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[150px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-medium rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="">Barcha holatlar</option>
              <option value="completed">Bajarilgan</option>
              <option value="returned">Qaytarilgan</option>
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
        ) : sales.length === 0 ? (
          <EmptyState
            title="Sotuvlar topilmadi"
            description="Qidiruv parametrlari bo‘yicha hech qanday chek topilmadi"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Chek №</th>
                  <th className="py-3.5 px-4">Filial / Kassir</th>
                  <th className="py-3.5 px-4">Mijoz</th>
                  <th className="py-3.5 px-4">Jami summa</th>
                  <th className="py-3.5 px-4">To‘lov usuli</th>
                  <th className="py-3.5 px-4 text-center">Holat</th>
                  <th className="py-3.5 px-4">Sana va vaqt</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 font-mono text-xs">
                      {sale.saleNumber}
                      <span className="block text-[10px] text-gray-400 font-normal">
                        {sale.items?.length || 0} ta mahsulot
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-gray-800">{sale.branch?.name || 'Asosiy'}</div>
                      <div className="text-gray-400 text-[11px]">{sale.cashier?.firstName || 'Kassir'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {sale.customer ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {sale.customer.firstName} {sale.customer.lastName || ''}
                          </div>
                          <div className="text-gray-400 text-[10px]">{sale.customer.phone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Oddiy xaridor</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">
                        {Number(sale.totalAmount).toLocaleString()} UZS
                      </div>
                      {Number(sale.debtAmount) > 0 && (
                        <div className="text-[10px] font-bold text-rose-600">
                          Nasiya: {Number(sale.debtAmount).toLocaleString()} UZS
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {sale.payments?.map((p: any) => (
                          <span
                            key={p.id}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              p.method === 'cash'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {p.method === 'cash' ? 'Naqd' : 'Karta'}
                          </span>
                        ))}
                        {Number(sale.debtAmount) > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                            Nasiya
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(sale.status)}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 font-mono">
                      {new Date(sale.createdAt).toLocaleDateString('uz-UZ', {
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
                          onClick={() => setSelectedSaleForView(sale)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Chekni ko‘rish"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {sale.status === 'completed' && (
                          <button
                            onClick={() => openReturnModal(sale)}
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Tovarni qaytarish (Vozvrat)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal 1: View Sale Receipt Details */}
      <Modal
        isOpen={!!selectedSaleForView}
        onClose={() => setSelectedSaleForView(null)}
        title={`Savdo cheki: ${selectedSaleForView?.saleNumber || ''}`}
        size="lg"
      >
        {selectedSaleForView && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-xs">
              <div>
                <span className="text-gray-500">Filial:</span>
                <p className="font-bold text-gray-800">{selectedSaleForView.branch?.name}</p>
                <span className="text-gray-500 mt-1 block">Kassir:</span>
                <p className="font-bold text-gray-800">{selectedSaleForView.cashier?.firstName}</p>
              </div>
              <div>
                <span className="text-gray-500">Mijoz:</span>
                <p className="font-bold text-gray-800">
                  {selectedSaleForView.customer?.firstName || 'Oddiy xaridor'}
                </p>
                <div className="mt-2">{getStatusBadge(selectedSaleForView.status)}</div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-600 font-semibold">
                  <tr>
                    <th className="p-2.5">Mahsulot</th>
                    <th className="p-2.5 text-right">Miqdor</th>
                    <th className="p-2.5 text-right">Narx</th>
                    <th className="p-2.5 text-right">Jami</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSaleForView.items?.map((it: any) => (
                    <tr key={it.id}>
                      <td className="p-2.5 font-medium text-gray-900">{it.product?.name}</td>
                      <td className="p-2.5 text-right font-bold">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="p-2.5 text-right">{Number(it.unitPrice).toLocaleString()} UZS</td>
                      <td className="p-2.5 text-right font-bold text-gray-900">
                        {Number(it.totalPrice).toLocaleString()} UZS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Oraliq summa:</span>
                <span className="font-semibold">{Number(selectedSaleForView.subtotal).toLocaleString()} UZS</span>
              </div>
              {Number(selectedSaleForView.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Chegirma:</span>
                  <span>-{Number(selectedSaleForView.discountAmount).toLocaleString()} UZS</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-1">
                <span>Yakuniy summa:</span>
                <span>{Number(selectedSaleForView.totalAmount).toLocaleString()} UZS</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedSaleForView(null)}>
                Yopish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 2: Return / Refund Dialog */}
      <Modal
        isOpen={!!selectedSaleForReturn}
        onClose={() => setSelectedSaleForReturn(null)}
        title="Tovarlarni qaytarish (Vozvrat)"
        size="lg"
      >
        {selectedSaleForReturn && (
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Ushbu chekdagi mahsulotlardan qaysi biri va qancha miqdorda qaytarilayotganini belgilang.
              Omborga qaytgan tovarlar zaxirasi avtomatik oshiriladi.
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="p-2.5">Mahsulot</th>
                    <th className="p-2.5 text-right">Sotilgan miqdor</th>
                    <th className="p-2.5 text-right">Narxi</th>
                    <th className="p-2.5 text-right w-28">Qaytarish miqdori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSaleForReturn.items?.map((it: any) => (
                    <tr key={it.id}>
                      <td className="p-2.5 font-bold text-gray-900">{it.product?.name}</td>
                      <td className="p-2.5 text-right">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="p-2.5 text-right">{Number(it.unitPrice).toLocaleString()} UZS</td>
                      <td className="p-2.5 text-right">
                        <Input
                          type="number"
                          min="0"
                          max={it.quantity}
                          step="any"
                          value={returnItems[it.id] || 0}
                          onChange={(e) =>
                            setReturnItems({ ...returnItems, [it.id]: Number(e.target.value) })
                          }
                          className="h-8 text-xs text-right font-bold"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Qaytarish sababi</label>
              <Input
                placeholder="Masalan: Yaroqsiz tovar yoki mijoz rad etdi..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedSaleForReturn(null)}
              >
                Bekor qilish
              </Button>
              <Button type="submit" isLoading={returnMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                Qaytarishni tasdiqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
