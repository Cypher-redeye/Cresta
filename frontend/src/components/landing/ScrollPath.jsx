import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { usePerformance } from '../../context/PerformanceContext';

const ScrollPath = ({ isDark }) => {
    const { isLowPerformance } = usePerformance();
    const { scrollYProgress } = useScroll();

    // Use a very tight spring to remove lag while still functioning correctly with framer-motion
    const pathLength = useSpring(scrollYProgress, {
        stiffness: 800,
        damping: 50,
        restDelta: 0.001
    });

    if (isLowPerformance) return null;

    const baseColor = isDark ? '#34D399' : '#10B981'; // emerald-400 / emerald-500

    return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex justify-center opacity-60">
            {/* We use a very tall SVG that scales to 100% height of its absolute container */}
            <svg 
                viewBox="0 0 1000 3000" 
                preserveAspectRatio="none"
                className="w-full h-full max-w-[1200px]"
            >
                <defs>
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
                        <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur2" />
                        <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur3" />
                        <feMerge>
                            <feMergeNode in="blur3" />
                            <feMergeNode in="blur2" />
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={baseColor} stopOpacity="0" />
                        <stop offset="10%" stopColor={baseColor} stopOpacity="1" />
                        <stop offset="90%" stopColor={baseColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={baseColor} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* 
                  A curved path mimicking a stock chart trending generally upward (but visually downward in layout).
                  Starts centered, curves left/right dynamically.
                */}
                <motion.path
                    d="M 500 0 C 500 200, 200 400, 200 600 C 200 800, 800 1000, 800 1200 C 800 1400, 300 1600, 300 1800 C 300 2000, 700 2200, 700 2400 C 700 2600, 500 2800, 500 3000"
                    fill="none"
                    stroke="url(#line-gradient)"
                    strokeWidth="3"
                    filter="url(#neon-glow)"
                    style={{
                        pathLength: pathLength
                    }}
                />
            </svg>
        </div>
    );
};

export default ScrollPath;
