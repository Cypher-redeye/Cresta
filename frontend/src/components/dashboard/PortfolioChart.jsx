import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../../context/UserContext';
import { Loader2 } from 'lucide-react';
import { apiCall } from '../../api';

const PERIODS = [
    { label: 'Last 7 Days', value: '5d' },
    { label: 'Last Month', value: '1mo' },
    { label: '3 Months', value: '3mo' },
    { label: '6 Months', value: '6mo' },
    { label: '1 Year', value: '1y' },
];

const PortfolioChart = ({ delay }) => {
    const { t } = useTranslation();
    const { user } = useUser();
    const [data, setData] = useState([]);
    const [period, setPeriod] = useState('1mo');
    const [loading, setLoading] = useState(false);

    const userEmail = user?.email || localStorage.getItem('user_email') || '';

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await apiCall(`/holdings/history/?period=${period}`);
            if (res.ok) {
                const result = await res.json();
                const chartData = (result.data || []).map(item => ({
                    date: item.date,
                    value: item.value,
                    label: new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                }));
                setData(chartData);
            }
        } catch (e) {
            console.error('Portfolio history fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [user, period]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const growth = data.length >= 2 ? data[data.length - 1].value - data[0].value : 0;
    const growthPct = data.length >= 2 && data[0].value > 0
        ? ((growth / data[0].value) * 100).toFixed(2)
        : 0;
    const isPositive = growth >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className="glass-panel p-6 rounded-2xl md:col-span-2 min-h-[400px] flex flex-col relative overflow-hidden"
        >
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('portfolio_growth', 'Portfolio Growth')}</h3>
                    {data.length >= 2 && (
                        <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}₹{Math.abs(growth).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            {' '}({isPositive ? '+' : ''}{growthPct}%)
                        </span>
                    )}
                </div>
                <select
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs px-3 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-fintech-emerald/50 dark:focus:border-neon-emerald/50"
                >
                    {PERIODS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                </select>
            </div>

            <div className="w-full h-[300px] relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-fintech-emerald dark:text-emerald-400 animate-spin" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-sm text-gray-500">Add holdings to see portfolio growth</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? '#22D3EE' : '#EF4444'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isPositive ? '#22D3EE' : '#EF4444'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                dy={10}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                width={60}
                                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                                domain={['dataMin * 0.98', 'dataMax * 1.02']}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                }}
                                itemStyle={{ color: isPositive ? '#22D3EE' : '#EF4444' }}
                                labelStyle={{ color: '#9CA3AF', marginBottom: '4px', fontSize: 11 }}
                                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Portfolio Value']}
                                labelFormatter={(label) => label}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPositive ? '#22D3EE' : '#EF4444'}
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#portfolioGrad)"
                                dot={false}
                                activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
};

export default PortfolioChart;
