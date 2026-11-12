import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Package,
  Layers,
  Award,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Warehouse,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Feedback';
import api from '@/lib/axios';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export const ReportsPage: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(14);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // 1. Fetch Sales Trend
  const { data: salesTrend = [], isLoading: isTrendLoading } = useQuery({
    queryKey: ['report-trend', periodDays, selectedBranch],
    queryFn: async () => {
      const res = await api.get('/reports/sales-trend', {
        params: { days: periodDays, branchId: selectedBranch || undefined },
      });
      return res.data.data;
    },
  });

  // 2. Fetch Top Products
  const { data: topProducts = [], isLoading: isTopLoading } = useQuery({
    queryKey: ['report-top-products', selectedBranch],
    queryFn: async () => {
      const res = await api.get('/reports/top-products', {
        params: { limit: 6, branchId: selectedBranch || undefined },
      });
      return res.data.data;
    },
  });

  // 3. Fetch Category Breakdown
  const { data: categorySales = [], isLoading: isCategoryLoading } = useQuery({
    queryKey: ['report-categories', selectedBranch],
    queryFn: async () => {
      const res = await api.get('/reports/categories', {
        params: { branchId: selectedBranch || undefined },
      });
      return res.data.data;
    },
  });

  // 4. Fetch Cashier Performance
  const { data: cashiers = [], isLoading: isCashiersLoading } = useQuery({
    queryKey: ['report-cashiers', selectedBranch],
    queryFn: async () => {
      const res = await api.get('/reports/cashiers', {
        params: { branchId: selectedBranch || undefined },
      });
      return res.data.data;
    },
  });

  // 5. Fetch Inventory Valuation
  const { data: valuation, isLoading: isValuationLoading } = useQuery({
    queryKey: ['report-valuation'],
    queryFn: async () => {
      const res = await api.get('/reports/inventory-valuation');
      return res.data.data;
    },
  });

  // 6. Fetch Branches for filter
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      return res.data.data;
    },
  });

  // Totals for top cards
  const totalTrendRevenue = salesTrend.reduce((acc: number, t: any) => acc + (t.revenue || 0), 0);
  const totalTrendProfit = salesTrend.reduce((acc: number, t: any) => acc + (t.profit || 0), 0);
  const totalTrendCount = salesTrend.reduce((acc: number, t: any) => acc + (t.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hisobotlar va Tahlil</h1>
          <p className="text-sm text-gray-500 mt-1">
            Savdo dinamikasi, tovarlar aylanmasi va rentabellik bo‘yicha chuqur analitika
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs font-semibold rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700 outline-none focus:border-blue-500 shadow-xs"
          >
            <option value="">Barcha filiallar</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Period Selector */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs font-semibold">
            {[
              { days: 7, label: '7 kun' },
              { days: 14, label: '14 kun' },
              { days: 30, label: '30 kun' },
            ].map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriodDays(p.days)}
                className={`px-3 py-1.5 rounded-md transition ${
                  periodDays === p.days
                    ? 'bg-white text-gray-900 font-bold shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Trend Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Davr bo‘yicha savdo</p>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {totalTrendRevenue.toLocaleString()} UZS
              </h3>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-gray-400">
            Jami {totalTrendCount} ta savdo tranzaksiyasi
          </div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Yalpi foyda</p>
              <h3 className="text-xl font-bold text-emerald-600 mt-0.5">
                {totalTrendProfit.toLocaleString()} UZS
              </h3>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-gray-400">Tannarx va chegirmalar chegirilgandan so‘ng</div>
        </Card>

        <Card className="p-4 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Ombordagi tovarlar qiymati</p>
              <h3 className="text-xl font-bold text-purple-600 mt-0.5">
                {valuation ? Number(valuation.totalRetailValue).toLocaleString() : 0} UZS
              </h3>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-gray-400">
            Kelim qiymati: {valuation ? Number(valuation.totalCostValue).toLocaleString() : 0} UZS
          </div>
        </Card>
      </div>

      {/* Main Chart: Daily Revenue & Profit Trend Curve */}
      <Card title="Savdo tushumi va foyda dinamikasi" subtitle={`Oxirgi ${periodDays} kunlik ko‘rsatkich`}>
        <div className="h-72 w-full pt-4">
          {isTrendLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.slice(5)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} UZS`]}
                  labelFormatter={(lbl) => `Sana: ${lbl}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Tushum (UZS)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Foyda (UZS)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Grid: Top Products Bar Chart (Left) & Category Pie Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products Bar Chart */}
        <Card title="Eng ko‘p sotilgan tovarlar (Tushum bo‘yicha)">
          <div className="h-64 w-full pt-4">
            {isTopLoading ? (
              <Skeleton className="h-full w-full" />
            ) : topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-24">Ma’lumotlar mavjud emas</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fontSize: 10, fill: '#334155' }}
                    axisLine={false}
                  />
                  <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} UZS`, 'Tushum']} />
                  <Bar dataKey="totalRevenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card title="Kategoriyalar bo‘yicha ulush">
          <div className="h-64 w-full pt-2 flex items-center justify-center">
            {isCategoryLoading ? (
              <Skeleton className="h-full w-full" />
            ) : categorySales.length === 0 ? (
              <p className="text-xs text-gray-400 text-center">Ma’lumotlar mavjud emas</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="revenue"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categorySales.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString()} UZS`]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Cashier Performance Table */}
      <Card title="Kassirlar reytingi va samaradorligi" subtitle="Har bir xodim tomonidan qabul qilingan cheklar va tushum">
        <div className="overflow-x-auto pt-2">
          {isCashiersLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : cashiers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Kassirlar savdosi qayd etilmagan</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Kassir</th>
                  <th className="py-3 px-4 text-center">Cheklar soni</th>
                  <th className="py-3 px-4 text-right">Jami tushum</th>
                  <th className="py-3 px-4 text-right">O‘rtacha chek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {cashiers.map((c: any, idx: number) => {
                  const avgCheck = c.salesCount > 0 ? Math.floor(c.totalRevenue / c.salesCount) : 0;
                  return (
                    <tr key={c.userId} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-700">
                        {c.salesCount} ta
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">
                        {Number(c.totalRevenue).toLocaleString()} UZS
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-600">
                        {avgCheck.toLocaleString()} UZS
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
