import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

/**
 * Displays the 3-card grid for NIFTY 50, SENSEX, and BANK NIFTY
 * with live mini area charts.
 */
const MarketIndices = ({ indicesData, chartData, t }) => {
    const displayData = indicesData.length > 0
        ? indicesData
        : ['NIFTY 50', 'SENSEX', 'BANK NIFTY'].map((name, i) => ({
            name, value: 24000 + i * 5000, change: 0.8, isPositive: true
        }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayData.map((index, i) => (
                <motion.div
                    key={index.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-gray-500 dark:text-gray-400 font-medium">{index.name}</h3>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {index.value}
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${index.isPositive ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {index.change}
                        </div>
                    </div>
                    <div className="h-16">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={index.isPositive ? "#10B981" : "#EF4444"} stopOpacity={0.2} />
                                        <stop offset="100%" stopColor={index.isPositive ? "#10B981" : "#EF4444"} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={index.isPositive ? "#10B981" : "#EF4444"}
                                    strokeWidth={2}
                                    fill={`url(#grad${i})`}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default MarketIndices;
