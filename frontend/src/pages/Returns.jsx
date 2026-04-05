import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdSearch, MdAssignmentReturn, MdCheckCircle } from 'react-icons/md';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const Returns = () => {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [bills, setBills] = useState([]);
    const [selectedBill, setSelectedBill] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(null);

    // Auto-load bill from URL param
    useEffect(() => {
        const billId = searchParams.get('bill');
        if (billId) {
            api.get(`/bills/${billId}`).then(({ data }) => {
                selectBill(data.bill);
            }).catch(() => { });
        }
    }, [searchParams]);

    const searchBills = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/bills?limit=10`);
            // Filter by bill number or customer name client-side
            const filtered = data.bills.filter(b =>
                b.billNumber?.toLowerCase().includes(query.toLowerCase()) ||
                b.customer?.name?.toLowerCase().includes(query.toLowerCase()) ||
                b.customerSnapshot?.name?.toLowerCase().includes(query.toLowerCase())
            );
            setBills(filtered);
        } catch { toast.error('Search failed'); }
        finally { setLoading(false); }
    };

    const selectBill = (bill) => {
        setSelectedBill(bill);
        setBills([]);
        setQuery('');
        setSuccess(null);
        // Init return items (all unchecked, qty 0)
        setReturnItems(
            bill.items.map(item => ({
                itemId: item._id,
                itemName: item.itemName,
                price: item.price,
                maxQty: item.quantity - (item.returnedQuantity || 0),
                quantity: 0,
                selected: false,
            }))
        );
    };

    const updateReturnItem = (idx, field, value) => {
        setReturnItems(prev => prev.map((item, i) =>
            i === idx ? { ...item, [field]: value } : item
        ));
    };

    const totalRefund = returnItems
        .filter(i => i.selected && i.quantity > 0)
        .reduce((sum, i) => sum + i.price * i.quantity, 0);

    const processReturn = async () => {
        const itemsToReturn = returnItems.filter(i => i.selected && i.quantity > 0);
        if (itemsToReturn.length === 0) { toast.error('Select items to return'); return; }

        setProcessing(true);
        try {
            const { data } = await api.post(`/bills/${selectedBill._id}/return`, {
                returnItems: itemsToReturn.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
                reason,
            });
            setSuccess({ refund: data.totalRefund, bill: data.bill });
            toast.success(`Refund of ${formatCurrency(data.totalRefund)} processed!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Return failed');
        } finally { setProcessing(false); }
    };

    return (
        <div className="space-y-5 max-w-3xl mx-auto">
            <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Returns & Refunds</h1>
                <p className="text-sm text-slate-500 mt-0.5">Search a bill and select items to return</p>
            </div>

            {/* Search */}
            {!selectedBill && (
                <div className="card p-5">
                    <label className="label">Search Bill</label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                className="input pl-10"
                                placeholder="Bill number or customer name..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchBills()}
                            />
                        </div>
                        <button onClick={searchBills} disabled={loading} className="btn-primary">
                            {loading
                                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : 'Search'}
                        </button>
                    </div>

                    {/* Results */}
                    {bills.length > 0 && (
                        <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            {bills.map((bill) => (
                                <button
                                    key={bill._id}
                                    onClick={() => selectBill(bill)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800
                             border-b last:border-0 border-slate-100 dark:border-slate-700 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-mono font-semibold text-blue-600 text-sm">{bill.billNumber}</span>
                                            <span className="text-slate-500 text-sm ml-3">
                                                {bill.customer?.name || bill.customerSnapshot?.name || 'Walk-in'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm">{formatCurrency(bill.totalAmount)}</p>
                                            <p className="text-xs text-slate-400">{formatDate(bill.createdAt)}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {bills.length === 0 && query && !loading && (
                        <p className="text-center text-sm text-slate-400 mt-4">No bills found for "{query}"</p>
                    )}
                </div>
            )}

            {/* Selected Bill Return Form */}
            {selectedBill && !success && (
                <div className="space-y-4">
                    {/* Bill info */}
                    <div className="card p-4 flex items-center justify-between">
                        <div>
                            <span className="font-mono font-semibold text-blue-600">{selectedBill.billNumber}</span>
                            <span className="text-slate-500 text-sm ml-3">
                                {selectedBill.customer?.name || selectedBill.customerSnapshot?.name || 'Walk-in'}
                            </span>
                            <span className="text-slate-400 text-xs ml-3">{formatDate(selectedBill.createdAt)}</span>
                        </div>
                        <button onClick={() => setSelectedBill(null)} className="btn-secondary text-sm">Change Bill</button>
                    </div>

                    {/* Items selection */}
                    <div className="card overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Select Items to Return</p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {returnItems.map((item, idx) => (
                                <div key={idx} className={`flex items-center gap-4 px-5 py-4 transition-colors
                  ${item.selected ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={item.selected}
                                        disabled={item.maxQty === 0}
                                        onChange={(e) => updateReturnItem(idx, 'selected', e.target.checked)}
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{item.itemName}</p>
                                        <p className="text-xs text-slate-400">
                                            {formatCurrency(item.price)} × {item.maxQty} returnable
                                            {item.maxQty === 0 && <span className="text-red-400 ml-2">(already returned)</span>}
                                        </p>
                                    </div>
                                    {item.selected && (
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-slate-500">Qty:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={item.maxQty}
                                                value={item.quantity || 1}
                                                onChange={(e) => updateReturnItem(idx, 'quantity', Math.min(parseInt(e.target.value) || 1, item.maxQty))}
                                                className="input w-16 py-1.5 text-center text-sm"
                                            />
                                        </div>
                                    )}
                                    {item.selected && item.quantity > 0 && (
                                        <div className="text-right min-w-[80px]">
                                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                                - {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reason + Total + Submit */}
                    <div className="card p-5 space-y-4">
                        <div>
                            <label className="label">Return Reason</label>
                            <input className="input" placeholder="e.g. Defective product, wrong item..."
                                value={reason} onChange={(e) => setReason(e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-sm text-slate-500">Total Refund</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(totalRefund)}</p>
                            </div>
                            <button
                                onClick={processReturn}
                                disabled={processing || totalRefund === 0}
                                className="btn-danger text-base px-6 py-3"
                            >
                                {processing
                                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <MdAssignmentReturn size={20} />}
                                Process Refund
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success state */}
            {success && (
                <div className="card p-10 text-center">
                    <MdCheckCircle size={56} className="mx-auto text-green-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Refund Processed!</h2>
                    <p className="text-slate-500 mt-2">
                        Refund of <span className="font-bold text-green-600">{formatCurrency(success.refund)}</span> has been recorded.
                    </p>
                    <div className="flex gap-3 justify-center mt-6">
                        <button onClick={() => { setSelectedBill(null); setSuccess(null); }} className="btn-secondary">
                            New Return
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Returns;