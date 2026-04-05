import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    MdTrendingUp, MdReceipt, MdPeople, MdShoppingCart,
    MdAdd, MdArrowForward
} from 'react-icons/md';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../api/axios';
import StatCard from '../components/dashboard/StatCard';
import { formatCurrency, formatDate, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/bills/dashboard');
                setData(res.data);
            } catch {
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <Link to="/bills/new" className="btn-primary">
                    <MdAdd size={18} />
                    New Bill
                </Link>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Today's Sales"
                    value={formatCurrency(data?.stats.dailySales)}
                    subtitle={`${data?.stats.dailyOrders} orders today`}
                    icon={MdTrendingUp}
                    color="blue"
                />
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(data?.stats.totalRevenue)}
                    subtitle="All time"
                    icon={MdShoppingCart}
                    color="green"
                />
                <StatCard
                    title="Total Bills"
                    value={data?.stats.totalOrders?.toLocaleString()}
                    subtitle="All invoices"
                    icon={MdReceipt}
                    color="orange"
                />
                <StatCard
                    title="Customers"
                    value={data?.stats.totalCustomers?.toLocaleString()}
                    subtitle="Registered"
                    icon={MdPeople}
                    color="purple"
                />
            </div>

            {/* Charts row */}
            <div className="grid lg:grid-cols-3 gap-4">
                {/* Revenue chart */}
                <div className="card p-5 lg:col-span-2">
                    <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Revenue — Last 7 Days</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={data?.last7Days || []}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                                tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
                            <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']}
                                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5}
                                fill="url(#colorRevenue)" dot={{ fill: '#3b82f6', r: 4 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Top items */}
                <div className="card p-5">
                    <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Top Items</h2>
                    {data?.topItems?.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data?.topItems || []} layout="vertical">
                                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                                    {(data?.topItems || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Recent bills */}
            <div className="card">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="font-semibold text-slate-700 dark:text-slate-200">Recent Bills</h2>
                    <Link to="/bills" className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                        View all <MdArrowForward />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bill #</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {data?.recentBills?.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">No bills yet</td></tr>
                            ) : (
                                data?.recentBills?.map((bill) => (
                                    <tr key={bill._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-5 py-3.5 font-mono font-medium text-blue-600">{bill.billNumber}</td>
                                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                                            {bill.customer?.name || bill.customerSnapshot?.name || 'Walk-in'}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500">{formatDate(bill.createdAt)}</td>
                                        <td className="px-5 py-3.5 text-right font-semibold text-slate-800 dark:text-white">{formatCurrency(bill.totalAmount)}</td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`badge ${statusColor(bill.paymentStatus)}`}>{bill.paymentStatus}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;