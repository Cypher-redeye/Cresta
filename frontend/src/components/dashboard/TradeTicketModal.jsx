import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingDown, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import StockLogo from '../common/StockLogo';

const TradeTicketModal = ({ isOpen, onClose, tradeDetails, onExecute }) => {
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSuccess(false);
            setSubmitting(false);
        }
    }, [isOpen]);

    const isBuy = tradeDetails?.type === 'BUY';

    const handleExecute = () => {
        setSubmitting(true);
        setTimeout(() => {
            setSuccess(true);
            setSubmitting(false);
            if (onExecute) onExecute(tradeDetails);
            setTimeout(() => {
                onClose();
            }, 1500);
        }, 1200);
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && tradeDetails && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-md cursor-pointer"
                    onClick={onClose}
                />
            )}
            
            {isOpen && tradeDetails && (
                <motion.div
                    key="modal"
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-sm bg-notion-card border border-notion-border rounded-t-3xl md:rounded-3xl z-[99999] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Mobile Drag Handle */}
                    <div className="w-full flex justify-center pt-4 pb-2 md:hidden shrink-0 bg-notion-bg/50">
                        <div className="w-12 h-1.5 bg-notion-border rounded-full" />
                    </div>
                    <div className="p-5 border-b border-notion-border flex items-center justify-between bg-notion-bg/50">
                        <h3 className="text-lg font-bold text-notion-text flex items-center gap-2">
                            Trade Ticket
                        </h3>
                        <button onClick={onClose} className="p-1.5 hover:bg-notion-hover rounded-lg transition-colors text-notion-muted">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    {success ? (
                        <div className="p-12 flex flex-col items-center gap-4 text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                                <CheckCircle size={48} className="text-notion-emerald" />
                            </motion.div>
                            <div>
                                <p className="text-lg font-bold text-notion-text mb-1">Order Executed</p>
                                <p className="text-sm text-notion-muted">Portfolio rebalanced successfully.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Action Summary */}
                            <div className={`p-4 rounded-xl border flex items-center justify-between ${isBuy ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="flex items-center gap-3">
                                    <StockLogo ticker={tradeDetails.ticker} size={40} />
                                    <div>
                                        <p className="text-sm font-bold text-notion-text uppercase tracking-widest">{tradeDetails.type}</p>
                                        <p className="text-xs font-mono text-notion-muted">{tradeDetails.ticker}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-mono font-bold text-notion-text">{tradeDetails.qty}</p>
                                    <p className="text-[10px] text-notion-muted uppercase">Shares</p>
                                </div>
                            </div>

                            {/* AI Rationale */}
                            <div>
                                <p className="text-xs font-bold text-notion-muted uppercase tracking-wider mb-2">AI Rationale</p>
                                <p className="text-sm text-notion-text p-3 bg-notion-hover/50 rounded-lg border border-notion-border">
                                    {tradeDetails.reason}
                                </p>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={handleExecute}
                                disabled={submitting}
                                className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                                    isBuy 
                                    ? 'bg-notion-emerald hover:bg-notion-emerald/90 text-black active:scale-[0.98]' 
                                    : 'bg-red-500 hover:bg-red-600 text-white active:scale-[0.98]'
                                }`}
                            >
                                {submitting ? (
                                    <><Loader2 size={18} className="animate-spin" /> Processing...</>
                                ) : (
                                    <>Confirm {tradeDetails.type}</>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default TradeTicketModal;
