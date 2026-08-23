import React from 'react';
import Sidebar from './Sidebar';
import Header from './DashboardHeader';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, PieChart, TrendingUp, BarChart3, Activity, Settings, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';


const DashboardLayout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { t } = useTranslation();
    const { logout } = useUser();
    const navigate = useNavigate();

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

    // Keyboard-First Navigation
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if user is typing in an input or textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const key = parseInt(e.key);
            if (!isNaN(key) && key >= 1 && key <= navItems.length) {
                navigate(navItems[key - 1].path);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, navItems]);

    return (
        <div className="min-h-screen bg-notion-bg text-notion-text flex transition-colors duration-300">
            <Sidebar />

            {/* Mobile Header & Sidebar Overlay */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-notion-bg border-b border-notion-border px-4 py-3 flex items-center justify-between transition-colors duration-300 shadow-sm">
                <span className="text-xl font-bold tracking-wide text-notion-text">
                    <span className="text-notion-emerald">Cresta</span>
                </span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-notion-muted hover:text-notion-text">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Sidebar Content */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-notion-bg pt-20 px-6 md:hidden transition-colors"
                    >
                        <nav className="flex flex-col space-y-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 text-lg font-medium
                                        ${isActive
                                            ? 'bg-notion-hover text-notion-emerald font-bold'
                                            : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text'}
                                    `}
                                >
                                    <item.icon size={24} />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                        <div className="mt-8 pt-6 border-t border-notion-border">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 px-4 py-4 w-full rounded-xl text-lg font-medium text-notion-muted hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            >
                                <LogOut size={24} />
                                <span>{t('logout')}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-notion-bg">
                <Header />
                <main id="dashboard-main" className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 relative z-10 pt-24 md:pt-8 overflow-x-hidden w-full max-w-[1600px] mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
