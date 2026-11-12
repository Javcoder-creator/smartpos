import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Receipt,
  Package,
  AlertTriangle,
  ShoppingCart,
  PlusCircle,
  Truck,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/i18n';

const chartData = [
  { time: '09:00', sales: 420000 },
  { time: '11:00', sales: 890000 },
  { time: '13:00', sales: 1540000 },
  { time: '15:00', sales: 2100000 },
  { time: '17:00', sales: 3200000 },
  { time: '19:00', sales: 4850000 },
  { time: '21:00', sales: 5420000 },
];

const mockRecentSales = [
  {
    id: 'TRX-1082',
    time: '21:14',
    cashier: 'Rustam Q.',
    itemsCount: 5,
    total: 185000,
    paymentMethod: 'Naqd',
    status: 'completed',
  },
  {
    id: 'TRX-1081',
    time: '21:05',
    cashier: 'Rustam Q.',
    itemsCount: 2,
    total: 94000,
    paymentMethod: 'Karta (Humo)',
    status: 'completed',
  },
  {
    id: 'TRX-1080',
    time: '20:48',
    cashier: 'Rustam Q.',
    itemsCount: 11,
    total: 420000,
    paymentMethod: 'Karta (Uzcard)',
    status: 'completed',
  },
  {
    id: 'TRX-1079',
    time: '20:30',
    cashier: 'Rustam Q.',
    itemsCount: 1,
    total: 28000,
    paymentMethod: 'Naqd',
    status: 'completed',
  },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const formatUZS = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val) + ' UZS';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t('dashboard.welcome')}, {user?.firstName}! 👋
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {user?.businessName || 'SMARTPOS'} — {new Date().toLocaleDateString('uz-UZ', { dateStyle: 'full' })}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/pos">
            <Button variant="accent" size="sm" leftIcon={<ShoppingCart className="w-4 h-4" />}>
              {t('dashboard.openPOS')}
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              {t('dashboard.newProduct')}
            </Button>
          </Link>
          <Link to="/purchases">
            <Button variant="secondary" size="sm" leftIcon={<Truck className="w-4 h-4" />}>
              {t('dashboard.newPurchase')}
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.todaySales')}
          value={formatUZS(5420000)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="accent"
          trend="up"
          trendValue="+18.4%"
          subtitle="kechagiga nisbatan"
        />

        <StatCard
          title={t('dashboard.transactionsCount')}
          value="142 ta"
          icon={<Receipt className="w-6 h-6" />}
          color="primary"
          trend="up"
          trendValue="+12"
          subtitle="so‘nggi smenada"
        />

        <StatCard
          title={t('dashboard.totalProducts')}
          value="1,280 ta"
          icon={<Package className="w-6 h-6" />}
          color="info"
          subtitle="18 ta toifada"
        />

        <StatCard
          title={t('dashboard.lowStock')}
          value="14 ta"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="warning"
          trend="down"
          trendValue="Diqqat!"
          subtitle="buyurtma berish lozim"
        />
      </div>

      {/* Main Grid: Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Dynamic Chart */}
        <div className="lg:col-span-2">
          <Card
            title={t('dashboard.salesTrend')}
            subtitle="Bugungi kunlik tushum grafigi (soatlar bo‘yicha)"
            actions={
              <Badge variant="success" size="sm">
                Real vaqtda
              </Badge>
            }
          >
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatUZS(Number(value)), 'Tushum']}
                    labelFormatter={(label) => `Vaqt: ${label}`}
                    contentStyle={{
                      backgroundColor: '#1e3a5f',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent Sales Table */}
        <div className="lg:col-span-1">
          <Card
            title={t('dashboard.recentSales')}
            subtitle="Kassadagi so‘nggi cheklar"
            actions={
              <Link
                to="/sales"
                className="text-xs text-[#1e3a5f] hover:text-[#10b981] font-semibold flex items-center gap-0.5"
              >
                Barchasi <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
            noPadding
          >
            <div className="divide-y divide-gray-100">
              {mockRecentSales.map((sale) => (
                <div key={sale.id} className="p-4 hover:bg-gray-50/70 transition-colors flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-gray-900">{sale.id}</span>
                      <span className="text-[11px] text-gray-400">{sale.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {sale.itemsCount} dona tovar &bull; {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-emerald-600">{formatUZS(sale.total)}</p>
                    <Badge variant="success" size="sm" className="mt-0.5">
                      To‘langan
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
