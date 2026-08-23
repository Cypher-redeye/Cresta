import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

const LoadingScreen = () => {
    const { t } = useTranslation();
    const [messageIndex, setMessageIndex] = useState(0);

    const loadingMessages = [
        t('establishing_connection', 'Establishing secure connection...'),
        t('syncing_market_data', 'Syncing live market data...'),
        t('computing_insights', 'Computing AI insights...'),
        t('preparing_portfolio', 'Preparing your portfolio...')
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [loadingMessages.length]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-notion-bg/90 backdrop-blur-2xl overflow-hidden pointer-events-none"
        >
            {/* Ambient Background Glow */}
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full mix-blend-screen pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 60%)',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Logo Activity Indicator */}
                <div className="relative flex items-center justify-center mb-10">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-[30px] rounded-full animate-pulse" />
                    <Logo width={64} height={64} className="relative z-10 animate-pulse" />
                </div>

                {/* Animated Text */}
                <div className="h-8 flex items-center justify-center overflow-hidden mb-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={messageIndex}
                            initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                            exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="text-notion-text/90 font-medium tracking-wide text-sm apple-display"
                        >
                            {loadingMessages[messageIndex]}
                        </motion.div>
                    </AnimatePresence>
                </div>
                
                {/* Live Progress Bar */}
                <div className="w-48 h-1 bg-notion-border/50 rounded-full overflow-hidden relative">
                    <motion.div 
                        className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent w-24"
                        animate={{
                            x: [-100, 200]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default LoadingScreen;
