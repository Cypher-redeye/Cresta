import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiCall } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../components/common/CustomSelect';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import {
    TrendingUp, TrendingDown, BarChart3, Clock, IndianRupee,
    Target, Shield, Zap, AlertTriangle, Play, Pause, FastForward, Loader2, Info
} from 'lucide-react';

// ── Stat Card ─────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'emerald', negative }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="apple-glass apple-card-glow rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
    >
        <div className="flex items-center gap-3 mb-2.5">
            <div className={`p-2 rounded-lg ${
                negative ? 'bg-red-500/10' : 'bg-notion-emerald-bg'
            }`}>
                <Icon size={16} className={negative ? 'text-red-500' : 'text-notion-emerald'} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-notion-muted">{label}</span>
        </div>
        <div className={`text-xl md:text-2xl font-extrabold monospace-stats ${
            negative ? 'text-red-500' : 'text-notion-text'
        }`}>
            {value}
        </div>
        {sub && <div className="text-[11px] font-normal text-notion-muted tracking-normal mt-1.5">{sub}</div>}
    </motion.div>
);

// ── Trade Log Row ─────────────────────────
const TradeRow = ({ trade, index }) => (
    <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.03 }}
        className="border-b border-notion-border last:border-0"
    >
        <td className="py-3 px-4 text-sm text-notion-text">{trade.date}</td>
        <td className="py-3 px-4">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                trade.action === 'BUY'
                    ? 'bg-notion-emerald-bg text-notion-emerald'
                    : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
            }`}>
                {trade.action === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {trade.action}
            </span>
        </td>
        <td className="py-3 px-4 text-sm text-notion-text font-mono">₹{trade.price?.toLocaleString()}</td>
        <td className="py-3 px-4 text-sm text-notion-text font-mono">{trade.qty}</td>
        <td className="py-3 px-4 text-sm text-notion-text font-mono">
            ₹{(trade.cost || trade.revenue)?.toLocaleString()}
        </td>
    </motion.tr>
);

// ── Custom Tooltip ────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="apple-glass rounded-xl px-4 py-3 shadow-lg border-none">
            <p className="text-[10px] font-bold uppercase tracking-wider text-notion-muted mb-2 font-mono">{label}</p>
            <div className="flex flex-col gap-1">
                {payload.map((p, i) => (
                    <p key={i} className="text-xs font-bold font-mono" style={{ color: p.color }}>
                        {p.name}: ₹{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                ))}
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────
const BacktestPage = () => {
    const { t } = useTranslation();
    const [ticker, setTicker] = useState('RELIANCE');
    const [risk, setRisk] = useState('Moderate');
    const [capital, setCapital] = useState(100000);
    const [period, setPeriod] = useState('1y');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [playbackIndex, setPlaybackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const runBacktest = useCallback(async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setPlaybackIndex(0);
        setIsPlaying(false);
        try {
            const res = await apiCall(
                `/backtest/?ticker=${encodeURIComponent(ticker)}&risk=${risk}&capital=${capital}&period=${period}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Backtest failed');
            setResult(data);
            setPlaybackIndex(1);
            setIsPlaying(true);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [ticker, risk, capital, period]);

    React.useEffect(() => {
        let interval;
        if (isPlaying && result) {
            // Calculate speed to ensure playback takes roughly ~2 seconds
            const speed = Math.max(1, Math.floor(result.dates.length / 60));
            interval = setInterval(() => {
                setPlaybackIndex(prev => {
                    if (prev >= result.dates.length) {
                        setIsPlaying(false);
                        return result.dates.length;
                    }
                    return prev + speed;
                });
            }, 32); // ~30fps
        }
        return () => clearInterval(interval);
    }, [isPlaying, result]);

    // Prepare chart data
    const fullChartData = result ? result.dates.map((date, i) => ({
        date: date.slice(5), // MM-DD
        strategy: result.equity_curve[i],
        benchmark: result.benchmark_curve[i],
    })) : [];

    const chartData = fullChartData.slice(0, playbackIndex);

    const currentStats = useMemo(() => {
        if (!result || chartData.length === 0) return null;
        
        const startEquity = capital;
        const currentEquity = chartData[chartData.length - 1].strategy;
        const currentBenchmark = chartData[chartData.length - 1].benchmark;
        
        const total_return_pct = ((currentEquity - startEquity) / startEquity) * 100;
        const benchmark_return_pct = ((currentBenchmark - startEquity) / startEquity) * 100;
        
        let peak = startEquity;
        let max_drawdown_pct = 0;
        
        for (const data of chartData) {
            if (data.strategy > peak) peak = data.strategy;
            const drawdown = ((peak - data.strategy) / peak) * 100;
            if (drawdown > max_drawdown_pct) max_drawdown_pct = drawdown;
        }

        return {
            ...result.stats,
            final_equity: currentEquity,
            total_return_pct: Number(total_return_pct.toFixed(2)),
            benchmark_return_pct: Number(benchmark_return_pct.toFixed(2)),
            max_drawdown_pct: Number(max_drawdown_pct.toFixed(2))
        };
    }, [chartData, capital, result]);

    const stats = currentStats || result?.stats;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-notion-text flex items-center gap-3">
                        <BarChart3 className="text-notion-emerald" size={32} />
                        {t('backtest', 'Strategy Backtester')}
                    </h1>
                    <p className="text-notion-muted mt-1">
                        {t('backtest_subtitle', 'Simulate how our AI signals would have performed historically.')}
                    </p>
                </div>

                {/* Controls Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="apple-glass apple-card-glow rounded-3xl p-6 md:p-8 relative overflow-hidden"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        {/* Ticker */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-notion-muted mb-2">
                                {t('stock_symbol_label')}
                            </label>
                            <input
                                type="text"
                                value={ticker}
                                onChange={e => setTicker(e.target.value.toUpperCase())}
                                placeholder="e.g. RELIANCE"
                                className="w-full bg-notion-hover border-[0.5px] border-notion-border rounded-lg px-4 py-2.5 text-xs font-mono text-notion-text placeholder-notion-muted/50 focus:outline-none focus:bg-notion-bg focus:border-notion-text transition-all duration-200"
                            />
                        </div>

                        {/* Risk Profile */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-notion-muted mb-2">
                                {t('risk_profile_label')}
                            </label>
                            <CustomSelect
                                value={risk}
                                onChange={setRisk}
                                options={[
                                    { value: 'Conservative', label: t('conservative_option') },
                                    { value: 'Moderate', label: t('moderate_option') },
                                    { value: 'Aggressive', label: t('aggressive_option') },
                                ]}
                            />
                        </div>

                        {/* Capital */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-notion-muted mb-2">
                                {t('initial_capital')}
                            </label>
                            <input
                                type="number"
                                value={capital}
                                onChange={e => setCapital(Number(e.target.value))}
                                min="10000"
                                step="10000"
                                className="w-full bg-notion-hover border-[0.5px] border-notion-border rounded-lg px-4 py-2.5 text-xs font-mono text-notion-text focus:outline-none focus:bg-notion-bg focus:border-notion-text transition-all duration-200"
                            />
                        </div>

                        {/* Period */}
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-notion-muted mb-2">
                                {t('time_period')}
                            </label>
                            <CustomSelect
                                value={period}
                                onChange={setPeriod}
                                options={[
                                    { value: '6mo', label: t('six_months') },
                                    { value: '1y', label: t('one_year') },
                                    { value: '2y', label: t('two_years') },
                                ]}
                            />
                        </div>

                        {/* Run Button */}
                        <div>
                            <button
                                onClick={runBacktest}
                                disabled={loading || !ticker}
                                className="stark-btn-primary w-full !py-2.5 rounded-lg text-xs hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 border border-transparent"
                            >
                                {loading ? (
                                    <><Loader2 size={14} className="animate-spin" /> {t('running')}</>
                                ) : (
                                    <><Play size={14} /> {t('run_backtest')}</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="mt-4 flex items-start gap-2.5 text-[11px] text-notion-muted bg-notion-hover/50 rounded-lg p-3 border-[0.5px] border-notion-border">
                        <Info size={13} className="mt-0.5 shrink-0 text-notion-text" />
                        <span>
                            {t('backtest_info')}
                        </span>
                    </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-center gap-3"
                        >
                            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Loading Skeleton */}
                {loading && (
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="h-28 bg-notion-hover rounded-2xl" />
                        ))}
                    </div>
                    <div className="h-80 bg-notion-hover rounded-2xl" />
                </div>
                )}

                {/* Results */}
                <AnimatePresence>
                    {result && !loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-6"
                        >
                            {/* Stat Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard
                                    icon={IndianRupee}
                                    label={t('total_return')}
                                    value={`${stats.total_return_pct >= 0 ? '+' : ''}${stats.total_return_pct}%`}
                                    sub={`${t('final_equity')}: ₹${stats.final_equity?.toLocaleString()}`}
                                    negative={stats.total_return_pct < 0}
                                />
                                <StatCard
                                    icon={Target}
                                    label={t('sharpe_ratio')}
                                    value={stats.sharpe_ratio}
                                    sub={t('risk_adjusted_return')}
                                    negative={stats.sharpe_ratio < 0}
                                />
                                <StatCard
                                    icon={TrendingDown}
                                    label={t('max_drawdown')}
                                    value={`${stats.max_drawdown_pct}%`}
                                    sub={t('worst_peak_trough')}
                                    negative={true}
                                />
                                <StatCard
                                    icon={Zap}
                                    label={t('cagr')}
                                    value={`${stats.cagr_pct >= 0 ? '+' : ''}${stats.cagr_pct}%`}
                                    sub={`${t('benchmark_label')}: ${stats.benchmark_return_pct >= 0 ? '+' : ''}${stats.benchmark_return_pct}%`}
                                    negative={stats.cagr_pct < 0}
                                />
                            </div>

                            {/* Secondary Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard icon={BarChart3} label={t('total_trades')} value={stats.total_trades} color="blue" />
                                <StatCard icon={Shield} label={t('win_rate')} value={`${stats.win_rate_pct}%`} sub={`${stats.winning_trades}W / ${stats.losing_trades}L`} color="amber" />
                                <StatCard icon={TrendingUp} label={t('profit_factor')} value={stats.profit_factor} color="purple" />
                                <StatCard icon={Clock} label={t('execution_time')} value={`${stats.elapsed_seconds}s`} sub={`${result.dates.length} ${t('trading_days')}`} color="cyan" />
                            </div>

                            {/* Equity Curve Chart */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="apple-glass apple-card-glow rounded-3xl p-6 md:p-8 overflow-hidden relative"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <h3 className="text-sm font-semibold tracking-tight text-notion-text">{t('equity_curve')}</h3>
                                            <p className="text-[11px] text-notion-muted mt-0.5">
                                                {t('cresta_vs_nifty')}
                                            </p>
                                        </div>
                                        {/* Playback Controls */}
                                        <div className="flex items-center gap-2 ml-4 bg-notion-hover/50 p-1 rounded-lg border-[0.5px] border-notion-border">
                                            <button 
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="p-1.5 hover:bg-notion-bg rounded-md text-notion-text transition-colors"
                                            >
                                                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setPlaybackIndex(fullChartData.length);
                                                    setIsPlaying(false);
                                                }}
                                                className="p-1.5 hover:bg-notion-bg rounded-md text-notion-text transition-colors"
                                                title="Skip to End"
                                            >
                                                <FastForward size={14} />
                                            </button>
                                            <div className="w-[100px] sm:w-[150px] mx-2">
                                                <input 
                                                    type="range" 
                                                    min="1" 
                                                    max={fullChartData.length || 100}
                                                    value={playbackIndex}
                                                    onChange={(e) => {
                                                        setPlaybackIndex(Number(e.target.value));
                                                        setIsPlaying(false);
                                                    }}
                                                    className="w-full accent-notion-emerald h-1 bg-notion-border rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wider font-mono">
                                        <span className="flex items-center gap-1.5 text-notion-text">
                                            <span className="w-2.5 h-0.5 rounded-full bg-notion-emerald" /> {t('strategy')}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-notion-text">
                                            <span className="w-2.5 h-0.5 rounded-full bg-notion-blue" /> {t('nifty_50')}
                                        </span>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={380}>
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradStrategy" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent-emerald)" stopOpacity={0.12} />
                                                <stop offset="95%" stopColor="var(--accent-emerald)" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradBenchmark" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.06} />
                                                <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--notion-border)" opacity={0.5} vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: 'var(--notion-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={12}
                                            padding={{ left: 15, right: 15 }}
                                            interval={Math.floor(chartData.length / 8)}
                                        />
                                        <YAxis
                                            tick={{ fill: 'var(--notion-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: 'var(--notion-muted)', strokeWidth: 0.5, strokeDasharray: '4 4' }}
                                            content={<ChartTooltip />}
                                        />
                                        <ReferenceLine y={capital} stroke="var(--notion-border)" strokeDasharray="3 3" />
                                        <Area
                                            type="monotone"
                                            dataKey="strategy"
                                            name={t('cresta_strategy')}
                                            stroke="var(--accent-emerald)"
                                            strokeWidth={2}
                                            fill="url(#gradStrategy)"
                                            dot={false}
                                            isAnimationActive={false}
                                            activeDot={{ r: 4, stroke: 'var(--accent-emerald)', strokeWidth: 1.5, fill: '#fff', className: 'pulse-dot' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="benchmark"
                                            name={t('nifty_50')}
                                            stroke="var(--accent-blue)"
                                            strokeWidth={1.2}
                                            strokeDasharray="4 4"
                                            fill="url(#gradBenchmark)"
                                            dot={false}
                                            isAnimationActive={false}
                                            activeDot={{ r: 4, stroke: 'var(--accent-blue)', strokeWidth: 1.5, fill: '#fff', className: 'pulse-dot' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </motion.div>

                            {/* Trade Log */}
                            {result.trades?.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="apple-glass apple-card-glow rounded-3xl overflow-hidden relative"
                                >
                                    <div className="px-6 py-4 border-b border-notion-border">
                                        <h3 className="text-lg font-bold text-notion-text">{t('trade_log')}</h3>
                                        <p className="text-xs text-notion-muted">{result.trades.length} {t('trades_executed')}</p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-xs font-bold uppercase tracking-wider text-notion-muted border-b border-notion-border">
                                                    <th className="text-left py-3 px-4">{t('date')}</th>
                                                    <th className="text-left py-3 px-4">{t('action')}</th>
                                                    <th className="text-left py-3 px-4">{t('price')}</th>
                                                    <th className="text-left py-3 px-4">{t('qty')}</th>
                                                    <th className="text-left py-3 px-4">{t('value')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.trades.map((trade, i) => (
                                                    <TradeRow key={i} trade={trade} index={i} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
};

export default BacktestPage;
