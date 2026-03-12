import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpDown, BarChart2, Trash2, Edit2, Check, X } from 'lucide-react';
import PredictiveChart from './PredictiveChart';
import { SignalBadge } from './AlertBanner';

const HoldingsTable = ({ holdings = [], onDelete, onUpdate, signals = {} }) => {
    const { t } = useTranslation();
    const [analyzingStock, setAnalyzingStock] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editQty, setEditQty] = useState('');
    const [editAvg, setEditAvg] = useState('');

    const startEdit = (stock) => {
        setEditingId(stock.id);
        setEditQty(stock.qty.toString());
        setEditAvg(stock.avg.toString());
    };

    const saveEdit = (stock) => {
        if (onUpdate && editQty && editAvg) {
            onUpdate(stock.id, {
                qty: parseInt(editQty),
                avg_price: parseFloat(editAvg)
            });
        }
        setEditingId(null);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl overflow-hidden"
            >
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('holdings', 'Holdings')}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{holdings.length} {t('stocks')}</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-white/5 text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-3 py-3 text-left">
                                    <div className="flex items-center gap-1">{t('instrument')} <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th className="px-3 py-3 text-right">{t('qty')}</th>
                                <th className="px-3 py-3 text-right text-xs">{t('avg_price')}</th>
                                <th className="px-3 py-3 text-right">{t('ltp')}</th>
                                <th className="px-3 py-3 text-right">{t('pnl')}</th>
                                <th className="px-3 py-3 text-center">{t('signal')}</th>
                                <th className="px-3 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            {holdings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {t('no_holdings_yet')}
                                    </td>
                                </tr>
                            ) : holdings.filter(s => s && s.qty != null).map((stock) => {
                                const avg = stock.avg || 0;
                                const ltp = stock.ltp || avg;
                                const qty = stock.qty || 0;
                                const currentValue = qty * ltp;
                                const investedValue = qty * avg;
                                const pnl = currentValue - investedValue;
                                const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
                                const isProfit = pnl >= 0;
                                const isEditing = editingId === stock.id;

                                return (
                                    <tr key={stock.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{stock.name}</span>
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">{stock.ticker}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-gray-700 dark:text-gray-300">
                                            {isEditing ? (
                                                <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)}
                                                    className="w-16 px-2 py-1 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-right text-xs text-gray-900 dark:text-white" />
                                            ) : qty}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-gray-700 dark:text-gray-300">
                                            {isEditing ? (
                                                <input type="number" step="0.01" value={editAvg} onChange={e => setEditAvg(e.target.value)}
                                                    className="w-20 px-2 py-1 bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded text-right text-xs text-gray-900 dark:text-white" />
                                            ) : `₹${avg.toFixed(2)}`}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs font-medium text-gray-900 dark:text-white">
                                            ₹{ltp.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs">
                                            <div className={`flex flex-col items-end ${isProfit ? 'text-emerald-600 dark:text-neon-emerald' : 'text-red-500'}`}>
                                                <span className="font-bold flex items-center gap-1">
                                                    {isProfit ? '+' : ''}₹{Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                    {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                </span>
                                                <span className="text-[10px] opacity-80">
                                                    ({isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-center">
                                            {(() => {
                                                const sig = signals[stock.id];
                                                return sig ? (
                                                    <div className="group/sig relative inline-block">
                                                        <SignalBadge signal={sig.signal} />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-fintech-card border border-white/10 rounded-lg text-left opacity-0 group-hover/sig:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                                            <p className="text-[10px] text-gray-600 dark:text-gray-300 mb-1">{sig.reason}</p>
                                                            <p className="text-[10px] text-fintech-emerald dark:text-emerald-400 font-bold">{sig.action}</p>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-[10px] text-gray-500">—</span>;
                                            })()}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={() => saveEdit(stock)}
                                                            className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-emerald-500 transition-all" title="Save">
                                                            <Check size={14} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)}
                                                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-all" title="Cancel">
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => setAnalyzingStock(stock.ticker)}
                                                            className="p-1.5 hover:bg-fintech-emerald/10 dark:hover:bg-emerald-500/10 rounded-lg text-fintech-emerald dark:text-neon-emerald transition-all" title="Prediction">
                                                            <BarChart2 size={14} />
                                                        </button>
                                                        <button onClick={() => startEdit(stock)}
                                                            className="p-1.5 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-all opacity-0 group-hover:opacity-100" title="Edit">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => onDelete && onDelete(stock.id)}
                                                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-all opacity-0 group-hover:opacity-100" title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

            </motion.div>

            {/* Prediction Modal — outside motion.div so fixed positioning works */}
            {analyzingStock && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer"
                    onClick={() => setAnalyzingStock(null)}>
                    <div className="w-full max-w-3xl cursor-default" onClick={e => e.stopPropagation()}>
                        <PredictiveChart
                            symbol={analyzingStock}
                            onClose={() => setAnalyzingStock(null)}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default HoldingsTable;
