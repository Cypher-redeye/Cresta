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
                    className="apple-glass p-6 md:p-8 rounded-3xl border border-notion-border/50 shadow-lg relative overflow-hidden group hover:border-notion-emerald/30 transition-all duration-500 hover:shadow-2xl"
                >
                    <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[150%] bg-gradient-radial from-notion-emerald/5 to-transparent blur-[40px] -z-10 pointer-events-none group-hover:from-notion-emerald/10 transition-all duration-500" />
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-notion-muted font-medium">{index.name}</h3>
                            <div className="text-2xl font-bold text-notion-text mt-1">
                                {index.value}
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${index.isPositive ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {index.change}
                        </div>
                    </div>
                    {(() => {
                        const trendIsPositive = chartData.length >= 2 
                            ? chartData[chartData.length - 1].value >= chartData[0].value 
                            : index.isPositive;
                        const mainColor = trendIsPositive ? "var(--accent-emerald)" : "#ef4444";
                        
                        return (
                            <div className="h-16">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={mainColor} stopOpacity={0.15} />
                                                <stop offset="100%" stopColor={mainColor} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={mainColor}
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill={`url(#grad${i})`}
                                            isAnimationActive={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        );
                    })()}
                </motion.div>
            ))}
        </div>
    );
};

export default MarketIndices;
