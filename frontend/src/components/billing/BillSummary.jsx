import { formatCurrency } from '../../utils/helpers';

const BillSummary = ({ items, discount, setDiscount, gst, setGst, userSettings }) => {
    const subtotal = items.reduce((sum, i) => sum + (i.subtotal || i.price * i.quantity), 0);

    let discountAmount = 0;
    if (discount.type === 'percentage' && discount.value > 0) {
        discountAmount = (subtotal * discount.value) / 100;
    } else if (discount.type === 'fixed' && discount.value > 0) {
        discountAmount = Math.min(discount.value, subtotal);
    }

    const taxable = subtotal - discountAmount;
    const gstAmount = gst.enabled ? (taxable * gst.rate) / 100 : 0;
    const total = taxable + gstAmount;

    return (
        <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Bill Summary</h3>

            {/* Discount */}
            <div>
                <label className="label">Discount</label>
                <div className="flex gap-2">
                    <select
                        value={discount.type}
                        onChange={(e) => setDiscount({ ...discount, type: e.target.value, value: 0 })}
                        className="input w-32"
                    >
                        <option value="none">None</option>
                        <option value="percentage">%</option>
                        <option value="fixed">Fixed ₹</option>
                    </select>
                    {discount.type !== 'none' && (
                        <input
                            type="number"
                            className="input flex-1"
                            placeholder={discount.type === 'percentage' ? 'e.g. 10' : 'Amount'}
                            value={discount.value}
                            onChange={(e) => setDiscount({ ...discount, value: parseFloat(e.target.value) || 0 })}
                            min="0"
                            max={discount.type === 'percentage' ? 100 : subtotal}
                        />
                    )}
                </div>
            </div>

            {/* GST Toggle */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="label mb-0">GST</label>
                    <p className="text-xs text-slate-400">Include Goods & Services Tax</p>
                </div>
                <div className="flex items-center gap-3">
                    {gst.enabled && (
                        <div className="flex items-center gap-1.5">
                            <input
                                type="number"
                                className="input w-16 text-center text-sm py-1.5"
                                value={gst.rate}
                                onChange={(e) => setGst({ ...gst, rate: parseFloat(e.target.value) || 0 })}
                            />
                            <span className="text-sm text-slate-500">%</span>
                        </div>
                    )}
                    <button
                        onClick={() => setGst({ ...gst, enabled: !gst.enabled })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${gst.enabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
                            }`}
                    >
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gst.enabled ? 'translate-x-5' : 'translate-x-0.5'
                            }`} />
                    </button>
                </div>
            </div>

            {/* Totals */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Discount {discount.type === 'percentage' ? `(${discount.value}%)` : ''}</span>
                        <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                )}
                {gst.enabled && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>GST ({gst.rate}%)</span>
                        <span>+ {formatCurrency(gstAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-800 dark:text-white border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                    <span>Total</span>
                    <span className="text-blue-600 dark:text-blue-400 text-lg">{formatCurrency(total)}</span>
                </div>
            </div>
        </div>
    );
};

export default BillSummary;