import { useState } from 'react';
import { MdAdd, MdDelete, MdEdit, MdCheck, MdClose } from 'react-icons/md';
import { formatCurrency } from '../../utils/helpers';

const BillItemsTable = ({ items, onItemsChange }) => {
    const [editIdx, setEditIdx] = useState(null);
    const [newItem, setNewItem] = useState({ itemName: '', price: '', quantity: 1 });

    const updateItem = (idx, field, value) => {
        const updated = [...items];
        updated[idx] = { ...updated[idx], [field]: value };
        updated[idx].subtotal = updated[idx].price * updated[idx].quantity;
        onItemsChange(updated);
    };

    const removeItem = (idx) => onItemsChange(items.filter((_, i) => i !== idx));

    const addItem = () => {
        if (!newItem.itemName || !newItem.price) return;
        const item = {
            itemName: newItem.itemName,
            price: parseFloat(newItem.price),
            quantity: parseInt(newItem.quantity) || 1,
            subtotal: parseFloat(newItem.price) * (parseInt(newItem.quantity) || 1),
        };
        onItemsChange([...items, item]);
        setNewItem({ itemName: '', price: '', quantity: 1 });
    };

    return (
        <div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Item</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Price</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Qty</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Subtotal</th>
                            <th className="px-4 py-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-slate-400 dark:text-slate-500">
                                    No items yet. Add items below or use AI entry ↑
                                </td>
                            </tr>
                        )}
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                {editIdx === idx ? (
                                    <>
                                        <td className="px-4 py-2">
                                            <input className="input py-1.5 text-sm" value={item.itemName}
                                                onChange={(e) => updateItem(idx, 'itemName', e.target.value)} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input className="input py-1.5 text-sm text-right" type="number" value={item.price}
                                                onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <input className="input py-1.5 text-sm text-right" type="number" value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                                        <td className="px-4 py-2">
                                            <button onClick={() => setEditIdx(null)} className="p-1 text-green-500 hover:bg-green-50 rounded-lg"><MdCheck size={16} /></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{item.itemName}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(item.price)}</td>
                                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-white">{formatCurrency(item.subtotal)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => setEditIdx(idx)} className="p-1 text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><MdEdit size={15} /></button>
                                                <button onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><MdDelete size={15} /></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {/* Add new item row */}
                        <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                            <td className="px-4 py-2">
                                <input
                                    className="input py-1.5 text-sm"
                                    placeholder="Item name"
                                    value={newItem.itemName}
                                    onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    className="input py-1.5 text-sm text-right"
                                    type="number"
                                    placeholder="Price"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                />
                            </td>
                            <td className="px-4 py-2">
                                <input
                                    className="input py-1.5 text-sm text-right"
                                    type="number"
                                    min="1"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                                />
                            </td>
                            <td className="px-4 py-2 text-right text-slate-400 text-sm">
                                {newItem.price && newItem.quantity ? formatCurrency(parseFloat(newItem.price) * parseInt(newItem.quantity)) : '—'}
                            </td>
                            <td className="px-4 py-2">
                                <button onClick={addItem} disabled={!newItem.itemName || !newItem.price}
                                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-all">
                                    <MdAdd size={16} />
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillItemsTable;