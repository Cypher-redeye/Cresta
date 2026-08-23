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
import { TrendingUp, Info, X } from 'lucide-react';
import Logo from '../common/Logo';
import { useTranslation } from 'react-i18next';
import { API_BASE, apiCall } from '../../api';

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
                const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
                let res = await apiCall(`/prediction/?symbol=${cleanSymbol}`);
                let result = await res.json();
                if (result.error) throw new Error(result.error);

                if (result.task_id) {
                    let taskStatus = 'processing';
                    while (taskStatus === 'processing') {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        const pollRes = await apiCall(`/prediction/status/${result.task_id}/?symbol=${cleanSymbol}`);
                        const pollResult = await pollRes.json();
                        if (pollResult.error) throw new Error(pollResult.error);
                        
                        taskStatus = pollResult.status;
                        if (taskStatus === 'completed') {
                            result = pollResult;
                        } else if (taskStatus === 'failed' || taskStatus === 'FAILURE') {
                            throw new Error(pollResult.error || 'Prediction task failed');
                        }
                    }
                }

                // Process data: create separate keys for historical and future
                let lastHistorical = null;
                const processed = result.data.map((item, index, arr) => {
                    const entry = {
                        date: item.date,
                        isFuture: item.isFuture
                    };

                    if (!item.isFuture) {
                        entry.historical = item.price;
                        lastHistorical = item.price;
                        // Add bridge point: if next item is future, also set future to current price
                        if (index < arr.length - 1 && arr[index + 1].isFuture) {
                            entry.future = item.price;
                            entry.lower_bound = item.price;
                            entry.upper_bound = item.price;
                        }
                    } else {
                        entry.future = item.price;
                        entry.lower_bound = item.lower_bound;
                        entry.upper_bound = item.upper_bound;
                        entry.base_price = lastHistorical;
                        
                        if (lastHistorical) {
                            const expectedReturn = (item.price - lastHistorical) / lastHistorical;
                            const boundWidth = (item.upper_bound - item.lower_bound) / lastHistorical;
                            entry.expected_return = expectedReturn;
                            
                            // Conviction logic based on bound width
                            if (boundWidth < 0.02) entry.conviction = 'High';
                            else if (boundWidth < 0.05) entry.conviction = 'Medium';
                            else entry.conviction = 'Low';
                        }
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
            
            if (!item.isFuture) {
                return (
                    <div className="apple-glass apple-card-glow p-3 rounded-xl border-none shadow-xl">
                        <p className="text-[9px] text-notion-muted font-bold uppercase mb-1">{item.date}</p>
                        <p className="text-sm font-extrabold text-notion-text">₹{item.historical?.toLocaleString()}</p>
                    </div>
                );
            } else {
                // Future point: Show Direction & Bounds, obscure exact price
                const expectedRet = item.expected_return || 0;
                const lowerRet = (item.lower_bound - item.base_price) / item.base_price;
                const upperRet = (item.upper_bound - item.base_price) / item.base_price;
                
                const direction = expectedRet > 0.005 ? 'Bullish 📈' : expectedRet < -0.005 ? 'Bearish 📉' : 'Neutral ➖';
                const dirColor = expectedRet > 0.005 ? 'text-emerald-400' : expectedRet < -0.005 ? 'text-red-400' : 'text-gray-400';
                
                let convictionColor = 'text-gray-400';
                if (item.conviction === 'High') convictionColor = 'text-emerald-400';
                if (item.conviction === 'Medium') convictionColor = 'text-blue-400';
                if (item.conviction === 'Low') convictionColor = 'text-orange-400';

                return (
                    <div className="apple-glass p-3 rounded-xl border-none min-w-[140px] shadow-xl">
                        <p className="text-[9px] text-notion-muted font-bold uppercase mb-1">{item.date}</p>
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            <span className="text-[10px] text-blue-400 font-bold">{t('ai_forecast')}</span>
                        </div>
                        
                        <p className={`text-sm font-extrabold ${dirColor} mb-2`}>{direction}</p>
                        
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-notion-muted font-medium">Conviction:</span>
                                <span className={`font-bold ${convictionColor}`}>{item.conviction}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-notion-muted font-medium">Expected Move:</span>
                                <span className="font-bold text-notion-text">
                                    {(lowerRet * 100).toFixed(1)}% to {(upperRet * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                );
            }
        }
        return null;
    };

    // Find the divider date and determine if performance is positive
    const dividerDate = chartData.find(d => d.isFuture)?.date;
    const historicalData = chartData.filter(d => !d.isFuture && d.historical !== undefined);
    const chartColors = {
        stroke: 'var(--accent-emerald, #00ff66)',
        fill: 'var(--accent-emerald, #00ff66)'
    };

    // Calculate Overall Signal Badge
    const getOverallSignal = () => {
        const lastPoint = chartData[chartData.length - 1];
        if (!lastPoint || !lastPoint.isFuture || !lastPoint.base_price) return null;
        
        // Use threshold consistent with backtester (env var or default 1%)
        const buyThreshold = parseFloat(import.meta.env.VITE_BUY_THRESHOLD || "0.01");
        const sellThreshold = parseFloat(import.meta.env.VITE_SELL_THRESHOLD || "-0.01");
        
        const expectedReturn = lastPoint.expected_return;
        const lowerBoundRet = (lastPoint.lower_bound - lastPoint.base_price) / lastPoint.base_price;
        
        if (expectedReturn > buyThreshold && lowerBoundRet > -0.01) {
            return { label: 'Strong Buy', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' };
        } else if (expectedReturn < sellThreshold) {
            return { label: 'Bearish', color: 'bg-red-500/20 text-red-500 border-red-500/30' };
        }
        return { label: 'Hold', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    };
    const signalBadge = getOverallSignal();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="apple-glass p-5 rounded-2xl relative"
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
                    <TrendingUp className="text-fintech-emerald dark:text-emerald-400 w-4 h-4" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{t('growth_forecast')}</h4>
                    {signalBadge && (
                        <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${signalBadge.color}`}>
                            {signalBadge.label}
                        </span>
                    )}
                </div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                    {t('past_present_future')}
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Logo width={48} height={48} animateDrawing={true} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
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
                                    <stop offset="5%" stopColor={chartColors.fill} stopOpacity={0.15} />
                                    <stop offset="95%" stopColor={chartColors.fill} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id={`grad-future-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} horizontal={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis
                                domain={['auto', 'auto']}
                                orientation="right"
                                stroke="var(--notion-muted)"
                                strokeOpacity={0.4}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--notion-muted)' }}
                                fontSize={9}
                                tickFormatter={(v) => `₹${v}`}
                                width={55}
                            />
                            <Tooltip
                                cursor={{ stroke: 'var(--notion-muted)', strokeWidth: 0.5, strokeDasharray: '4 4' }}
                                content={<CustomTooltip />}
                            />

                            <Area
                                type="monotone"
                                dataKey="historical"
                                stroke={chartColors.stroke}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#grad-hist-${symbol})`}
                                connectNulls={false}
                                isAnimationActive={true}
                                dot={false}
                                activeDot={{ r: 4, stroke: 'var(--accent-emerald)', strokeWidth: 1.5, fill: '#fff', className: 'pulse-dot' }}
                            />

                            {/* Confidence Interval Band (Subtle fill) */}
                            <Area
                                type="monotone"
                                dataKey="upper_bound"
                                stroke="none"
                                fill="#3B82F6"
                                fillOpacity={0.1}
                                isAnimationActive={true}
                            />
                            <Area
                                type="monotone"
                                dataKey="lower_bound"
                                stroke="none"
                                fill="var(--notion-card)" // Dynamic theme background masking to fake a floating band
                                fillOpacity={1}
                                isAnimationActive={true}
                            />

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
                                activeDot={{ r: 4, stroke: '#3B82F6', strokeWidth: 1.5, fill: '#fff', className: 'pulse-dot' }}
                            />

                            {dividerDate && (
                                <ReferenceLine x={dividerDate} stroke="var(--notion-border)" strokeDasharray="3 3" label="" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>

                    <div className="mt-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-tighter">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: chartColors.stroke }}></div>
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
