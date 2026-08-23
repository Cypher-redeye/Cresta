import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { API_BASE } from '../api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Moon, Sun, Globe, Bell, ChevronRight, Check, Lock, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SettingsPage = () => {
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { user, login } = useUser();
    const { showToast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    
    // UI state for active tab
    const [activeTab, setActiveTab] = useState('profile');

    // UI state for mock persistent settings
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        weekly: false
    });
    const [currency, setCurrency] = useState('INR');

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

    const tabs = [
        { id: 'profile', label: t('profile', 'Profile'), icon: User },
        { id: 'risk', label: t('risk_management', 'Risk Management'), icon: Zap },
        { id: 'appearance', label: t('appearance', 'Appearance'), icon: theme === 'dark' ? Moon : Sun },
        { id: 'notifications', label: t('notifications', 'Notifications'), icon: Bell },
        { id: 'language', label: t('language', 'Language'), icon: Globe },
        { id: 'security', label: t('security', 'Security'), icon: Lock },
    ];

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('picture', file);

            const res = await fetch(`${API_BASE}/profile/save/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                login({ ...user, picture: data.picture });
                showToast('Profile picture updated!', 'success');
            } else {
                showToast('Failed to upload picture', 'error');
            }
        } catch (error) {
            showToast('Upload error', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6 pb-12">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-extrabold text-notion-text mb-1.5 tracking-tight apple-display">
                        {t('settings')}
                    </h1>
                    <p className="text-sm text-notion-muted">
                        {t('manage_your_account_and_preferences') || 'Manage your account settings and preferences.'}
                    </p>
                </div>

                {/* Mobile Navigation bar */}
                <div className="block md:hidden overflow-x-auto pb-2 scrollbar-none select-none">
                    <div className="flex gap-2 min-w-max px-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.97] cursor-pointer ${
                                        isActive
                                        ? 'apple-glass text-notion-emerald bg-notion-emerald-bg'
                                        : 'text-notion-muted hover:text-notion-text'
                                    }`}
                                >
                                    <Icon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Desktop Settings Navigation */}
                    <div className="hidden md:block col-span-1 space-y-2 sticky top-24 select-none">
                        <nav className="flex flex-col gap-1.5">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-spring group cursor-pointer active:scale-[0.99] ${
                                            isActive 
                                            ? 'apple-glass text-notion-emerald font-bold border border-notion-border shadow-sm' 
                                            : 'text-notion-muted hover:bg-notion-hover hover:text-notion-text font-semibold'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg transition-colors duration-200 ${isActive ? 'bg-notion-emerald-bg text-notion-emerald' : 'bg-transparent text-notion-muted group-hover:text-notion-emerald'}`}>
                                                <Icon size={16} />
                                            </div>
                                            <span className="text-xs">{tab.label}</span>
                                        </div>
                                        <ChevronRight size={14} className={`transition-transform duration-300 ${isActive ? 'translate-x-0 text-notion-emerald' : 'translate-x-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Settings Content Area */}
                    <div className="col-span-1 md:col-span-2 min-h-[460px]">
                        <AnimatePresence mode="wait">
                            {/* Profile Section */}
                            {activeTab === 'profile' && (
                                <motion.section
                                    key="profile"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="apple-glass apple-card-glow rounded-2xl overflow-hidden"
                                >
                                    <div className="p-6 border-b border-notion-border">
                                        <h2 className="text-lg font-bold text-notion-text flex items-center gap-2.5">
                                            <User className="text-notion-emerald" size={18} />
                                            {t('profile_settings') || 'Profile Settings'}
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-full border border-notion-border bg-notion-hover flex items-center justify-center text-notion-text text-2xl font-bold shadow-inner relative group overflow-hidden">
                                                {user?.picture ? (
                                                    <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    user?.name?.charAt(0) || 'U'
                                                )}
                                                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                    {isUploading ? (
                                                        <span className="text-[10px] font-bold text-white">...</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-white uppercase">Edit</span>
                                                    )}
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureUpload} disabled={isUploading} />
                                                </label>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-notion-text">{user?.name || 'User'}</h3>
                                                <p className="text-xs text-notion-muted mt-0.5">{user?.email || 'user@example.com'}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-notion-border">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-notion-muted uppercase tracking-wider">{t('full_name')}</label>
                                                    <input
                                                        type="text"
                                                        value={user?.name || ''}
                                                        readOnly
                                                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-notion-border bg-notion-hover text-notion-text opacity-70 cursor-not-allowed focus:outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-notion-muted uppercase tracking-wider">{t('email_address')}</label>
                                                    <input
                                                        type="email"
                                                        value={user?.email || ''}
                                                        readOnly
                                                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-notion-border bg-notion-hover text-notion-text opacity-70 cursor-not-allowed focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {/* Risk Management Section */}
                            {activeTab === 'risk' && (
                                <motion.section
                                    key="risk"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="apple-glass apple-card-glow rounded-2xl overflow-hidden"
                                >
                                    <div className="p-6 border-b border-notion-border">
                                        <h2 className="text-lg font-bold text-notion-text flex items-center gap-2.5">
                                            <Zap className="text-amber-500" size={18} />
                                            {t('risk_management')}
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                                <Shield size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                                    <h4 className="font-bold text-sm text-notion-text truncate">{t('risk_profile')}: {user?.risk_profile || 'Moderate'}</h4>
                                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-notion-emerald-bg text-notion-emerald font-extrabold uppercase tracking-wider shrink-0">{t('active')}</span>
                                                </div>
                                                <p className="text-xs text-notion-muted leading-relaxed">
                                                    {t('risk_profile_desc', { profile: user?.risk_profile || 'Moderate' })}
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            to="/risk-assessment"
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-notion-border hover:bg-notion-hover hover:border-notion-muted transition-spring font-bold text-xs text-notion-text group"
                                        >
                                            {t('retake_risk_assessment')}
                                            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.section>
                            )}

                            {/* Appearance Section */}
                            {activeTab === 'appearance' && (
                                <motion.section
                                    key="appearance"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="apple-glass apple-card-glow rounded-2xl overflow-hidden"
                                >
                                    <div className="p-6 border-b border-notion-border">
                                        <h2 className="text-lg font-bold text-notion-text flex items-center gap-2.5">
                                            {theme === 'dark' ? <Moon className="text-notion-emerald" size={18} /> : <Sun className="text-notion-emerald" size={18} />}
                                            {t('appearance') || 'Appearance'}
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <p className="text-xs text-notion-muted">
                                            {t('customize_how_cresta_looks_on_your_device') || 'Customize how Cresta looks on your device.'}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => theme === 'dark' && toggleTheme()}
                                                className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-spring cursor-pointer active:scale-[0.97] ${theme === 'light'
                                                    ? 'border-notion-emerald bg-notion-hover shadow-sm font-bold'
                                                    : 'border-notion-border hover:border-notion-muted focus:outline-none'
                                                    }`}
                                            >
                                                <Sun size={28} className={`mb-3 ${theme === 'light' ? 'text-notion-emerald' : 'text-notion-muted'}`} />
                                                <span className={`text-xs ${theme === 'light' ? 'text-notion-emerald font-bold' : 'text-notion-muted font-medium'}`}>
                                                    {t('light_mode')}
                                                </span>
                                            </button>

                                            <button
                                                onClick={() => theme === 'light' && toggleTheme()}
                                                className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-spring cursor-pointer active:scale-[0.97] ${theme === 'dark'
                                                    ? 'border-notion-emerald bg-notion-hover shadow-sm font-bold'
                                                    : 'border-notion-border hover:border-notion-muted focus:outline-none'
                                                    }`}
                                            >
                                                <Moon size={28} className={`mb-3 ${theme === 'dark' ? 'text-notion-emerald' : 'text-notion-muted'}`} />
                                                <span className={`text-xs ${theme === 'dark' ? 'text-notion-text font-bold' : 'text-notion-muted font-medium'}`}>
                                                    {t('dark_mode')}
                                                </span>
                                            </button>
                                        </div>

                                        <div className="pt-6 border-t border-notion-border">
                                            <label className="text-xs font-bold text-notion-text mb-4 block uppercase tracking-wider">{t('preferred_currency')}</label>
                                            <div className="flex gap-3">
                                                {['INR', 'USD'].map((curr) => (
                                                    <button
                                                        key={curr}
                                                        onClick={() => setCurrency(curr)}
                                                        className={`px-6 py-2.5 rounded-lg border text-xs transition-spring cursor-pointer active:scale-[0.95] ${
                                                            currency === curr 
                                                            ? 'border-notion-emerald bg-notion-hover text-notion-emerald font-bold' 
                                                            : 'border-notion-border text-notion-muted hover:border-notion-muted hover:text-notion-text'
                                                        }`}
                                                    >
                                                        {curr}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {/* Notifications Section */}
                            {activeTab === 'notifications' && (
                                <motion.section
                                    key="notifications"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="apple-glass apple-card-glow rounded-2xl overflow-hidden"
                                >
                                    <div className="p-6 border-b border-notion-border">
                                        <h2 className="text-lg font-bold text-notion-text flex items-center gap-2.5">
                                            <Bell className="text-notion-emerald" size={18} />
                                            {t('notifications')}
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <p className="text-xs text-notion-muted">{t('manage_notifications')}</p>
                                        <div className="space-y-4">
                                            {[
                                                { id: 'email', label: t('email_alerts'), desc: 'Receive real-time email alerts for major market moves.' },
                                                { id: 'push', label: t('browser_notifications'), desc: 'Get desktop alerts for AI buy/sell signals.' },
                                                { id: 'weekly', label: t('weekly_insights'), desc: 'Personalized performance review every Monday.' },
                                            ].map((pref) => (
                                                <div key={pref.id} className="flex items-center justify-between p-4 rounded-xl border border-notion-border bg-notion-hover/30">
                                                    <div className="pr-4">
                                                        <h4 className="text-xs font-bold text-notion-text">{pref.label}</h4>
                                                        <p className="text-[10px] text-notion-muted mt-0.5 leading-relaxed">{pref.desc}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setNotifications(prev => ({ ...prev, [pref.id]: !prev[pref.id] }))}
                                                        className={`w-10 h-5.5 rounded-full transition-spring relative shrink-0 cursor-pointer ${notifications[pref.id] ? 'bg-notion-emerald' : 'bg-notion-border'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-all ${notifications[pref.id] ? 'left-5' : 'left-0.5'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {/* Language Section */}
                            {activeTab === 'language' && (
                                <motion.section
                                    key="language"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="apple-glass apple-card-glow rounded-2xl overflow-hidden"
                                >
                                    <div className="p-6 border-b border-notion-border">
                                        <h2 className="text-lg font-bold text-notion-text flex items-center gap-2.5">
                                            <Globe className="text-notion-blue" size={18} />
                                            {t('language') || 'Language'}
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <p className="text-xs text-notion-muted mb-2">
                                            {t('select_language') || 'Select your preferred language for the interface.'}
                                        </p>

                                        <div className="space-y-2.5">
                                            {languages.map((lang) => {
                                                const isCurrent = i18n.language === lang.code;
                                                return (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() => changeLanguage(lang.code)}
                                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-spring cursor-pointer active:scale-[0.98] ${isCurrent
                                                            ? 'border-notion-emerald bg-notion-hover shadow-sm'
                                                            : 'border-notion-border hover:bg-notion-hover hover:border-notion-muted focus:outline-none'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[10px] ${isCurrent
                                                                ? 'bg-notion-emerald-bg text-notion-emerald'
                                                                : 'bg-notion-hover text-notion-muted'
                                                                }`}>
                                                                {lang.code.toUpperCase()}
                                                            </div>
                                                            <div className="text-left">
                                                                <div className={`text-xs font-bold ${isCurrent ? 'text-notion-text font-extrabold' : 'text-notion-text'}`}>
                                                                    {lang.nativeName}
                                                                </div>
                                                                <div className="text-[10px] text-notion-muted mt-0.5">
                                                                    {lang.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {isCurrent && (
                                                            <Check className="text-notion-emerald shrink-0" size={16} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.section>
                            )}

                            {/* Security Section */}
                            {activeTab === 'security' && (
                                <motion.section
                                    key="security"
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="apple-glass apple-card-glow rounded-2xl overflow-hidden"
                                >
                                    <div className="p-6 border-b border-notion-border">
                                        <h2 className="text-lg font-bold text-notion-text flex items-center gap-2.5">
                                            <Lock className="text-red-500" size={18} />
                                            {t('security')}
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <p className="text-xs text-notion-muted">{t('security_subtitle')}</p>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-xl border border-notion-border bg-notion-hover/30">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 rounded-lg bg-notion-emerald-bg text-notion-emerald shrink-0">
                                                        <Shield size={18} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-notion-text">{t('two_factor_auth')}</h4>
                                                        <p className="text-[10px] text-notion-emerald font-semibold mt-0.5">{t('active')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-notion-border hover:bg-notion-hover hover:border-notion-muted transition-spring text-xs font-bold text-notion-text bg-notion-card cursor-pointer active:scale-[0.98]">
                                                <span>{t('change_password')}</span>
                                                <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SettingsPage;
