import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdSave, MdPrint, MdPersonAdd, MdPerson } from 'react-icons/md';
import api from '../api/axios';
import AIInputPanel from '../components/billing/AIInputPanel';
import BillItemsTable from '../components/billing/BillItemsTable';
import BillSummary from '../components/billing/BillSummary';
import { generatePDF } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NewBill = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [items, setItems] = useState([]);
    const [discount, setDiscount] = useState({ type: 'none', value: 0 });
    const [gst, setGst] = useState({ enabled: user?.settings?.gstEnabled || false, rate: user?.settings?.gstRate || 18 });
    const [customer, setCustomer] = useState({ id: '', name: '', phone: '', address: '' });
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentStatus, setPaymentStatus] = useState('paid');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [savedBill, setSavedBill] = useState(null);

    // Pre-fill customer if coming from customer page
    useEffect(() => {
        const custId = searchParams.get('customer');
        if (custId) {
            api.get(`/customers/${custId}`).then(({ data }) => {
                const c = data.customer;
                setCustomer({ id: c._id, name: c.name, phone: c.phone || '', address: c.address || '' });
            }).catch(() => { });
        }
    }, [searchParams]);

    const searchCustomers = async (q) => {
        if (q.length < 2) { setCustomerResults([]); return; }
        try {
            const { data } = await api.get(`/customers?search=${q}&limit=5`);
            setCustomerResults(data.customers);
        } catch { }
    };

    const selectCustomer = (c) => {
        setCustomer({ id: c._id, name: c.name, phone: c.phone || '', address: c.address || '' });
        setCustomerSearch('');
        setCustomerResults([]);
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        let discountAmount = 0;
        if (discount.type === 'percentage' && discount.value > 0)
            discountAmount = (subtotal * discount.value) / 100;
        else if (discount.type === 'fixed' && discount.value > 0)
            discountAmount = Math.min(discount.value, subtotal);
        const taxable = subtotal - discountAmount;
        const gstAmount = gst.enabled ? (taxable * gst.rate) / 100 : 0;
        return { subtotal, discountAmount, gstAmount, totalAmount: taxable + gstAmount };
    };

    const saveBill = async (status = 'final') => {
        if (items.length === 0) { toast.error('Add at least one item'); return; }
        setSaving(true);
        const { subtotal, discountAmount, gstAmount, totalAmount } = calculateTotals();
        try {
            const payload = {
                customerId: customer.id || undefined,
                customerName: customer.name || 'Walk-in Customer',
                customerPhone: customer.phone,
                customerAddress: customer.address,
                items,
                discountType: discount.type,
                discountValue: discount.value,
                gstEnabled: gst.enabled,
                gstRate: gst.rate,
                paymentMethod,
                paymentStatus,
                paidAmount: totalAmount,
                notes,
                status,
            };
            const { data } = await api.post('/bills', payload);
            setSavedBill(data.bill);
            toast.success(status === 'draft' ? 'Draft saved!' : 'Bill created!');
            if (status === 'final') navigate(`/bills/${data.bill._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save bill');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Create New Bill</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Add items manually or use AI entry</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => saveBill('draft')} disabled={saving} className="btn-secondary">
                        <MdSave size={18} />
                        Save Draft
                    </button>
                    <button onClick={() => saveBill('final')} disabled={saving || items.length === 0} className="btn-primary">
                        {saving
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <MdPrint size={18} />}
                        Generate Bill
                    </button>
                </div>
            </div>

            {/* AI Input */}
            <AIInputPanel onItemsParsed={(parsed) => setItems((prev) => [...prev, ...parsed])} />

            <div className="grid lg:grid-cols-3 gap-5">
                {/* Left: Items */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Bill Items</h2>
                        <BillItemsTable items={items} onItemsChange={setItems} />
                    </div>
                </div>

                {/* Right: Customer & Summary */}
                <div className="space-y-4">
                    {/* Customer section */}
                    <div className="card p-5">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <MdPerson className="text-slate-400" />
                            Customer
                        </h3>

                        {customer.id ? (
                            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2.5">
                                <div>
                                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{customer.name}</p>
                                    {customer.phone && <p className="text-xs text-slate-500">{customer.phone}</p>}
                                </div>
                                <button onClick={() => setCustomer({ id: '', name: '', phone: '', address: '' })}
                                    className="text-xs text-red-500 hover:underline">Remove</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Search existing */}
                                <div className="relative">
                                    <input
                                        className="input"
                                        placeholder="Search customer..."
                                        value={customerSearch}
                                        onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                                    />
                                    {customerResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg z-10 overflow-hidden">
                                            {customerResults.map((c) => (
                                                <button key={c._id} onClick={() => selectCustomer(c)}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">
                                                    <p className="font-medium">{c.name}</p>
                                                    {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <p className="text-xs text-slate-400 text-center">— or enter manually —</p>

                                <input className="input" placeholder="Customer name"
                                    value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                                <input className="input" placeholder="Phone number"
                                    value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                            </div>
                        )}
                    </div>

                    {/* Payment */}
                    <div className="card p-5 space-y-3">
                        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Payment</h3>
                        <div>
                            <label className="label">Method</label>
                            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Notes</label>
                            <textarea className="input resize-none" rows={2} placeholder="Optional note..."
                                value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                    </div>

                    {/* Summary */}
                    <BillSummary items={items} discount={discount} setDiscount={setDiscount} gst={gst} setGst={setGst} />
                </div>
            </div>
        </div>
    );
};

export default NewBill;