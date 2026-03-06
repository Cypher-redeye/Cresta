import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const STOCK_COLORS = [
    '#22D3EE', '#3B82F6', '#34D399', '#A78BFA', '#F472B6',
    '#FBBF24', '#FB923C', '#4ADE80', '#818CF8', '#F87171'
];

const AssetAllocation = ({ holdings = [], delay }) => {
    const { t } = useTranslation();

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

    // Empty state
    if (assets.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay }}
                className="glass-panel p-6 rounded-2xl flex flex-col"
            >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('asset_allocation', 'Portfolio Allocation')}</h3>
                <div className="flex-1 flex items-center justify-center py-8">
                    <p className="text-sm text-gray-500">Add holdings to see your allocation</p>
                </div>
            </motion.div>
        );
    }

    // Generate conic gradient from actual holdings
    let currentPos = 0;
    const gradientString = assets.map(asset => {
        const start = currentPos;
        currentPos += asset.percent;
        return `${asset.color} ${start}% ${currentPos}%`;
    }).join(', ');

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay }}
            className="glass-panel p-6 rounded-2xl flex flex-col"
        >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('asset_allocation', 'Portfolio Allocation')}</h3>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div
                    className="w-48 h-48 rounded-full relative mb-8 shadow-[0_0_30px_rgba(0,0,0,0.3)] animate-[spin_60s_linear_infinite] hover:pause"
                    style={{
                        background: `conic-gradient(${gradientString})`
                    }}
                >
                    <div className="absolute inset-4 bg-white dark:bg-fintech-card rounded-full flex items-center justify-center">
                        <div className="text-center">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">{t('total', 'Total')}</span>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                                ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-2.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                    {assets.map((asset) => (
                        <div key={asset.name} className="flex items-center justify-between text-sm group cursor-default">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: asset.color }}></span>
                                <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate text-xs">
                                    {asset.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                <span className="text-[10px] text-gray-500">
                                    ₹{asset.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white text-xs w-8 text-right">{asset.percent}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default AssetAllocation;
