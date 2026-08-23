import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../../context/UserContext';
import Logo from '../common/Logo';
import { apiCall } from '../../api';
import CustomSelect from '../common/CustomSelect';

const PERIODS = [
    { label: 'Last 7 Days', value: '5d' },
    { label: 'Last Month', value: '1mo' },
    { label: '3 Months', value: '3mo' },
    { label: '6 Months', value: '6mo' },
    { label: '1 Year', value: '1y' },
    { label: 'All Time', value: 'max' },
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
            className="apple-glass apple-card-glow p-6 md:p-8 rounded-3xl w-full flex flex-col relative overflow-hidden group shadow-sm"
        >
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-semibold tracking-tight text-notion-text">{t('portfolio_growth', 'Portfolio Growth')}</h3>
                    {data.length >= 2 && (
                        <div className="mt-1">
                            <span className={`monospace-stats text-xs font-bold px-2 py-0.5 rounded ${isPositive ? 'text-notion-emerald bg-notion-emerald-bg' : 'text-[#ff0055] bg-[#ff0055]/8'}`}>
                                {isPositive ? '+' : ''}₹{Math.abs(growth).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                {' '}({isPositive ? '+' : ''}{growthPct}%)
                            </span>
                        </div>
                    )}
                </div>
                <CustomSelect
                    value={period}
                    onChange={setPeriod}
                    options={PERIODS}
                    className="w-36"
                />
            </div>

            <div className="w-full h-[300px] relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Logo width={32} height={32} animateDrawing={true} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-xs text-notion-muted">Add holdings to see portfolio growth</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? 'var(--accent-emerald)' : '#ff0055'} stopOpacity={0.12} />
                                    <stop offset="95%" stopColor={isPositive ? 'var(--accent-emerald)' : '#ff0055'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--notion-border)" strokeOpacity={0.2} />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--notion-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                dy={10}
                                padding={{ left: 15, right: 15 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--notion-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                width={60}
                                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                                domain={['dataMin * 0.98', 'dataMax * 1.02']}
                            />
                            <Tooltip
                                cursor={{ stroke: 'var(--notion-muted)', strokeWidth: 0.5, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    backgroundColor: 'var(--notion-card)',
                                    border: '0.5px solid var(--notion-border)',
                                    borderRadius: '8px',
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: '11px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                }}
                                itemStyle={{ color: isPositive ? 'var(--accent-emerald)' : '#ff0055' }}
                                labelStyle={{ color: 'var(--notion-muted)', marginBottom: '4px', fontSize: 10 }}
                                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Portfolio Value']}
                                labelFormatter={(label) => label}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPositive ? 'var(--accent-emerald)' : '#ff0055'}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#portfolioGrad)"
                                dot={false}
                                activeDot={{ r: 4, stroke: isPositive ? 'var(--accent-emerald)' : '#ff0055', strokeWidth: 1.5, fill: '#fff', className: 'pulse-dot' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </motion.div>
    );
};

export default PortfolioChart;
