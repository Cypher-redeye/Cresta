import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import {
    PieChart,
    TrendingUp,
    BarChart3,
    Activity,
    Settings,
    LogOut
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

// ─── Dock Item with macOS magnification physics ───
const DockItem = ({ icon: Icon, label, path, shortcut, mouseX, isLogout, onClick }) => {
    const ref = useRef(null);
    const location = useLocation();
    const isActive = !isLogout && location.pathname === path;

    // Distance from mouse to this item's center
    const distance = useTransform(mouseX, (val) => {
        if (!ref.current || val === -1) return 150; // far away = no magnification
        const rect = ref.current.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        return Math.abs(val - center);
    });

    // Magnification: closer = bigger. Range: [0, 150]px → [58, 40]px icon size
    const size = useTransform(distance, [0, 80, 150], [58, 46, 40]);
    const springSize = useSpring(size, { mass: 0.1, stiffness: 200, damping: 15 });

    const [hovered, setHovered] = useState(false);

    const content = (
        <motion.div
            ref={ref}
            style={{ width: springSize, height: springSize }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`
                relative flex items-center justify-center rounded-xl cursor-pointer
                transition-colors duration-200
                ${isLogout
                    ? 'text-notion-muted hover:text-red-500 hover:bg-red-500/10'
                    : isActive
                        ? 'bg-notion-emerald/12 text-notion-emerald'
                        : 'text-notion-muted hover:text-notion-text hover:bg-notion-hover'
                }
            `}
            whileTap={{ scale: 0.9 }}
        >
            <Icon style={{ width: '50%', height: '50%' }} strokeWidth={isActive ? 2.2 : 1.8} />

            {/* Active dot indicator */}
            {isActive && (
                <motion.div
                    layoutId="dock-active-dot"
                    className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-notion-emerald"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
            )}

            {/* Tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.9 }}
                        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute -top-10 px-2.5 py-1 rounded-lg apple-glass text-[11px] font-semibold text-notion-text whitespace-nowrap pointer-events-none z-[60] flex items-center gap-1.5 shadow-lg"
                    >
                        {label}
                        {shortcut && (
                            <kbd className="font-mono text-[9px] bg-notion-border/40 text-notion-muted px-1 py-0.5 rounded">
                                {shortcut}
                            </kbd>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    if (isLogout) {
        return (
            <button onClick={onClick} className="outline-none">
                {content}
            </button>
        );
    }

    return (
        <NavLink to={path} className="outline-none">
            {content}
        </NavLink>
    );
};

// ─── Main Floating Dock ───
const FloatingDock = () => {
    const { t } = useTranslation();
    const { logout } = useUser();
    const navigate = useNavigate();
    const mouseX = useMotionValue(-1);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const scrollTimeout = useRef(null);

    const navItems = [
        { icon: PieChart, label: t('portfolio'), path: '/dashboard', shortcut: '1' },
        { icon: TrendingUp, label: t('market_watch'), path: '/markets', shortcut: '2' },
        { icon: BarChart3, label: t('backtest', 'Backtest'), path: '/backtest', shortcut: '3' },
        { icon: Activity, label: t('risk_assessment'), path: '/risk-assessment', shortcut: '4' },
        { icon: Settings, label: t('settings'), path: '/settings', shortcut: '5' },
    ];

    const handleLogout = useCallback(() => {
        logout();
        navigate('/auth');
    }, [logout, navigate]);

    // Scroll-aware auto-hide
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY.current;

            // Only hide if scrolled down significantly
            if (delta > 8 && currentScrollY > 100) {
                setIsVisible(false);
            } else if (delta < -4) {
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;

            // Always show after scroll stops
            clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout.current);
        };
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            const key = parseInt(e.key);
            if (!isNaN(key) && key >= 1 && key <= navItems.length) {
                navigate(navItems[key - 1].path);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, navItems]);

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{
                y: isVisible ? 0 : 100,
                opacity: isVisible ? 1 : 0,
            }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 28,
                mass: 0.8,
            }}
            onMouseMove={(e) => mouseX.set(e.clientX)}
            onMouseLeave={() => mouseX.set(-1)}
            className="floating-dock"
        >
            {/* Navigation items */}
            <div className="flex items-end gap-1 px-1.5">
                {navItems.map((item) => (
                    <DockItem
                        key={item.path}
                        {...item}
                        mouseX={mouseX}
                    />
                ))}
            </div>

            {/* Divider */}
            <div className="dock-divider" />

            {/* Logout */}
            <div className="flex items-end px-1.5">
                <DockItem
                    icon={LogOut}
                    label={t('logout')}
                    mouseX={mouseX}
                    isLogout
                    onClick={handleLogout}
                />
            </div>
        </motion.div>
    );
};

export default FloatingDock;
