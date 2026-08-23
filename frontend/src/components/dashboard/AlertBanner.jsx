import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Shield, X, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SignalBadge = ({ signal }) => {
    const { t } = useTranslation();
    const config = {
        SELL: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', label: t('sell'), icon: TrendingDown },
        BUY_MORE: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', label: t('buy_more'), icon: TrendingUp },
        HOLD: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', label: t('hold'), icon: Shield }
    };
    const c = config[signal] || config.HOLD;
    const Icon = c.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${c.bg} ${c.text} border ${c.border} rounded-full text-[10px] font-bold uppercase tracking-wide`}>
            <Icon size={10} /> {c.label}
        </span>
    );
};

const AlertBanner = ({ alerts = [], onDismiss }) => {
    if (!alerts || alerts.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 space-y-3"
            >
                {alerts.map((alert, i) => {
                    const isHigh = alert.urgency === 'high';
                    const isSell = alert.signal === 'SELL';

                    return (
                        <motion.div
                            key={alert.id || i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative overflow-hidden rounded-2xl border p-4 ${isHigh
                                ? 'bg-red-500/10 border-red-500/30 shadow-sm'
                                : 'bg-amber-500/10 border-amber-500/20 shadow-sm'
                                }`}
                        >
                            {/* Animated pulse for high urgency */}
                            {isHigh && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse" />
                            )}

                            <div className="flex items-start gap-3 ml-1">
                                <div className={`p-2 rounded-xl ${isHigh ? 'bg-red-500/20' : 'bg-amber-500/20'} shrink-0 mt-0.5`}>
                                    <AlertTriangle size={16} className={isHigh ? 'text-red-400' : 'text-amber-400'} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-notion-text">{alert.name}</span>
                                        <span className="text-[10px] text-notion-muted font-mono">{alert.ticker}</span>
                                        <SignalBadge signal={alert.signal} />
                                    </div>
                                    <p className="text-xs text-notion-text leading-relaxed">{alert.reason}</p>
                                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                                        <ChevronRight size={12} className={isSell ? 'text-red-400' : 'text-amber-400'} />
                                        <span className={`font-semibold ${isSell ? 'text-red-400' : 'text-amber-400'}`}>
                                            {alert.action}
                                        </span>
                                    </div>
                                </div>

                                {onDismiss && (
                                    <button
                                        onClick={() => onDismiss(alert.id)}
                                        className="p-1 hover:bg-notion-hover rounded-lg transition-colors shrink-0"
                                    >
                                        <X size={14} className="text-notion-muted" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </AnimatePresence>
    );
};

export { SignalBadge, AlertBanner };
export default AlertBanner;
