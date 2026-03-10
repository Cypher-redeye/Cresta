import React from 'react';
import Sidebar from './Sidebar';
import Header from './DashboardHeader';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, PieChart, TrendingUp, Activity, Settings, LogOut } from 'lucide-react';
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
        { icon: Activity, label: t('risk_assessment'), path: '/risk-assessment' },
        { icon: Settings, label: t('settings'), path: '/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-fintech-bg text-gray-900 dark:text-white flex transition-colors duration-300">
            <Sidebar />

            {/* Mobile Header & Sidebar Overlay */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-fintech-bg border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between transition-colors duration-300">
                <span className="text-xl font-bold tracking-wide text-gray-900 dark:text-white">
                    <span className="text-fintech-cyan dark:text-neon-cyan">Cresta</span>
                </span>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 dark:text-gray-300">
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
                        className="fixed inset-0 z-40 bg-gray-50/95 dark:bg-fintech-bg/95 backdrop-blur-md pt-20 px-6 md:hidden transition-colors"
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
                                            ? 'bg-cyan-50 dark:bg-neon-cyan/10 text-fintech-cyan dark:text-neon-cyan'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900'}
                                    `}
                                >
                                    <item.icon size={24} />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 px-4 py-4 w-full rounded-xl text-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            >
                                <LogOut size={24} />
                                <span>{t('logout')}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-[-5%] right-[10%] w-[30%] h-[30%] bg-neon-blue/5 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[10%] left-[5%] w-[25%] h-[25%] bg-neon-cyan/5 rounded-full blur-[80px]"></div>
                </div>

                <Header />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 pt-16 md:pt-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
