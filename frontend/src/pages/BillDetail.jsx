import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdPrint, MdArrowBack, MdAssignmentReturn, MdPerson } from 'react-icons/md';
import api from '../api/axios';
import { formatCurrency, formatDateTime, statusColor, generatePDF } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BillDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/bills/${id}`)
            .then(({ data }) => setBill(data.bill))
            .catch(() => toast.error('Bill not found'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
    if (!bill) return <div className="text-center py-20 text-slate-400">Bill not found</div>;

    const cust = bill.customer || bill.customerSnapshot || {};

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Toolbar */}
            <div className="flex items-center justify-between no-print">
                <Link to="/bills" className="btn-secondary text-sm gap-1.5">
                    <MdArrowBack size={16} />
                    Back
                </Link>
                <div className="flex gap-2">
                    <Link to={`/returns?bill=${id}`} className="btn-secondary text-sm">
                        <MdAssignmentReturn size={16} />
                        Return
                    </Link>
                    <button onClick={() => generatePDF(bill, user)} className="btn-primary text-sm">
                        <MdPrint size={16} />
                        Print / PDF
                    </button>
                </div>
            </div>

            {/* Invoice */}
            <div className="card overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 px-8 py-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold">{user?.shopName}</h1>
                            {user?.phone && <p className="text-blue-200 text-sm mt-1">{user.phone}</p>}
                            {user?.gstNumber && <p className="text-blue-200 text-sm">GST: {user.gstNumber}</p>}
                        </div>
                        <div className="text-right">
                            <p className="text-blue-200 text-sm font-medium">INVOICE</p>
                            <p className="text-xl font-bold font-mono">{bill.billNumber}</p>
                            <p className="text-blue-200 text-sm mt-1">{formatDateTime(bill.createdAt)}</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 space-y-6">
                    {/* Customer & Status */}
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bill To</p>
                            <p className="font-semibold text-slate-800 dark:text-white">{cust.name || 'Walk-in Customer'}</p>
                            {cust.phone && <p className="text-sm text-slate-500">{cust.phone}</p>}
                            {cust.address && <p className="text-sm text-slate-500">{cust.address}</p>}
                        </div>
                        <div className="text-right">
                            <span className={`badge ${statusColor(bill.paymentStatus)} text-sm px-3 py-1`}>
                                {bill.paymentStatus?.toUpperCase()}
                            </span>
                            <p className="text-sm text-slate-500 mt-2">{bill.paymentMethod?.toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Items */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                                <th className="text-left py-2 text-slate-500 font-semibold">#</th>
                                <th className="text-left py-2 text-slate-500 font-semibold">Item</th>
                                <th className="text-right py-2 text-slate-500 font-semibold">Price</th>
                                <th className="text-right py-2 text-slate-500 font-semibold">Qty</th>
                                <th className="text-right py-2 text-slate-500 font-semibold">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {bill.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="py-3 text-slate-400">{i + 1}</td>
                                    <td className="py-3 font-medium text-slate-700 dark:text-slate-200">{item.itemName}</td>
                                    <td className="py-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.price)}</td>
                                    <td className="py-3 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                    <td className="py-3 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>Subtotal</span><span>{formatCurrency(bill.subtotal)}</span>
                            </div>
                            {bill.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span><span>- {formatCurrency(bill.discountAmount)}</span>
                                </div>
                            )}
                            {bill.gstEnabled && (
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                    <span>GST ({bill.gstRate}%)</span><span>{formatCurrency(bill.gstAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-base text-slate-800 dark:text-white border-t border-slate-200 dark:border-slate-600 pt-2">
                                <span>Total</span>
                                <span className="text-blue-600">{formatCurrency(bill.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {bill.notes && (
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Notes</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{bill.notes}</p>
                        </div>
                    )}

                    {/* Return history */}
                    {bill.returnHistory?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Return History</p>
                            {bill.returnHistory.map((r, i) => (
                                <div key={i} className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 mb-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-red-700 dark:text-red-400">Refund: {formatCurrency(r.totalRefund)}</span>
                                        <span className="text-slate-400">{formatDateTime(r.date)}</span>
                                    </div>
                                    {r.reason && <p className="text-slate-500 mt-1">{r.reason}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillDetail;