import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building,
  User,
  AlertCircle,
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

export const FinancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'shifts'>('overview');

  // Expense modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({
    categoryName: 'Ijara',
    amount: '',
    paymentMethod: 'cash',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // 1. Fetch Finance Summary (P&L)
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const res = await api.get('/finance/summary');
      return res.data.data;
    },
  });

  // 2. Fetch Expenses List
  const { data: expenseRes, isLoading: isExpensesLoading } = useQuery({
    queryKey: ['expenses-list'],
    queryFn: async () => {
      const res = await api.get('/finance/expenses', { params: { limit: 50 } });
      return res.data;
    },
    enabled: activeTab === 'expenses',
  });

  const expenses = expenseRes?.data || [];

  // 3. Fetch Shifts History
  const { data: shiftRes, isLoading: isShiftsLoading } = useQuery({
    queryKey: ['shifts-history'],
    queryFn: async () => {
      const res = await api.get('/shifts', { params: { limit: 50 } });
      return res.data;
    },
    enabled: activeTab === 'shifts',
  });

  const shifts = shiftRes?.data || [];

  // 4. Create Expense Mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/finance/expenses', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast.success('Xarajat muvaffaqiyatli saqlandi');
      setIsExpenseModalOpen(false);
      setExpenseData({
        categoryName: 'Ijara',
        amount: '',
        paymentMethod: 'cash',
        description: '',
        date: new Date().toISOString().slice(0, 10),
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xarajatni saqlashda xatolik');
    },
  });

  // 5. Delete Expense Mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/finance/expenses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast.success('Xarajat o‘chirildi');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'O‘chirishda xatolik');
    },
  });

  const summary = summaryData || {
    revenue: 0,
    cogs: 0,
    grossProfit: 0,
    expenses: 0,
    netProfit: 0,
    marginPercent: 0,
    cashReceived: 0,
    cardReceived: 0,
    customerDebt: 0,
    supplierDebt: 0,
    activeDrawerCash: 0,
    expensesByCategory: {},
    transactionCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Moliya va Kassa</h1>
          <p className="text-sm text-gray-500 mt-1">
            Foyda va zararlar (P&L), operatsion xarajatlar va kassa smenalari nazorati
          </p>
        </div>
        {activeTab === 'expenses' && (
          <Button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            Yangi xarajat kiritish
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'overview'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Umumiy moliya (P&L)
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'expenses'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Xarajatlar daftari
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'shifts'
              ? 'bg-[#1e3a5f] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Kassa smenalari tarixi
        </button>
      </div>

      {/* TAB 1: P&L Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Profit KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Jami tushum (Savdo)</p>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">
                    {summary.revenue.toLocaleString()} UZS
                  </h3>
                </div>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-gray-400">
                {summary.transactionCount} ta muvaffaqiyatli chek
              </div>
            </Card>

            <Card className="p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Tovar tannarxi (COGS)</p>
                  <h3 className="text-xl font-bold text-gray-700 mt-1">
                    {summary.cogs.toLocaleString()} UZS
                  </h3>
                </div>
                <div className="p-2.5 bg-gray-50 text-gray-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-gray-400">Sotilgan tovarlarning kelim qiymati</div>
            </Card>

            <Card className="p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Operatsion xarajatlar</p>
                  <h3 className="text-xl font-bold text-rose-600 mt-1">
                    {summary.expenses.toLocaleString()} UZS
                  </h3>
                </div>
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-gray-400">Ijara, oylik va boshqa xarajatlar</div>
            </Card>

            <Card className="p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Sof foyda (Net Profit)</p>
                  <h3
                    className={`text-xl font-bold mt-1 ${
                      summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {summary.netProfit.toLocaleString()} UZS
                  </h3>
                </div>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-[11px] font-bold text-emerald-600">
                Rentabellik: {summary.marginPercent}%
              </div>
            </Card>
          </div>

          {/* Secondary Financial Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Mijozlarimiz qarzi (Nasiya)</p>
                  <h4 className="text-lg font-bold text-rose-600 mt-0.5">
                    {summary.customerDebt.toLocaleString()} UZS
                  </h4>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Ta’minotchilarga qarzimiz</p>
                  <h4 className="text-lg font-bold text-amber-700 mt-0.5">
                    {summary.supplierDebt.toLocaleString()} UZS
                  </h4>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Ochiq kassa qoldig‘i</p>
                  <h4 className="text-lg font-bold text-emerald-600 mt-0.5">
                    {summary.activeDrawerCash.toLocaleString()} UZS
                  </h4>
                </div>
              </div>
            </Card>
          </div>

          {/* Expenses by Category Breakdown */}
          <Card title="Xarajatlarning kategoriyalar bo‘yicha taqsimoti" className="p-4">
            {Object.keys(summary.expensesByCategory).length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">Xarajatlar mavjud emas</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {Object.entries(summary.expensesByCategory).map(([cat, amt]) => (
                  <div key={cat} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-500">{cat}</span>
                    <h5 className="text-sm font-bold text-gray-900 mt-0.5">
                      {Number(amt).toLocaleString()} UZS
                    </h5>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: Expenses List */}
      {activeTab === 'expenses' && (
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          {isExpensesLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              title="Xarajatlar topilmadi"
              description="Hozircha operatsion xarajatlar kiritilmagan"
              action={
                <Button onClick={() => setIsExpenseModalOpen(true)} size="sm">
                  + Yangi xarajat kiritish
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/75 text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Sana</th>
                    <th className="py-3.5 px-4">Kategoriya</th>
                    <th className="py-3.5 px-4">Tavsif va Izoh</th>
                    <th className="py-3.5 px-4">Summa</th>
                    <th className="py-3.5 px-4">To‘lov usuli</th>
                    <th className="py-3.5 px-4">Xodim</th>
                    <th className="py-3.5 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {expenses.map((e: any) => (
                    <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-xs text-gray-600 font-mono">
                        {e.date || new Date(e.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                        {e.categoryName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {e.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-rose-600 text-sm">
                        {Number(e.amount).toLocaleString()} UZS
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <Badge variant={e.paymentMethod === 'cash' ? 'default' : 'info'}>
                          {e.paymentMethod === 'cash' ? 'Naqd' : 'Plastik / O‘tkazma'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {e.user?.firstName || 'Menejer'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Ushbu xarajatni o‘chirmoqchimisiz?')) {
                              deleteExpenseMutation.mutate(e.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: Shifts History */}
      {activeTab === 'shifts' && (
        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          {isShiftsLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : shifts.length === 0 ? (
            <EmptyState
              title="Smenalar tarixi topilmadi"
              description="Hali hech qanday kassa smenasi ochilmagan"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/75 text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Kassir</th>
                    <th className="py-3.5 px-4">Kassa / Filial</th>
                    <th className="py-3.5 px-4">Ochilgan vaqt</th>
                    <th className="py-3.5 px-4">Yopilgan vaqt</th>
                    <th className="py-3.5 px-4">Boshlang‘ich naqd</th>
                    <th className="py-3.5 px-4">Jami savdo</th>
                    <th className="py-3.5 px-4">Yakuniy naqd</th>
                    <th className="py-3.5 px-4 text-center">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {shifts.map((sh: any) => (
                    <tr key={sh.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900 text-xs">
                        {sh.user?.firstName} {sh.user?.lastName || ''}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {sh.register?.name || 'Kassa 1'} ({sh.register?.branch?.name || 'Asosiy'})
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {new Date(sh.openedAt).toLocaleDateString('uz-UZ', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {sh.closedAt
                          ? new Date(sh.closedAt).toLocaleDateString('uz-UZ', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-900">
                        {Number(sh.openingBalance).toLocaleString()} UZS
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-emerald-600">
                        {Number(sh.totalSales).toLocaleString()} UZS
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-900">
                        {sh.closingBalance ? `${Number(sh.closingBalance).toLocaleString()} UZS` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={sh.status === 'open' ? 'success' : 'default'}>
                          {sh.status === 'open' ? 'Ochiq' : 'Yopilgan'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Modal: Create Expense */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Yangi xarajat kiritish"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!expenseData.amount) {
              toast.error('Summani kiriting');
              return;
            }
            createExpenseMutation.mutate(expenseData);
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Kategoriya *</label>
            <select
              value={expenseData.categoryName}
              onChange={(e) => setExpenseData({ ...expenseData, categoryName: e.target.value })}
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 bg-white outline-none focus:border-blue-500"
            >
              <option value="Ijara">Bino ijarasi</option>
              <option value="Ish haqi">Xodimlar maoshi</option>
              <option value="Kommunal">Kommunal to‘lovlar (Elektr, suv, gaz)</option>
              <option value="Logistika">Logistika va yetkazib berish</option>
              <option value="Reklama">Marketing va reklama</option>
              <option value="Xo‘jalik">Ofis va xo‘jalik buyumlari</option>
              <option value="Boshqa">Boshqa xarajatlar</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Xarajat summasi (UZS) *</label>
            <Input
              type="number"
              min="1"
              placeholder="Masalan: 500000"
              value={expenseData.amount}
              onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">To‘lov usuli</label>
            <select
              value={expenseData.paymentMethod}
              onChange={(e) => setExpenseData({ ...expenseData, paymentMethod: e.target.value })}
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 bg-white outline-none focus:border-blue-500"
            >
              <option value="cash">Kassadan naqd pul</option>
              <option value="card">Bank hisob / Karta</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Sana</label>
            <Input
              type="date"
              value={expenseData.date}
              onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Tavsif va Izoh</label>
            <textarea
              rows={2}
              placeholder="Kvitansiya raqami yoki xarajat maqsadi..."
              value={expenseData.description}
              onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-gray-300 p-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" isLoading={createExpenseMutation.isPending}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
