import React, { useMemo, useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';
import Logo from '../common/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import TradeTicketModal from './TradeTicketModal';

const PersonalizedTicker = ({ holdings = [], onUpdate }) => {
    const [activeTrade, setActiveTrade] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const insights = useMemo(() => {
        if (!holdings || holdings.length === 0) return [
            { id: 1, type: 'info', text: 'Add holdings to get personalized AI insights on your portfolio.', icon: Info }
        ];

        const totalInvested = holdings.reduce((sum, h) => sum + ((h.qty || 0) * (h.avg || 0)), 0);
        const currentVal = holdings.reduce((sum, h) => sum + ((h.qty || 0) * (h.ltp || h.avg || 0)), 0);
        const pnl = currentVal - totalInvested;
        const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

        let generated = [];

        // Insight 1: Performance
        if (pnlPct > 5) {
            generated.push({ id: 2, type: 'success', text: `Your portfolio is up ${pnlPct.toFixed(1)}%. Great job capturing market upside!`, icon: TrendingUp });
        } else if (pnlPct < -5) {
            generated.push({ id: 2, type: 'warning', text: `Your portfolio is down ${Math.abs(pnlPct).toFixed(1)}%. AI recommends holding strong through volatility.`, icon: AlertCircle });
        } else {
            generated.push({ id: 2, type: 'neutral', text: `Your portfolio is relatively stable at ${pnlPct.toFixed(1)}%. Ensure your asset allocation aligns with your risk profile.`, icon: Info });
        }

        // Insight 2: Concentration
        if (totalInvested > 0) {
            const maxHolding = holdings.reduce((max, h) => {
                const val = (h.qty || 0) * (h.ltp || h.avg || 0);
                return val > (max.val || 0) ? { name: h.name || h.ticker, val } : max;
            }, {});

            if (maxHolding.val / currentVal > 0.3) {
                // Calculate roughly how many shares to sell to drop below 20%
                const targetVal = currentVal * 0.20;
                const excessVal = maxHolding.val - targetVal;
                const ltp = holdings.find(h => h.name === maxHolding.name || h.ticker === maxHolding.name)?.ltp || 1;
                const sellQty = Math.max(1, Math.floor(excessVal / ltp));

                generated.push({ 
                    id: 3, 
                    type: 'warning', 
                    text: `Heavy concentration detected: ${(maxHolding.val / currentVal * 100).toFixed(0)}% in ${maxHolding.name}.`, 
                    icon: AlertCircle,
                    actionable: true,
                    tradeDetails: {
                        id: holdings.find(h => h.name === maxHolding.name || h.ticker === maxHolding.name)?.id,
                        ticker: maxHolding.name,
                        type: 'SELL',
                        qty: sellQty,
                        currentQty: holdings.find(h => h.name === maxHolding.name || h.ticker === maxHolding.name)?.qty,
                        reason: `AI Rebalancing: Trimming position to reduce portfolio concentration risk from ${(maxHolding.val / currentVal * 100).toFixed(0)}% to a target of 20%.`
                    }
                });
            }
        }

        // Insight 3: AI Sparkle
        generated.push({ id: 4, type: 'ai', text: 'Cresta Neural Engine is monitoring 124 macroeconomic data points to optimize your strategy.', icon: (props) => <Logo {...props} width={props.size || 14} height={props.size || 14} /> });

        return generated;
    }, [holdings]);

    useEffect(() => {
        if (!insights || insights.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % insights.length);
        }, 5000); // cycle every 5 seconds
        return () => clearInterval(interval);
    }, [insights]);

    const activeInsight = insights[currentIndex] || insights[0];

    if (!holdings) return null;

    return (
        <>
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-notion-card border-[0.5px] border-notion-border rounded-xl p-3 mb-8 flex overflow-hidden items-center relative apple-glass shadow-sm"
        >
            <div className="flex-shrink-0 z-10 bg-notion-card pr-4 flex items-center gap-2 border-r border-notion-border text-notion-emerald font-bold text-xs uppercase tracking-wider">
                <Logo width={14} height={14} animateDrawing={true} className="text-notion-emerald" /> For You
            </div>
            
            <div className="flex-1 overflow-hidden relative flex items-center ml-4 h-[20px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeInsight.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-2 text-sm shrink-0 w-full"
                    >
                        <activeInsight.icon size={14} className={
                            activeInsight.type === 'success' ? 'text-notion-emerald' :
                            activeInsight.type === 'warning' ? 'text-amber-500' :
                            activeInsight.type === 'ai' ? 'text-purple-500' :
                            'text-notion-muted'
                        } />
                        <span className="text-notion-text truncate">{activeInsight.text}</span>
                        {activeInsight.actionable && (
                            <button 
                                onClick={() => setActiveTrade(activeInsight.tradeDetails)}
                                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-500 text-[10px] font-bold rounded shadow-sm transition-colors uppercase tracking-wider"
                            >
                                Resolve
                            </button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
        <TradeTicketModal 
            isOpen={!!activeTrade} 
            onClose={() => setActiveTrade(null)} 
            tradeDetails={activeTrade} 
            onExecute={() => {
                console.log("Trade executed", activeTrade);
                if (onUpdate && activeTrade?.id != null && activeTrade?.currentQty != null) {
                    const newQty = Math.max(0, activeTrade.currentQty - activeTrade.qty);
                    onUpdate(activeTrade.id, { qty: newQty });
                }
            }}
        />
        </>
    );
};

export default PersonalizedTicker;
