import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdEdit, MdAdd, MdReceipt, MdPhone, MdLocationOn, MdEmail, MdClose, MdDelete } from 'react-icons/md';
import api from '../api/axios';
import { formatCurrency, formatDate, statusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const CustomerDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get(`/customers/${id}`)
            .then(({ data }) => {
                setCustomer(data.customer);
                setBills(data.bills);
                setForm(data.customer);
            })
            .catch(() => toast.error('Customer not found'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.put(`/customers/${id}`, form);
            setCustomer(data.customer);
            setEditModal(false);
            toast.success('Customer updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this customer? Their bill history will remain.')) return;
        try {
            await api.delete(`/customers/${id}`);
            toast.success('Customer deleted');
            navigate('/customers');
        } catch { toast.error('Delete failed'); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!customer) return <div className="text-center py-20 text-slate-400">Customer not found</div>;

    return (
        <div className="space-y-5 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to="/customers" className="btn-secondary gap-1.5">
                    <MdArrowBack size={16} />Back
                </Link>
                <div className="flex gap-2">
                    <button onClick={() => setEditModal(true)} className="btn-secondary">
                        <MdEdit size={16} />Edit
                    </button>
                    <Link to={`/bills/new?customer=${id}`} className="btn-primary">
                        <MdAdd size={16} />New Bill
                    </Link>
                </div>
            </div>

            {/* Profile card */}
            <div className="card p-6">
                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600
                          flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                        {customer.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{customer.name}</h1>
                        <div className="flex flex-wrap gap-4 mt-2">
                            {customer.phone && (
                                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <MdPhone size={16} className="text-slate-400" />{customer.phone}
                                </span>
                            )}
                            {customer.email && (
                                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <MdEmail size={16} className="text-slate-400" />{customer.email}
                                </span>
                            )}
                            {customer.address && (
                                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <MdLocationOn size={16} className="text-slate-400" />{customer.address}
                                </span>
                            )}
                        </div>
                        {customer.notes && (
                            <p className="text-sm text-slate-500 mt-2 italic">"{customer.notes}"</p>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{customer.totalPurchases}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Total Purchases</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(customer.totalSpent)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Total Spent</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                            {customer.lastVisit ? formatDate(customer.lastVisit) : '—'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Last Visit</p>
                    </div>
                </div>
            </div>

            {/* Bill History */}
            <div className="card">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <MdReceipt className="text-slate-400" />
                        Purchase History
                        <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ml-1">{bills.length}</span>
                    </h2>
                </div>
                {bills.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <MdReceipt size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No bills yet</p>
                        <Link to={`/bills/new?customer=${id}`} className="btn-primary mx-auto mt-4">
                            <MdAdd size={16} />Create First Bill
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    {['Bill #', 'Date', 'Items', 'Amount', 'Payment', 'Status', ''].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {bills.map((bill) => (
                                    <tr key={bill._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3.5 font-mono font-medium text-blue-600 text-xs">{bill.billNumber}</td>
                                        <td className="px-4 py-3.5 text-slate-500 text-xs">{formatDate(bill.createdAt)}</td>
                                        <td className="px-4 py-3.5 text-slate-500">{bill.items?.length} items</td>
                                        <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-white">{formatCurrency(bill.totalAmount)}</td>
                                        <td className="px-4 py-3.5 text-slate-500 capitalize">{bill.paymentMethod}</td>
                                        <td className="px-4 py-3.5">
                                            <span className={`badge ${statusColor(bill.paymentStatus)}`}>{bill.paymentStatus}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <Link to={`/bills/${bill._id}`} className="text-xs text-blue-600 hover:underline font-medium">View</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete zone */}
            <div className="card p-4 border-red-100 dark:border-red-900/30">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Danger Zone</p>
                        <p className="text-xs text-slate-400 mt-0.5">Permanently delete this customer record</p>
                    </div>
                    <button onClick={handleDelete} className="btn-danger text-sm">
                        <MdDelete size={16} />Delete Customer
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="card w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Edit Customer</h2>
                            <button onClick={() => setEditModal(false)} className="text-slate-400 hover:text-slate-600"><MdClose size={22} /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            {[
                                { label: 'Name *', key: 'name', required: true },
                                { label: 'Phone', key: 'phone' },
                                { label: 'Email', key: 'email', type: 'email' },
                                { label: 'Address', key: 'address' },
                                { label: 'Notes', key: 'notes' },
                            ].map(({ label, key, type = 'text', required }) => (
                                <div key={key}>
                                    <label className="label">{label}</label>
                                    <input className="input" type={type} required={required}
                                        value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDetail;