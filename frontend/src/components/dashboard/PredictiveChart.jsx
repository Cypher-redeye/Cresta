import React, { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Info, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../api';

const PredictiveChart = ({ symbol, onClose }) => {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const cleanSymbol = symbol.replace('.NS', '');
                const res = await fetch(`${API_BASE}/prediction/?symbol=${cleanSymbol}`);
                const result = await res.json();
                if (result.error) throw new Error(result.error);

                // Process data: create separate keys for historical and future
                const processed = result.data.map((item, index, arr) => {
                    const entry = {
                        date: item.date,
                        isFuture: item.isFuture
                    };

                    if (!item.isFuture) {
                        entry.historical = item.price;
                        // Add bridge point: if next item is future, also set future to current price
                        if (index < arr.length - 1 && arr[index + 1].isFuture) {
                            entry.future = item.price;
                        }
                    } else {
                        entry.future = item.price;
                    }

                    return entry;
                });

                setChartData(processed);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (symbol) fetchData();
    }, [symbol]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const price = item.historical || item.future;
            return (
                <div className="bg-fintech-card/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{item.date}</p>
                    <p className="text-sm font-extrabold text-white">₹{price?.toLocaleString()}</p>
                    {item.isFuture && (
                        <div className="mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="text-[10px] text-blue-400 font-bold">{t('ai_forecast')}</span>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Find the divider date
    const dividerDate = chartData.find(d => d.isFuture)?.date;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-5 rounded-2xl relative"
        >
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-white transition-colors z-10"
                >
                    <X size={16} />
                </button>
            )}

            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="text-fintech-cyan dark:text-cyan-400 w-4 h-4" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{t('growth_forecast')}</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                    {t('past_present_future')}
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Loader2 className="w-8 h-8 text-fintech-cyan dark:text-cyan-500 animate-spin" />
                    <p className="text-xs text-gray-500">{t('analyzing_trends')}</p>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-48 text-red-400 text-xs">
                    {t('unable_load_chart')}
                </div>
            ) : (
                <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`grad-hist-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id={`grad-future-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis
                                domain={['auto', 'auto']}
                                orientation="right"
                                stroke="#ffffff30"
                                fontSize={9}
                                tickFormatter={(v) => `₹${v}`}
                                width={55}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* Historical line (solid cyan) */}
                            <Area
                                type="monotone"
                                dataKey="historical"
                                stroke="#22D3EE"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#grad-hist-${symbol})`}
                                connectNulls={false}
                                isAnimationActive={true}
                                dot={false}
                            />

                            {/* Future line (dashed blue) */}
                            <Area
                                type="monotone"
                                dataKey="future"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill={`url(#grad-future-${symbol})`}
                                connectNulls={false}
                                isAnimationActive={true}
                                dot={false}
                            />

                            {dividerDate && (
                                <ReferenceLine x={dividerDate} stroke="#ffffff40" strokeDasharray="3 3" label="" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>

                    <div className="mt-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-tighter">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-cyan-400 rounded"></div>
                            <span className="text-gray-400">{t('past_30_days')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 bg-blue-500 border-t border-dashed border-blue-500 rounded"></div>
                            <span className="text-gray-400">{t('ai_forecast_7_days')}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-white/5 flex items-start gap-2">
                <Info size={12} className="text-gray-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-gray-500 leading-normal">
                    {t('forecast_disclaimer')}
                </p>
            </div>
        </motion.div>
    );
};

export default PredictiveChart;
