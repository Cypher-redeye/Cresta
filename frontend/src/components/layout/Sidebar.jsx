import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import Logo from '../common/Logo';
import {
    PieChart,
    TrendingUp,
    BarChart3,
    Activity,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const { t } = useTranslation();
    const [collapsed, setCollapsed] = useState(false);
    const { logout } = useUser();
    const navigate = useNavigate();

    const toggleSidebar = () => setCollapsed(!collapsed);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const navItems = [
        { icon: PieChart, label: t('portfolio'), path: '/dashboard' },
        { icon: TrendingUp, label: t('market_watch'), path: '/markets' },
        { icon: BarChart3, label: t('backtest', 'Backtest'), path: '/backtest' },
        { icon: Activity, label: t('risk_assessment'), path: '/risk-assessment' },
        { icon: Settings, label: t('settings'), path: '/settings' },
    ];

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 80 : 280 }}
            className="hidden md:flex flex-col h-screen sticky top-0 bg-notion-sidebar border-r border-notion-border z-20 transition-colors duration-300 shadow-sm"
        >
            <div className={`p-6 flex ${collapsed ? 'flex-col gap-4 items-center' : 'items-center justify-between'}`}>
                {collapsed ? (
                    <Logo width={32} height={32} />
                ) : (
                    <div className="flex items-center gap-2">
                        <Logo width={36} height={36} />

                        <span className="text-2xl font-bold tracking-tight text-notion-text">
                            Cresta<span className="text-notion-emerald">.</span>
                        </span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className={`p-1.5 rounded-lg hover:bg-notion-hover text-notion-muted hover:text-notion-text transition-colors ${!collapsed && 'ml-auto'}`}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {navItems.map((item, index) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-4 px-4 py-2.5 rounded-lg transition-all duration-300 group relative border
                            ${isActive
                                ? 'bg-notion-hover text-notion-text border-notion-border/80 font-semibold shadow-sm shadow-black/5'
                                : 'text-notion-muted hover:bg-notion-hover/50 hover:text-notion-text border-transparent hover:border-notion-border/30'}
                        `}
                    >
                        <item.icon size={20} className="min-w-[20px]" />
                        {!collapsed && (
                            <div className="flex-1 flex items-center justify-between overflow-hidden">
                                <span className="font-medium text-[14px] whitespace-nowrap overflow-hidden">
                                    {item.label}
                                </span>
                                <kbd className="font-mono text-[10px] bg-notion-border/40 text-notion-muted px-1.5 py-0.5 rounded ml-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    {index + 1}
                                </kbd>
                            </div>
                        )}
                        {/* Tooltip for collapsed state */}
                        {collapsed && (
                            <div className="absolute left-full ml-3 px-2.5 py-1.5 apple-glass text-notion-text text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-semibold tracking-wide flex items-center gap-2">
                                {item.label}
                                <kbd className="font-mono text-[9px] bg-notion-border/40 text-notion-muted px-1 py-0.5 rounded">
                                    {index + 1}
                                </kbd>
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-notion-border">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 px-4 py-2.5 w-full rounded-lg text-notion-muted hover:bg-red-500/5 hover:text-red-500 transition-all duration-200 border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={20} className="min-w-[20px]" />
                    {!collapsed && <span className="font-medium text-[14px]">{t('logout')}</span>}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
