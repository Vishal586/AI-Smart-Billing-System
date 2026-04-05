import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdAdd, MdSearch, MdReceipt, MdFilterList } from 'react-icons/md';
import api from '../api/axios';
import { formatCurrency, formatDate, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const Bills = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15 });
            if (statusFilter) params.append('status', statusFilter);
            const { data } = await api.get(`/bills?${params}`);
            setBills(data.bills);
            setTotalPages(data.pages);
            setTotal(data.total);
        } catch { toast.error('Failed to load bills'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBills(); }, [page, statusFilter]);

    const filtered = bills.filter((b) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            b.billNumber?.toLowerCase().includes(q) ||
            b.customer?.name?.toLowerCase().includes(q) ||
            b.customerSnapshot?.name?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Bills</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{total} invoices total</p>
                </div>
                <Link to="/bills/new" className="btn-primary">
                    <MdAdd size={18} />New Bill
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input className="input pl-10" placeholder="Search bills or customers..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                    <MdFilterList className="text-slate-400" size={18} />
                    <select className="input w-36" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">All Status</option>
                        <option value="final">Final</option>
                        <option value="draft">Draft</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    {['Bill #', 'Customer', 'Date', 'Items', 'Amount', 'Payment', 'Status', ''].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-16 text-slate-400">
                                            <MdReceipt size={40} className="mx-auto mb-3 opacity-30" />
                                            <p>No bills found</p>
                                            <Link to="/bills/new" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Create first bill</Link>
                                        </td>
                                    </tr>
                                ) : filtered.map((bill) => (
                                    <tr key={bill._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3.5 font-mono font-medium text-blue-600 text-xs">{bill.billNumber}</td>
                                        <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                                            {bill.customer?.name || bill.customerSnapshot?.name || 'Walk-in'}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-500 text-xs">{formatDate(bill.createdAt)}</td>
                                        <td className="px-4 py-3.5 text-slate-500">{bill.items?.length} items</td>
                                        <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-white">{formatCurrency(bill.totalAmount)}</td>
                                        <td className="px-4 py-3.5 text-slate-500 capitalize">{bill.paymentMethod}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`badge ${statusColor(bill.paymentStatus)}`}>{bill.paymentStatus}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <Link to={`/bills/${bill._id}`}
                                                className="text-xs text-blue-600 hover:underline font-medium">View</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="btn-secondary text-xs py-1.5 px-3">Prev</button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="btn-secondary text-xs py-1.5 px-3">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bills;