import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { User, Shield, Moon, Sun, Globe, Bell, ChevronRight, Check, CreditCard, Lock, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SettingsPage = () => {
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { user } = useUser();
    
    // UI state for mock persistent settings
    const [notifications, setNotifications] = React.useState({
        email: true,
        push: true,
        weekly: false
    });
    const [currency, setCurrency] = React.useState('INR');

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
        { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
        { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
    ];

    const changeLanguage = async (lng) => {
        const { loadLanguage } = await import('../i18n');
        await loadLanguage(lng);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('settings')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{t('manage_your_account_and_preferences') || 'Manage your account settings and preferences.'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Settings Navigation */}
                    <div className="hidden md:block col-span-1 space-y-2">
                        <nav className="flex flex-col gap-1 sticky top-24">
                            {[
                                { id: 'profile', label: t('profile'), icon: User, href: '#profile' },
                                { id: 'risk', label: t('risk_management'), icon: Zap, href: '#risk' },
                                { id: 'appearance', label: t('appearance'), icon: theme === 'dark' ? Moon : Sun, href: '#appearance' },
                                { id: 'notifications', label: t('notifications'), icon: Bell, href: '#notifications' },
                                { id: 'language', label: t('language'), icon: Globe, href: '#language' },
                                { id: 'security', label: t('security'), icon: Lock, href: '#security' },
                            ].map((item) => (
                                <a 
                                    key={item.id} 
                                    href={item.href} 
                                    className={`px-4 py-3 rounded-xl flex items-center justify-between transition-all group ${
                                        item.id === 'profile' 
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 font-medium'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg transition-colors ${item.id === 'profile' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-transparent text-gray-400 group-hover:text-emerald-500'}`}>
                                            <item.icon size={18} />
                                        </div>
                                        <span>{item.label}</span>
                                    </div>
                                    <ChevronRight size={16} className={`transition-transform ${item.id === 'profile' ? 'translate-x-0' : 'translate-x-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Settings Content */}
                    <div className="col-span-1 md:col-span-2 space-y-8">

                        {/* Profile Section */}
                        <motion.section
                            id="profile"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-white/10">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <User className="text-fintech-emerald dark:text-emerald-500" size={20} />
                                    {t('profile_settings') || 'Profile Settings'}
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</h3>
                                        <p className="text-gray-500 dark:text-gray-400">{user?.email || 'user@example.com'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('full_name')}</label>
                                            <input
                                                type="text"
                                                value={user?.name || ''}
                                                readOnly
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white opacity-70 cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('email_address')}</label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                readOnly
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white opacity-70 cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Risk Management Section */}
                        <motion.section
                            id="risk"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-white/10">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Zap className="text-amber-500" size={20} />
                                    {t('risk_management')}
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <Shield size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-gray-900 dark:text-white">{t('risk_profile')}: {user?.risk_profile || 'Moderate'}</h4>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">{t('active')}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {t('risk_profile_desc', { profile: user?.risk_profile || 'Moderate' })}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/risk-assessment"
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all font-semibold text-gray-700 dark:text-gray-300 group"
                                >
                                    {t('retake_risk_assessment')}
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.section>

                        {/* Appearance Section */}
                        <motion.section
                            id="appearance"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-white/10">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    {theme === 'dark' ? <Moon className="text-fintech-emerald dark:text-emerald-500" size={20} /> : <Sun className="text-fintech-emerald dark:text-emerald-500" size={20} />}
                                    {t('appearance') || 'Appearance'}
                                </h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    {t('customize_how_cresta_looks_on_your_device') || 'Customize how Cresta looks on your device.'}
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => theme === 'dark' && toggleTheme()}
                                        className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200 ${theme === 'light'
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm shadow-emerald-500/10'
                                            : 'border-gray-200 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-700 focus:outline-none'
                                            }`}
                                    >
                                        <Sun size={32} className={`mb-3 ${theme === 'light' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${theme === 'light' ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {t('light_mode')}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => theme === 'light' && toggleTheme()}
                                        className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200 ${theme === 'dark'
                                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/10'
                                            : 'border-gray-200 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-700 focus:outline-none'
                                            }`}
                                    >
                                        <Moon size={32} className={`mb-3 ${theme === 'dark' ? 'text-emerald-500' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {t('dark_mode')}
                                        </span>
                                    </button>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-white mb-4 block">{t('preferred_currency')}</label>
                                    <div className="flex gap-3">
                                        {['INR', 'USD'].map((curr) => (
                                            <button
                                                key={curr}
                                                onClick={() => setCurrency(curr)}
                                                className={`px-6 py-2 rounded-lg border-2 transition-all ${
                                                    currency === curr 
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' 
                                                    : 'border-gray-200 dark:border-white/10 text-gray-500 hover:border-emerald-500/30'
                                                }`}
                                            >
                                                {curr}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.section>

                        {/* Notifications Section */}
                        <motion.section
                            id="notifications"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-white/10">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Bell className="text-emerald-500" size={20} />
                                    {t('notifications')}
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('manage_notifications')}</p>
                                <div className="space-y-4">
                                    {[
                                        { id: 'email', label: t('email_alerts'), desc: 'Receive real-time email alerts for major market moves.' },
                                        { id: 'push', label: t('browser_notifications'), desc: 'Get desktop alerts for AI buy/sell signals.' },
                                        { id: 'weekly', label: t('weekly_insights'), desc: 'Personalized performance review every Monday.' },
                                    ].map((pref) => (
                                        <div key={pref.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{pref.label}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{pref.desc}</p>
                                            </div>
                                            <button 
                                                onClick={() => setNotifications(prev => ({ ...prev, [pref.id]: !prev[pref.id] }))}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${notifications[pref.id] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications[pref.id] ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.section>

                        {/* Language Section */}
                        <motion.section
                            id="language"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-white/10">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Globe className="text-blue-500" size={20} />
                                    {t('language') || 'Language'}
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <p className="text-gray-500 dark:text-gray-400 mb-2">
                                    {t('select_language') || 'Select your preferred language for the interface.'}
                                </p>

                                <div className="space-y-2">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${i18n.language === lang.code
                                                ? 'border-fintech-emerald bg-emerald-50 dark:bg-emerald-900/20 shadow-sm'
                                                : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i18n.language === lang.code
                                                    ? 'bg-fintech-emerald/10 text-fintech-emerald dark:bg-emerald-800 dark:text-emerald-200'
                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {lang.code.toUpperCase()}
                                                </div>
                                                <div className="text-left">
                                                    <div className={`font-medium ${i18n.language === lang.code ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {lang.nativeName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {lang.name}
                                                    </div>
                                                </div>
                                            </div>
                                            {i18n.language === lang.code && (
                                                <Check className="text-fintech-emerald dark:text-emerald-500" size={20} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.section>

                        {/* Security Section */}
                        <motion.section
                            id="security"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="glass-panel rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-fintech-card/50 backdrop-blur-xl"
                        >
                            <div className="p-6 border-b border-gray-200 dark:border-white/10">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Lock className="text-red-500" size={20} />
                                    {t('security')}
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('security_subtitle')}</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                                <Shield size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('two_factor_auth')}</h4>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('active')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <span>{t('change_password')}</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
