import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE, apiCall } from '../../api';

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
            const res = await apiCall(`/search/?ticker=${ticker.trim()}`);
            if (!res.ok) throw new Error('Stock not found');
            const data = await res.json();
            setSearchResult(data);
            if (data.price && !avgPrice) {
                setAvgPrice(data.price.toString());
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="modal-container"
                    className="fixed inset-0 z-[99998] flex items-end md:items-center justify-center md:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer" 
                        onClick={onClose} 
                    />
                    
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="relative w-full md:max-w-md bg-notion-card border border-notion-border rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-2xl overflow-hidden z-10"
                        onClick={e => e.stopPropagation()}
                    >
                    {/* Mobile Drag Handle */}
                    <div className="w-full flex justify-center pt-4 pb-2 md:hidden shrink-0 bg-notion-bg/50">
                        <div className="w-12 h-1.5 bg-notion-border rounded-full" />
                    </div>
                    {/* Header */}
                    <div className="p-4 md:p-6 border-b border-notion-border flex items-center justify-between bg-notion-bg/50">
                        <h3 className="text-lg font-bold text-notion-text flex items-center gap-2">
                            <Plus size={18} className="text-notion-emerald" />
                            {t('add_stock_holding')}
                        </h3>
                        <button onClick={() => { resetForm(); onClose(); }} className="p-2 hover:bg-notion-hover rounded-lg transition-colors">
                            <X size={18} className="text-notion-muted" />
                        </button>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <div className="p-12 flex flex-col items-center gap-4">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                <CheckCircle size={48} className="text-notion-emerald" />
                            </motion.div>
                            <p className="text-lg font-bold text-notion-text">{t('holding_added_success')}</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {/* Stock Search */}
                            <div>
                                <label className="block text-xs font-bold text-notion-muted uppercase tracking-wider mb-1.5">
                                    {t('stock_symbol')} *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ticker}
                                        onChange={e => setTicker(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && searchStock()}
                                        placeholder="e.g. RELIANCE, TCS, INFY"
                                        className="flex-1 px-4 py-2.5 bg-notion-bg border border-notion-border rounded-xl text-sm text-notion-text placeholder-notion-muted/50 focus:ring-1 focus:ring-notion-emerald focus:border-notion-emerald outline-none"
                                    />
                                    <button
                                        onClick={searchStock}
                                        disabled={searching}
                                        className="px-4 py-2.5 bg-notion-emerald-bg hover:bg-notion-emerald-bg/85 text-notion-emerald border border-notion-emerald/30 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                        {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                    </button>
                                </div>
                                {searchResult && (
                                    <div className="mt-2 p-3 bg-notion-emerald-bg border border-notion-emerald/30 rounded-lg">
                                        <p className="text-sm font-bold text-notion-emerald">{searchResult.name}</p>
                                        <p className="text-xs text-notion-emerald/80">
                                            CMP: ₹{searchResult.price} • {searchResult.suggestion || 'Market'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Quantity & Price */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-notion-muted uppercase tracking-wider mb-1.5">
                                        {t('quantity')} *
                                    </label>
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={e => setQty(e.target.value)}
                                        placeholder="10"
                                        min="1"
                                        className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-xl text-sm text-notion-text placeholder-notion-muted/50 focus:ring-1 focus:ring-notion-emerald focus:border-notion-emerald outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-notion-muted uppercase tracking-wider mb-1.5">
                                        {t('avg_buy_price')} *
                                    </label>
                                    <input
                                        type="number"
                                        value={avgPrice}
                                        onChange={e => setAvgPrice(e.target.value)}
                                        placeholder="1500.00"
                                        step="0.01"
                                        className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-xl text-sm text-notion-text placeholder-notion-muted/50 focus:ring-1 focus:ring-notion-emerald focus:border-notion-emerald outline-none"
                                    />
                                </div>
                            </div>

                            {/* Purchase Date (optional) */}
                            <div>
                                <label className="block text-xs font-bold text-notion-muted uppercase tracking-wider mb-1.5">
                                    {t('purchase_date_optional')}
                                </label>
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={e => setPurchaseDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-notion-bg border border-notion-border rounded-xl text-sm text-notion-text focus:ring-1 focus:ring-notion-emerald focus:border-notion-emerald outline-none"
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
                                className="w-full py-3 bg-notion-emerald hover:bg-notion-emerald/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
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
            )}
        </AnimatePresence>
    );
};

export default AddHoldingModal;
