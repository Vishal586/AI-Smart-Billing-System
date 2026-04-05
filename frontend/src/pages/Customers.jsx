import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdAdd, MdSearch, MdPeople, MdClose } from 'react-icons/md';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
    const navigate = useNavigate();

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/customers?search=${search}&limit=30`);
            setCustomers(data.customers);
        } catch { toast.error('Failed to load customers'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const t = setTimeout(fetchCustomers, 300);
        return () => clearTimeout(t);
    }, [search]);

    const createCustomer = async (e) => {
        e.preventDefault();
        if (!form.name) { toast.error('Name is required'); return; }
        setSaving(true);
        try {
            const { data } = await api.post('/customers', form);
            toast.success('Customer added!');
            setShowModal(false);
            setForm({ name: '', phone: '', email: '', address: '', notes: '' });
            navigate(`/customers/${data.customer._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add customer');
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Customers</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{customers.length} registered customers</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary">
                    <MdAdd size={18} />Add Customer
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input className="input pl-10" placeholder="Search by name or phone..."
                    value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : customers.length === 0 ? (
                <div className="card text-center py-20 text-slate-400">
                    <MdPeople size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No customers found</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
                        <MdAdd size={18} />Add First Customer
                    </button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((c) => (
                        <Link key={c._id} to={`/customers/${c._id}`}
                            className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 block">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600
                                flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {c.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-white truncate">{c.name}</p>
                                    {c.phone && <p className="text-xs text-slate-500 mt-0.5">{c.phone}</p>}
                                    {c.address && <p className="text-xs text-slate-400 truncate">{c.address}</p>}
                                </div>
                            </div>
                            <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="text-xs text-slate-400">Purchases</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c.totalPurchases}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400">Total Spent</p>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatCurrency(c.totalSpent)}</p>
                                </div>
                                {c.lastVisit && (
                                    <div className="ml-auto">
                                        <p className="text-xs text-slate-400">Last visit</p>
                                        <p className="text-xs text-slate-500">{formatDate(c.lastVisit)}</p>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Add Customer Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Add New Customer</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <MdClose size={22} />
                            </button>
                        </div>
                        <form onSubmit={createCustomer} className="space-y-4">
                            <div>
                                <label className="label">Name *</label>
                                <input className="input" placeholder="Customer name" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Phone</label>
                                    <input className="input" placeholder="+91 98765..." value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input className="input" type="email" placeholder="email@..." value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Address</label>
                                <input className="input" placeholder="Address" value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Add Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;