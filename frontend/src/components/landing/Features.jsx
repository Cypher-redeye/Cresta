import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Shield, Activity, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import NeuralNetwork from './NeuralNetwork';

const FeatureCard = ({ feature, index, className }) => {
    const ref = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Smooth the motion values
    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
    
    // Map mouse position to rotation (subtle for large cards)
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        if (!isHovered) setIsHovered(true);
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1, type: "spring", bounce: 0.4 }}
            viewport={{ once: true, margin: "-50px" }}
            className={`apple-glass apple-card-glow p-8 rounded-[24px] cursor-pointer relative overflow-hidden flex flex-col justify-between ${className}`}
        >
            {/* Neural Network Hover Effect - specifically visible on the large card or when hovered */}
            <div className="absolute inset-0 opacity-40 transition-opacity duration-500 hover:opacity-100" style={{ transform: "translateZ(-20px)" }}>
                 <NeuralNetwork isHovered={isHovered} isDark={isDark} />
            </div>
            
            {/* Ambient Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-accent-emerald-bg rounded-full blur-[80px] -z-10 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

            {/* Inner content floats slightly above the card */}
            <div style={{ transform: "translateZ(60px)", position: "relative", zIndex: 10 }} className="mt-auto">
                <div className="mb-6 p-4 rounded-2xl bg-notion-bg/50 backdrop-blur-md border border-notion-border w-fit shadow-sm">
                    {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-notion-text apple-header-1">{feature.title}</h3>
                <p className="text-notion-muted leading-relaxed text-base">
                    {feature.description}
                </p>
            </div>
        </motion.div>
    );
};

const Features = () => {
    const { t } = useTranslation();

    const features = [
        {
            icon: <Shield className="w-8 h-8 text-notion-text" />,
            title: t('feature_risk_profiling_title'),
            description: t('feature_risk_profiling_desc')
        },
        {
            icon: <Activity className="w-6 h-6 text-notion-text" />,
            title: t('feature_market_data_title'),
            description: t('feature_market_data_desc')
        },
        {
            icon: <RefreshCw className="w-6 h-6 text-notion-text" />,
            title: t('feature_auto_rebalancing_title'),
            description: t('feature_auto_rebalancing_desc')
        }
    ];

    return (
        <section id="features" className="py-32 bg-notion-bg relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 -left-[20%] w-[50%] h-[50%] rounded-full bg-accent-blue-bg blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-[20%] w-[50%] h-[50%] rounded-full bg-accent-emerald-bg blur-[120px] pointer-events-none" />

            <div className="max-w-[1200px] mx-auto px-6 relative z-10" style={{ perspective: "1000px" }}>
                <div className="mb-20 text-center max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-notion-text apple-header-1 tracking-tight">
                        {t('intelligent_features')}
                    </h2>
                    <p className="text-lg md:text-xl text-notion-muted">
                        {t('features_subtitle')}
                    </p>
                </div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]">
                    <FeatureCard 
                        feature={features[0]} 
                        index={0} 
                        className="md:col-span-2 lg:col-span-2 lg:row-span-2 min-h-[400px] lg:min-h-full"
                    />
                    <FeatureCard 
                        feature={features[1]} 
                        index={1} 
                        className="md:col-span-1 lg:col-span-1 lg:row-span-1"
                    />
                    <FeatureCard 
                        feature={features[2]} 
                        index={2} 
                        className="md:col-span-1 lg:col-span-1 lg:row-span-1"
                    />
                </div>
            </div>
        </section>
    );
};

export default Features;
