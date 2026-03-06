import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../api';

const AddHoldingModal = ({ isOpen, onClose, onAdd }) => {
    const [ticker, setTicker] = useState('');
    const { t } = useTranslation();
    const [qty, setQty] = useState('');
    const [avgPrice, setAvgPrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searching, setSearching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const searchStock = async () => {
        if (!ticker.trim()) return;
        setSearching(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/search/?symbol=${ticker.trim()}`);
            if (!res.ok) throw new Error('Stock not found');
            const data = await res.json();
            setSearchResult(data);
            if (data.current_price && !avgPrice) {
                setAvgPrice(data.current_price.toString());
            }
        } catch (e) {
            setError(t('stock_not_found'));
            setSearchResult(null);
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async () => {
        if (!ticker.trim() || !qty || !avgPrice) {
            setError(t('fill_required_fields'));
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await onAdd({
                ticker: ticker.trim().toUpperCase(),
                qty: parseInt(qty),
                avg_price: parseFloat(avgPrice),
                purchase_date: purchaseDate || null
            });
            setSuccess(true);
            setTimeout(() => {
                resetForm();
                onClose();
            }, 1200);
        } catch (e) {
            setError(e.message || t('failed_add_holding'));
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setTicker('');
        setQty('');
        setAvgPrice('');
        setPurchaseDate('');
        setSearchResult(null);
        setSuccess(false);
        setError('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-full max-w-md bg-white dark:bg-fintech-card border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Plus size={18} className="text-fintech-cyan dark:text-cyan-500" />
                            {t('add_stock_holding')}
                        </h3>
                        <button onClick={() => { resetForm(); onClose(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                            <X size={18} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <div className="p-12 flex flex-col items-center gap-4">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                <CheckCircle size={48} className="text-emerald-400" />
                            </motion.div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{t('holding_added_success')}</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {/* Stock Search */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    {t('stock_symbol')} *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ticker}
                                        onChange={e => setTicker(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && searchStock()}
                                        placeholder="e.g. RELIANCE, TCS, INFY"
                                        className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none"
                                    />
                                    <button
                                        onClick={searchStock}
                                        disabled={searching}
                                        className="px-4 py-2.5 bg-fintech-cyan/10 dark:bg-cyan-500/10 hover:bg-fintech-cyan/20 dark:hover:bg-cyan-500/20 text-fintech-cyan dark:text-cyan-400 border border-fintech-cyan/20 dark:border-cyan-500/20 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                        {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                    </button>
                                </div>
                                {searchResult && (
                                    <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{searchResult.name}</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500">
                                            CMP: ₹{searchResult.current_price} • {searchResult.suggestion || 'Market'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Quantity & Price */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('quantity')} *
                                    </label>
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={e => setQty(e.target.value)}
                                        placeholder="10"
                                        min="1"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('avg_buy_price')} *
                                    </label>
                                    <input
                                        type="number"
                                        value={avgPrice}
                                        onChange={e => setAvgPrice(e.target.value)}
                                        placeholder="1500.00"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Purchase Date (optional) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                    {t('purchase_date_optional')}
                                </label>
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={e => setPurchaseDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <p className="text-xs text-red-500 font-medium">{error}</p>
                            )}

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !ticker || !qty || !avgPrice}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <><Loader2 size={16} className="animate-spin" /> {t('adding')}</>
                                ) : (
                                    <><Plus size={16} /> {t('add_to_portfolio')}</>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AddHoldingModal;
