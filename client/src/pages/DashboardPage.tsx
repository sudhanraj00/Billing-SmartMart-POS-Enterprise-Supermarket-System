import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatCurrency } from '../hooks/useCurrency';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  TrendingUp,
  Receipt,
  CircleDollarSign,
  PackageCheck,
  AlertTriangle,
  Clock,
  Users,
  Boxes,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { metrics, salesTrend, topProducts, recentInvoices, recentAdjustments } = data;

  const kpis = [
    {
      label: "Today's Sales",
      value: formatCurrency(metrics.todaySales),
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50',
    },
    {
      label: "Today's Invoices",
      value: metrics.todayInvoices,
      icon: <Receipt className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50',
    },
    {
      label: 'Estimated Profit',
      value: formatCurrency(metrics.todayProfit),
      icon: <CircleDollarSign className="w-5 h-5 text-teal-600" />,
      bg: 'bg-teal-50',
    },
    {
      label: 'Total Items Sold',
      value: metrics.totalItemsSold,
      icon: <PackageCheck className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50',
    },
    {
      label: 'Low Stock Alert',
      value: metrics.lowStockCount,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50',
    },
    {
      label: 'Out of Stock',
      value: metrics.outOfStockCount,
      icon: <Boxes className="w-5 h-5 text-rose-600" />,
      bg: 'bg-rose-50',
    },
    {
      label: 'Expiring Soon (30d)',
      value: metrics.expiringCount,
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      bg: 'bg-orange-50',
    },
    {
      label: 'Customer Dues',
      value: formatCurrency(metrics.pendingCustomerDues),
      icon: <Users className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Executive Dashboard</h1>
        <p className="text-xs text-gray-500">Real-time supermarket metrics, sales trends, and inventory health</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-semibold text-gray-500 block">{kpi.label}</span>
              <span className="text-lg font-black text-gray-900 block mt-0.5 tracking-tight">
                {kpi.value}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 7-Day Revenue Trend (7 cols) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader
              title="7-Day Sales Trend"
              subtitle="Daily supermarket gross revenue"
              action={
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4" /> Live
                </span>
              }
            />
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip
                      formatter={(val: any) => [`₹${val}`, 'Sales Revenue']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Top Selling Products (5 cols) */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="Top Selling Products" subtitle="By unit sales volume" />
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={90}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(val) => (val.length > 12 ? `${val.slice(0, 12)}…` : val)}
                    />
                    <Tooltip
                      formatter={(val: any) => [val, 'Units Sold']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="quantity" fill="#0284c7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Recent Invoices & Recent Stock Adjustments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Invoices */}
        <Card>
          <CardHeader title="Recent Invoices" subtitle="Latest completed checkout transactions" />
          <div className="divide-y divide-gray-100 text-xs">
            {recentInvoices.map((inv: any) => (
              <div key={inv.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <span className="font-bold text-gray-900 block">{inv.invoiceNumber}</span>
                  <span className="text-gray-400 text-[11px]">
                    {new Date(inv.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Cashier: {inv.cashier?.fullName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-gray-900 block">{formatCurrency(inv.grandTotal)}</span>
                  <Badge variant={inv.status === 'COMPLETED' ? 'success' : 'warning'} className="text-[10px]">
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Stock Adjustments */}
        <Card>
          <CardHeader title="Recent Stock Adjustments" subtitle="Audit log of inventory corrections" />
          <div className="divide-y divide-gray-100 text-xs">
            {recentAdjustments.map((adj: any) => (
              <div key={adj.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <span className="font-bold text-gray-900 block">{adj.product?.name}</span>
                  <span className="text-gray-400 text-[11px]">
                    {adj.reason || adj.movementType} &bull; By {adj.user?.fullName}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-extrabold block ${
                      adj.quantityChanged > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {adj.quantityChanged > 0 ? `+${adj.quantityChanged}` : adj.quantityChanged}
                  </span>
                  <span className="text-[10px] text-gray-400">Stock: {adj.newQuantity}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
