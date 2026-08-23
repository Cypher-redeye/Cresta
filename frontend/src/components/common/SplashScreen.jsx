import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Ultra-premium, Apple-inspired splash screen.
 * Focuses on organic motion, deep negative space, and absolute minimalism.
 */
const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 1. Incredibly smooth progress animation (0 to 100%)
    const duration = 2400; 
    const startTime = performance.now();
    let animFrame;

    const updateProgress = (now) => {
      const elapsed = now - startTime;
      const rawPct = (elapsed / duration);
      // Apple-style easing: incredibly fast start, very slow tailored finish
      const easedPct = 1 - Math.pow(1 - rawPct, 4);
      
      const pct = Math.min(easedPct * 100, 100);
      setProgress(pct);

      if (elapsed < duration) {
        animFrame = requestAnimationFrame(updateProgress);
      }
    };

    animFrame = requestAnimationFrame(updateProgress);

    // 2. Timers for fade-out transition
    const fadeTimer = setTimeout(() => setFadeOut(true), 2800);
    const completeTimer = setTimeout(() => onComplete?.(), 3600);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-black overflow-hidden transition-colors duration-500"
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }} // Apple custom ease
      style={{ pointerEvents: fadeOut ? 'none' : 'all' }}
    >
      {/* Deep, organic, Siri-like ambient glow (Apple Intelligence style) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
            className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full blur-[100px] opacity-40 dark:mix-blend-screen"
            style={{ 
                background: 'radial-gradient(circle at center, rgba(52, 211, 153, 0.5) 0%, rgba(6, 182, 212, 0.15) 40%, transparent 70%)' 
            }}
            animate={{ 
                scale: [1, 1.1, 0.95, 1],
                opacity: [0.2, 0.4, 0.2, 0.2]
            }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
        />
      </div>

      {/* Centerpiece Container */}
      <motion.div 
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.95, opacity: 0, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} // Spring-like ease out
      >
        {/* Crisp, Minimal Logo */}
        <div className="flex items-baseline justify-center mb-10">
            <h1 className="text-5xl md:text-6xl font-extrabold text-black dark:text-white tracking-tight apple-display transition-colors duration-500">
                Cresta
            </h1>
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 ml-1.5 mb-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] dark:shadow-[0_0_15px_rgba(52,211,153,0.6)]"
            />
        </div>

        {/* Ultra-thin, elegant progress line */}
        <div className="w-[180px] md:w-[220px] h-[2px] bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-black dark:bg-white rounded-full transition-colors duration-500"
                style={{ width: `${progress}%` }}
                layout
            />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
