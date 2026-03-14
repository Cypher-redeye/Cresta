import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import PortfolioChart from '../components/dashboard/PortfolioChart';
import AssetAllocation from '../components/dashboard/AssetAllocation';
import AIInsights from '../components/dashboard/AIInsights';
import AddHoldingModal from '../components/dashboard/AddHoldingModal';
import AlertBanner from '../components/dashboard/AlertBanner';
import {
    DollarSign,
    Briefcase,
    Activity,
    Rocket,
    ShieldCheck,
    PieChart as PieChartIcon,
    ArrowRight,
    Plus
} from 'lucide-react';
import MarketTicker from '../components/dashboard/MarketTicker';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import Skeleton from '../components/common/Skeleton';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import { API_BASE, apiCall } from '../api';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const Dashboard = () => {
    const { t } = useTranslation();
    const { hasCompletedRiskAssessment, user } = useUser();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [holdings, setHoldings] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [signals, setSignals] = useState({});
    const [alerts, setAlerts] = useState([]);
    const [dismissedAlerts, setDismissedAlerts] = useState([]);

    const userEmail = user?.email || localStorage.getItem('user_email') || '';

    // Fetch holdings from backend
    const fetchHoldings = useCallback(async () => {
        if (!user) return;
        try {
            const res = await apiCall('/holdings/');
            if (res.ok) {
                const data = await res.json();
                setHoldings(data);
            }
        } catch (e) {
            console.error("Failed to fetch holdings:", e);
            showToast(t('failed_load_portfolio'), 'error');
        }
    }, [user]);

    // Fetch signals
    const fetchSignals = useCallback(async () => {
        if (!user) return;
        try {
            const riskData = localStorage.getItem('risk_assessment_result');
            let risk = 'Moderate';
            if (riskData) {
                try { risk = JSON.parse(riskData).User_Class || 'Moderate'; } catch (e) { }
            }
            const res = await apiCall(`/holdings/signals/?risk=${risk}`);
            if (res.ok) {
                const data = await res.json();
                // Convert signals array to map by holding id
                const sigMap = {};
                (data.signals || []).forEach(s => { sigMap[s.id] = s; });
                setSignals(sigMap);
                setAlerts((data.alerts || []).filter(a => !dismissedAlerts.includes(a.id)));
            }
        } catch (e) {
            console.error('Signals fetch error:', e);
        }
    }, [user, dismissedAlerts]);

    useEffect(() => {
        fetchHoldings();
        // Refresh prices every 60 seconds
        const interval = setInterval(fetchHoldings, 60000);
        return () => clearInterval(interval);
    }, [fetchHoldings]);

    // Fetch signals after holdings load, refresh every 5 minutes
    useEffect(() => {
        if (holdings.length > 0) {
            fetchSignals();
            const interval = setInterval(fetchSignals, 300000);
            return () => clearInterval(interval);
        }
    }, [holdings, fetchSignals]);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    // Add holding via backend
    const addHolding = async (holdingData) => {
        const res = await apiCall('/holdings/add/', {
            method: 'POST',
            body: JSON.stringify(holdingData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add');
        showToast(t('holding_added'), 'success');
        await fetchHoldings();
    };

    // Update holding
    const updateHolding = async (id, updates) => {
        try {
            const res = await apiCall('/holdings/update/', {
                method: 'POST',
                body: JSON.stringify({ id, ...updates })
            });
            if (res.ok) {
                showToast(t('holding_updated'), 'success');
                await fetchHoldings();
            }
        } catch (e) {
            showToast(t('failed_update_holding'), 'error');
        }
    };

    // Delete holding
    const deleteHolding = async (id) => {
        try {
            const res = await apiCall('/holdings/delete/', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                showToast(t('holding_deleted'), 'info');
                await fetchHoldings();
            }
        } catch (e) {
            showToast(t('failed_delete_holding'), 'error');
        }
    };

    const dismissAlert = (id) => {
        setDismissedAlerts(prev => [...prev, id]);
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    const totals = holdings.reduce((acc, h) => {
        const invested = (h.qty || 0) * (h.avg || 0);
        const current = (h.qty || 0) * (h.ltp || h.avg || 0);
        acc.invested += invested;
        acc.current += current;
        return acc;
    }, { invested: 0, current: 0 });

    const pnl = totals.current - totals.invested;
    const pnlPercent = totals.invested > 0 ? (pnl / totals.invested) * 100 : 0;

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-8">
                    <Skeleton className="w-full h-10 mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <Skeleton className="w-full h-[400px]" />
                            <Skeleton className="w-full h-[300px]" />
                        </div>
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <Skeleton className="w-full h-[250px]" />
                            <Skeleton className="w-full h-[450px]" />
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!hasCompletedRiskAssessment) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto py-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-12 rounded-3xl border border-gray-200 dark:border-white/10 text-center space-y-8 dark:bg-fintech-card/30 backdrop-blur-3xl"
                    >
                        <div className="flex justify-center flex-wrap gap-12 mb-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-fintech-emerald/20 dark:bg-emerald-500/20 flex items-center justify-center text-fintech-emerald dark:text-emerald-400">
                                    <Rocket size={32} />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('personalized_journey')}</span>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-fintech-emerald/20 dark:bg-emerald-500/20 flex items-center justify-center text-fintech-emerald dark:text-emerald-400">
                                    <ShieldCheck size={32} />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('risk_matched_ai')}</span>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                                    <PieChartIcon size={32} />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('optimal_allocation')}</span>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-2xl mx-auto">
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{t('ready_build_future')}</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                                {t('ai_needs_understand')}
                            </p>
                        </div>

                        <div className="pt-8">
                            <Link
                                to="/risk-assessment"
                                className="px-10 py-5 bg-emerald-500 rounded-2xl text-white font-bold text-lg hover:bg-emerald-600 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transform hover:-translate-y-1 transition-all inline-flex items-center gap-3 group"
                            >
                                {t('start_risk_assessment')}
                                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 text-left pt-12 border-t border-gray-200 dark:border-white/5">
                            <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 space-y-2">
                                <h4 className="text-gray-900 dark:text-white font-semibold">{t('realtime_analysis')}</h4>
                                <p className="text-sm text-gray-500 font-normal">{t('realtime_analysis_desc')}</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/50 dark:bg-white/5 space-y-2">
                                <h4 className="text-gray-900 dark:text-white font-semibold">{t('custom_ai_models')}</h4>
                                <p className="text-sm text-gray-500 font-normal">{t('custom_ai_models_desc')}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <MarketTicker />
            {/* Alert Banner */}
            <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

            {/* Risk Re-assessment Banner */}
            {user?.needs_reassessment && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                            <Activity size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white">{t('update_risk_profile')}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('risk_assessment_old')}</p>
                        </div>
                    </div>
                    <Link
                        to="/risk-assessment"
                        className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                        {t('retake_quiz')} <ArrowRight size={14} />
                    </Link>
                </motion.div>
            )}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div variants={itemVariants}>
                        <StatCard title={t('total_invested')} value={`₹${totals.invested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                            change={`${holdings.length} ${t('stocks')}`} isPositive={true} icon={DollarSign} delay={0}
                            subtitle={t('in_portfolio')} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <StatCard title={t('current_value')} value={`₹${totals.current.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                            change={`${pnl >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`} isPositive={pnl >= 0} icon={Briefcase} delay={0}
                            subtitle={t('live_market_value')} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <StatCard title={t('risk_profile')}
                            value={(() => { try { return JSON.parse(localStorage.getItem('risk_assessment_result'))?.User_Class || 'Moderate'; } catch { return 'Moderate'; } })()}
                            change={t('ai_matched')} isPositive={true} icon={Activity} delay={0}
                            subtitle={t('based_on_assessment')} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <StatCard title={t('total_pnl')} value={`₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                            change={`${pnl >= 0 ? '+' : '-'}${Math.abs(pnlPercent).toFixed(2)}%`} isPositive={pnl >= 0} icon={DollarSign} delay={0}
                            subtitle={t('unrealised')} />
                    </motion.div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <motion.div variants={itemVariants}>
                            <PortfolioChart delay={0.5} />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            {/* Add Stock Button */}
                            <div className="flex justify-end mb-3">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25"
                                >
                                    <Plus size={16} /> {t('add_stock')}
                                </button>
                            </div>
                            <HoldingsTable
                                holdings={holdings}
                                onDelete={deleteHolding}
                                onUpdate={updateHolding}
                                signals={signals}
                            />
                        </motion.div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <motion.div variants={itemVariants}>
                            <AssetAllocation holdings={holdings} delay={0.6} />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <AIInsights delay={0.7} />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Add Holding Modal */}
            <AddHoldingModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={addHolding}
            />
        </DashboardLayout>
    );
};

export default Dashboard;
