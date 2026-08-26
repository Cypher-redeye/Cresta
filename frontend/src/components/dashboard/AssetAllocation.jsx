import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Sparkles } from 'lucide-react';

const STOCK_COLORS = [
    '#10B981', '#3B82F6', '#34D399', '#A78BFA', '#F472B6',
    '#FBBF24', '#FB923C', '#4ADE80', '#818CF8', '#F87171'
];

const AssetAllocation = ({ holdings = [], delay }) => {
    const { t } = useTranslation();
    const [isSandbox, setIsSandbox] = useState(false);
    const [sandboxAssets, setSandboxAssets] = useState([]);

    // Calculate per-stock allocation from real holdings
    const stockValues = holdings
        .filter(s => s && s.qty && s.ltp)
        .map((stock, i) => ({
            name: stock.name || stock.ticker?.replace('.NS', '') || 'Unknown',
            value: (stock.qty || 0) * (stock.ltp || stock.avg || 0),
            color: STOCK_COLORS[i % STOCK_COLORS.length]
        }))
        .filter(s => s.value > 0)
        .sort((a, b) => b.value - a.value);

    const totalValue = stockValues.reduce((sum, s) => sum + s.value, 0);

    // Calculate percentages
    const assets = totalValue > 0
        ? stockValues.map(s => ({
            ...s,
            percent: Math.round((s.value / totalValue) * 100),
            amount: s.value
        }))
        : [];

    // Ensure percentages sum to 100
    if (assets.length > 0) {
        const diff = 100 - assets.reduce((s, a) => s + a.percent, 0);
        assets[0].percent += diff;
    }

    // Sync sandbox assets
    useEffect(() => {
        if (!isSandbox) {
            setSandboxAssets(assets);
        }
    }, [isSandbox, JSON.stringify(assets)]);

    const displayAssets = isSandbox ? sandboxAssets : assets;

    const handleSliderChange = (index, newValue) => {
        let parsed = parseFloat(newValue);
        if (isNaN(parsed)) return;
        
        // Ensure within bounds
        parsed = Math.max(0, Math.min(100, parsed));
        
        let newAssets = [...sandboxAssets];
        const oldVal = newAssets[index].percent;
        const diff = parsed - oldVal;
        
        if (diff === 0 || newAssets.length <= 1) return;

        newAssets[index] = { ...newAssets[index], percent: parsed };

        const otherItemsTotalPercent = sandboxAssets.reduce((sum, item, idx) => idx !== index ? sum + item.percent : sum, 0);

        if (otherItemsTotalPercent === 0) {
            const distribute = -diff / (newAssets.length - 1);
            newAssets = newAssets.map((item, idx) => 
                idx !== index ? { ...item, percent: Math.max(0, item.percent + distribute) } : item
            );
        } else {
            newAssets = newAssets.map((item, idx) => {
                if (idx === index) return item;
                const ratio = item.percent / otherItemsTotalPercent;
                const adjustedDiff = diff * ratio;
                return { ...item, percent: Math.max(0, item.percent - adjustedDiff) };
            });
        }
        
        // Normalize to exactly 100
        const totalPct = newAssets.reduce((sum, item) => sum + item.percent, 0);
        if (totalPct > 0) {
            newAssets = newAssets.map(item => ({ 
                ...item, 
                percent: (item.percent / totalPct) * 100 
            }));
        }

        // Recalculate amounts based on totalValue
        newAssets = newAssets.map(item => ({
            ...item,
            amount: (item.percent / 100) * totalValue
        }));

        setSandboxAssets(newAssets);
    };

    // Empty state
    if (assets.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay }}
                className="apple-glass p-6 rounded-2xl flex flex-col"
            >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('asset_allocation', 'Portfolio Allocation')}</h3>
                <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">Add holdings to see your allocation</p>
                </div>
            </motion.div>
        );
    }

    // Generate conic gradient from display assets
    let currentPos = 0;
    const gradientString = displayAssets.map(asset => {
        const start = currentPos;
        currentPos += asset.percent;
        return `${asset.color} ${start}% ${currentPos}%`;
    }).join(', ');

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, delay }}
            className={`apple-glass apple-card-glow p-6 rounded-2xl flex flex-col transition-all duration-300 ${isSandbox ? 'border-notion-emerald ring-1 ring-notion-emerald/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : ''}`}
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-notion-text flex items-center gap-2">
                    {t('asset_allocation', 'Portfolio Allocation')}
                    {isSandbox && <span className="px-2 py-0.5 rounded text-[10px] bg-notion-emerald-bg text-notion-emerald font-bold tracking-widest uppercase animate-pulse">Sandbox</span>}
                </h3>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('open-command-palette-ai', {
                                detail: { query: "Analyze my portfolio asset allocation and suggest optimal rebalancing." }
                            }));
                        }}
                        className="p-1.5 rounded-lg bg-notion-hover hover:bg-notion-emerald/10 text-notion-muted hover:text-notion-emerald transition-colors flex items-center justify-center gap-1 text-xs"
                        title="Analyze Allocation with Cresta AI Co-Pilot"
                    >
                        <Sparkles size={16} className="text-notion-emerald" />
                        <span className="text-[11px] font-semibold text-notion-emerald hidden sm:inline">Ask AI</span>
                    </button>
                    <button
                        onClick={() => setIsSandbox(!isSandbox)}
                        className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${isSandbox ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-notion-hover text-notion-muted hover:text-notion-text'}`}
                        title="Toggle Sandbox Mode"
                    >
                        {isSandbox ? <X size={16} /> : <SlidersHorizontal size={16} />}
                    </button>
                </div>
            </div>
            {isSandbox ? (
                <div className="text-[10px] text-notion-muted mb-4 bg-notion-hover/50 p-2 rounded-lg border-[0.5px] border-notion-border flex items-start gap-2">
                    <span className="font-bold text-notion-emerald uppercase tracking-wider shrink-0 mt-0.5">Note:</span> 
                    <span>Sandbox mode lets you explore "what-if" allocation scenarios. It does not modify your actual holdings or total portfolio value.</span>
                </div>
            ) : (
                <div className="h-4 mb-4"></div> // Spacer to prevent layout shift
            )}

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="w-48 h-48 relative mb-8 flex items-center justify-center">
                    {/* Rotating outer conic ring */}
                    <div
                        className="absolute inset-0 rounded-full border border-notion-border shadow-sm animate-[spin_60s_linear_infinite]"
                        style={{
                            background: `conic-gradient(${gradientString})`
                        }}
                    />
                    {/* Inner static total card - remains perfectly horizontal and legible */}
                    <div className="absolute inset-4 bg-notion-card rounded-full flex items-center justify-center z-10 shadow-inner">
                        <div className="text-center">
                            <span className="text-notion-muted text-[10px] uppercase tracking-wider font-semibold">{t('total', 'Total')}</span>
                            <div className="text-xl font-extrabold text-notion-text mt-0.5 monospace-stats">
                                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-2.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                    {displayAssets.map((asset, idx) => (
                        <div key={asset.name} className="flex flex-col gap-2 p-2 rounded-lg hover:bg-notion-hover/50 transition-colors">
                            <div className="flex items-center justify-between text-sm group cursor-default">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: asset.color }}></span>
                                    <span className="text-notion-text opacity-80 group-hover:opacity-100 transition-opacity truncate text-xs font-medium">
                                        {asset.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                    <span className="text-[10px] text-notion-muted group-hover:text-notion-text transition-colors">
                                        ₹{asset.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                    <span className="font-semibold text-notion-text text-xs w-9 text-right font-mono">{Math.round(asset.percent)}%</span>
                                </div>
                            </div>
                            {isSandbox && (
                                <div className="pl-4 pr-1">
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        step="1"
                                        value={asset.percent}
                                        onChange={(e) => handleSliderChange(idx, e.target.value)}
                                        className="w-full h-1 bg-notion-border rounded-lg appearance-none cursor-pointer"
                                        style={{ accentColor: asset.color }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default AssetAllocation;
