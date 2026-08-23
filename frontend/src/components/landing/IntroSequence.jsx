import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import createGlobe from 'cobe';
import Logo from '../common/Logo';
import BackgroundEffects from './BackgroundEffects';
import { usePerformance } from '../../context/PerformanceContext';
import { useLenis } from 'lenis/react';

const MARKERS = [
    { location: [18.9307, 72.8334], size: 0.07 },
    { location: [19.0654, 72.8691], size: 0.07 },
    { location: [51.5144, -0.0987], size: 0.05 },
    { location: [40.7069, -74.0089], size: 0.05 },
    { location: [-23.5505, -46.6333], size: 0.05 },
    { location: [35.6817, 139.7714], size: 0.05 },
    { location: [-33.8688, 151.2093], size: 0.05 },
];

/* ─────────────────────────────────────────────────────────────────────
 * Particle Star Field — tiny dots drifting upward for depth
 * ──────────────────────────────────────────────────────────────────── */
const StarField = ({ opacity }) => {
    const stars = React.useMemo(() => 
        Array.from({ length: 60 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 5,
            duration: 3 + Math.random() * 4,
        })), []
    );

    return (
        <motion.div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity }}>
            {stars.map(star => (
                <motion.div
                    key={star.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                    }}
                    animate={{
                        opacity: [0, 0.6, 0],
                        y: [0, -30],
                    }}
                    transition={{
                        duration: star.duration,
                        delay: star.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </motion.div>
    );
};

/* ─────────────────────────────────────────────────────────────────────
 * Light Rays — volumetric beams emanating from behind the peak
 * ──────────────────────────────────────────────────────────────────── */
const LightRays = ({ opacity }) => {
    const rays = React.useMemo(() => [
        { angle: -35, width: 80, opacity: 0.12 },
        { angle: -20, width: 50, opacity: 0.08 },
        { angle: -8, width: 40, opacity: 0.15 },
        { angle: 5, width: 60, opacity: 0.1 },
        { angle: 18, width: 45, opacity: 0.12 },
        { angle: 32, width: 70, opacity: 0.08 },
    ], []);

    return (
        <motion.div 
            className="absolute bottom-[10%] left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ opacity, width: '100%', height: '80vh' }}
        >
            {rays.map((ray, i) => (
                <motion.div
                    key={i}
                    className="absolute bottom-0 left-1/2 origin-bottom"
                    style={{
                        width: `${ray.width}px`,
                        height: '100%',
                        transform: `translateX(-50%) rotate(${ray.angle}deg)`,
                        background: `linear-gradient(to top, rgba(52,211,153,${ray.opacity}) 0%, rgba(52,211,153,${ray.opacity * 0.3}) 40%, transparent 80%)`,
                        filter: 'blur(15px)',
                    }}
                    animate={{
                        opacity: [ray.opacity, ray.opacity * 1.5, ray.opacity],
                    }}
                    transition={{
                        duration: 3 + i * 0.5,
                        delay: i * 0.3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </motion.div>
    );
};

/* ─────────────────────────────────────────────────────────────────────
 * Mountain Silhouette — multi-layered parallax with atmospheric fog
 * ──────────────────────────────────────────────────────────────────── */
const MountainSilhouette = ({ drawProgress, opacity, blur, glowIntensity, scrollYProgress }) => {
    // Parallax: back ridges move slower than front
    const backRidgeY = useTransform(scrollYProgress, [0.38, 0.72], ['15%', '-5%']);
    const midRidgeY = useTransform(scrollYProgress, [0.38, 0.72], ['10%', '-8%']);
    const frontRidgeY = useTransform(scrollYProgress, [0.38, 0.72], ['5%', '-12%']);

    return (
        <motion.div
            className="absolute inset-0 flex items-end justify-center pointer-events-none"
            style={{ opacity, filter: blur }}
        >
            {/* Volumetric glow — main corona */}
            <motion.div
                className="absolute bottom-[12%] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                style={{
                    opacity: glowIntensity,
                    width: '120vw',
                    height: '80vh',
                    background: 'radial-gradient(ellipse at 50% 85%, rgba(52,211,153,0.4) 0%, rgba(52,211,153,0.15) 20%, rgba(6,182,212,0.08) 40%, transparent 65%)',
                }}
            />
            {/* Secondary warm pulse */}
            <motion.div
                className="absolute bottom-[8%] left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
                style={{
                    opacity: glowIntensity,
                    width: '80vw',
                    height: '60vh',
                    background: 'radial-gradient(ellipse at 50% 90%, rgba(16,185,129,0.3) 0%, rgba(52,211,153,0.1) 35%, transparent 65%)',
                }}
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.8, 1, 0.8],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Light Rays */}
            <LightRays opacity={glowIntensity} />

            {/* ── Back Ridge (farthest, lightest) ── */}
            <motion.svg
                viewBox="0 0 1440 500"
                className="absolute bottom-0 w-full h-auto max-h-[55vh]"
                preserveAspectRatio="xMidYMax meet"
                style={{ y: backRidgeY, overflow: 'visible' }}
            >
                <path
                    d="M-100,500 L150,400 L350,320 L500,280 L620,220 L700,150 L720,60 L740,150 L820,220 L940,280 L1100,320 L1300,400 L1540,500 Z"
                    fill="rgba(15,23,42,0.35)"
                />
            </motion.svg>

            {/* Atmospheric fog layer between ridges */}
            <motion.div 
                className="absolute bottom-[15%] w-full h-[20vh] pointer-events-none"
                style={{ opacity: glowIntensity }}
            >
                <div className="w-full h-full" style={{
                    background: 'linear-gradient(to top, rgba(15,23,42,0.5) 0%, rgba(52,211,153,0.03) 50%, transparent 100%)',
                }} />
            </motion.div>

            {/* ── Mid Ridge ── */}
            <motion.svg
                viewBox="0 0 1440 500"
                className="absolute bottom-0 w-full h-auto max-h-[50vh]"
                preserveAspectRatio="xMidYMax meet"
                style={{ y: midRidgeY, overflow: 'visible' }}
            >
                <path
                    d="M-50,500 L200,410 L400,330 L550,260 L650,180 L710,100 L720,45 L730,100 L790,180 L890,260 L1040,330 L1240,410 L1490,500 Z"
                    fill="rgba(15,23,42,0.6)"
                />
            </motion.svg>

            {/* ── Front Ridge (closest, darkest, sharpest peak) ── */}
            <motion.svg
                viewBox="0 0 1440 500"
                className="absolute bottom-0 w-full h-auto max-h-[45vh] z-10"
                preserveAspectRatio="xMidYMax meet"
                style={{ y: frontRidgeY, overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id="mountainFill" x1="0.5" y1="0" x2="0.5" y2="1">
                        <stop offset="0%" stopColor="rgba(10,15,30,0.98)" />
                        <stop offset="100%" stopColor="rgba(10,15,30,1)" />
                    </linearGradient>
                    <linearGradient id="peakGlow" x1="0.5" y1="0" x2="0.5" y2="1">
                        <stop offset="0%" stopColor="rgba(52,211,153,1)" />
                        <stop offset="30%" stopColor="rgba(52,211,153,0.6)" />
                        <stop offset="100%" stopColor="rgba(52,211,153,0)" />
                    </linearGradient>
                </defs>

                {/* Main silhouette */}
                <motion.path
                    d="M-100,500 L280,390 L420,290 L560,210 L660,130 L720,30 L780,130 L880,210 L1020,290 L1160,390 L1540,500 Z"
                    fill="url(#mountainFill)"
                    style={{ opacity: drawProgress }}
                />

                {/* Glowing ridge line — draws itself */}
                <motion.path
                    d="M280,390 L420,290 L560,210 L660,130 L720,30 L780,130 L880,210 L1020,290 L1160,390"
                    fill="none"
                    stroke="url(#peakGlow)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{ pathLength: drawProgress }}
                />

                {/* Snow/light cap on the very peak */}
                <motion.path
                    d="M680,110 L720,30 L760,110"
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    style={{ pathLength: drawProgress }}
                />
                
                {/* Bright point at peak tip */}
                <motion.circle
                    cx="720" cy="30" r="4"
                    fill="rgba(52,211,153,0.9)"
                    style={{ opacity: drawProgress }}
                />
                <motion.circle
                    cx="720" cy="30" r="12"
                    fill="none"
                    stroke="rgba(52,211,153,0.3)"
                    strokeWidth="1"
                    style={{ opacity: drawProgress }}
                    animate={{ r: [12, 20, 12], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.svg>
        </motion.div>
    );
};


const IntroSequence = ({ onComplete, isDark }) => {
    const containerRef = useRef(null);
    const globeCanvasRef = useRef(null);
    const [isComplete, setIsComplete] = useState(false);
    const { isLowPerformance } = usePerformance();
    const lenis = useLenis();
    const [autoScrollStarted, setAutoScrollStarted] = useState(false);
    
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });
    
    const scrollRef = useRef(0);
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 400, damping: 90 });
    
    useEffect(() => {
        return smoothProgress.onChange((latest) => {
            scrollRef.current = latest;
        });
    }, [smoothProgress]);

    useEffect(() => {
        return scrollYProgress.onChange((latest) => {
            // Start automatic cinematic sequence when reaching the mountain (0.34)
            if (latest >= 0.34 && !autoScrollStarted && lenis && containerRef.current) {
                setAutoScrollStarted(true);
                // Auto scroll to the end of the sequence over 6 seconds
                lenis.scrollTo(containerRef.current.offsetHeight, { 
                    duration: 6,
                    easing: (t) => 1 - Math.pow(1 - t, 4) // Smooth ease-out
                });
            }

            if (latest >= 0.95 && !isComplete) {
                setIsComplete(true);
                if (onComplete) {
                    if (lenis) {
                        lenis.scrollTo(0, { immediate: true });
                    } else {
                        setTimeout(() => window.scrollTo(0, 0), 0);
                    }
                    onComplete();
                }
            }
        });
    }, [scrollYProgress, isComplete, onComplete, lenis, autoScrollStarted]);

    // Handle Escape key to skip intro
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (containerRef.current) {
                    if (lenis) {
                        lenis.scrollTo(containerRef.current.offsetHeight, { duration: 0.5 });
                    } else {
                        window.scrollTo({ top: containerRef.current.offsetHeight, behavior: 'smooth' });
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lenis]);

    // ── Create the cobe globe ──
    useEffect(() => {
        if (!globeCanvasRef.current || isLowPerformance) return;

        let width = 800;
        const startPhi = -72.83 * Math.PI / 180;

        const palette = {
            dark: 0,
            diffuse: 3,
            mapSamples: 12000, // Reduced from 24000 for better performance
            mapBrightness: 1.8,
            baseColor: [0.88, 0.92, 0.96],
            markerColor: [0.1, 0.1, 0.1],
            glowColor: [0.85, 0.90, 0.96],
        };

        const globe = createGlobe(globeCanvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: startPhi,
            theta: 0.15,
            ...palette,
            markers: MARKERS,
            onRender: (state) => {
                const progress = scrollRef.current;
                
                if (typeof window !== 'undefined') {
                    if (progress < 0.80) {
                        const currentPhi = startPhi + (progress * Math.PI * 4);
                        state.phi = currentPhi;
                        window.__CRESTA_INTRO_PHI = currentPhi;
                        window.__CRESTA_INTRO_ACTIVE = true;
                    } else {
                        window.__CRESTA_INTRO_ACTIVE = false;
                        if (window.__INDIA_GLOBE_PHI !== undefined) {
                            state.phi = window.__INDIA_GLOBE_PHI;
                        }
                    }
                }
                state.width = width * 2;
                state.height = width * 2;
            },
        });

        setTimeout(() => {
            if (globeCanvasRef.current) {
                globeCanvasRef.current.style.opacity = '1';
            }
        }, 200);

        return () => globe.destroy();
    }, []);

    /* ════════════════════════════════════════════════════════════════════
     * SCROLL TIMELINE — Cinematic Mountain Eclipse & Sunrise
     * 
     * 0.00 → 0.16  Scene 1: Logo + "Cresta." (dramatic hold)
     * 0.16 → 0.26  Scene 2a: "Intelligence."
     * 0.26 → 0.36  Scene 2b: "Precision."
     * 0.34 → 0.56  Scene 3: Mountain rises + star field + eclipse glow
     * 0.44 → 0.56  Scene 3b: "The Pinnacle of Intelligence."
     * 0.50 → 0.72  Scene 4: Globe rises behind mountain, mountain blurs
     * 0.72 → 0.92  Scene 5: Globe positions into hero section
     * ════════════════════════════════════════════════════════════════════ */

    // ── Scene 1: Logo ──
    const logoOpacity = useTransform(scrollYProgress, [0, 0.05, 0.11, 0.16], [1, 1, 1, 0]);
    const logoScale = useTransform(scrollYProgress, [0, 0.11, 0.16], [1, 1.08, 1.35]);
    const logoBlur = useTransform(scrollYProgress, [0.12, 0.16], [0, 8]);
    const logoBlurFilter = useTransform(logoBlur, (v) => `blur(${v}px)`);

    // ── Scene 2: Taglines ──
    const text1Opacity = useTransform(scrollYProgress, [0.16, 0.20, 0.23, 0.26], [0, 1, 1, 0]);
    const text1Y = useTransform(scrollYProgress, [0.16, 0.23, 0.26], [50, 0, -50]);
    
    const text2Opacity = useTransform(scrollYProgress, [0.26, 0.30, 0.33, 0.36], [0, 1, 1, 0]);
    const text2Y = useTransform(scrollYProgress, [0.26, 0.33, 0.36], [50, 0, -50]);

    // ── Scene 3: Mountain + Eclipse ──
    const mountainDrawProgress = useTransform(scrollYProgress, [0.34, 0.46], [0, 1]);
    const mountainOpacity = useTransform(scrollYProgress, [0.34, 0.40, 0.64, 0.72], [0, 1, 1, 0]);
    const mountainBlur = useTransform(scrollYProgress, [0.64, 0.72], [0, 25]);
    const mountainBlurFilter = useTransform(mountainBlur, (v) => `blur(${v}px)`);
    const eclipseGlowIntensity = useTransform(scrollYProgress, [0.38, 0.50, 0.62, 0.70], [0, 0.7, 1, 0]);
    
    // Star field fades in with mountain, out before globe dominates
    const starFieldOpacity = useTransform(scrollYProgress, [0.34, 0.42, 0.60, 0.68], [0, 0.5, 0.5, 0]);
    
    // Pinnacle tagline
    const pinnacleOpacity = useTransform(scrollYProgress, [0.44, 0.48, 0.53, 0.56], [0, 1, 1, 0]);
    const pinnacleY = useTransform(scrollYProgress, [0.44, 0.48, 0.53, 0.56], [30, 0, 0, -30]);
    const pinnacleScale = useTransform(scrollYProgress, [0.44, 0.53, 0.56], [0.92, 1.02, 1.08]);

    // ── Scene 4: Globe rises from behind mountain ──
    const globeOpacity = useTransform(
        scrollYProgress, 
        [0.48, 0.55, 0.62, 0.80, 0.86, 0.90, 0.92], 
        [0, 0.4, 1, 1, 1, 0.5, 0]
    );

    // Layout for hero position
    const [layout, setLayout] = useState({ x: 0, y: 0, scale: 0.54 });
    useEffect(() => {
        const updateLayout = () => {
            const ww = window.innerWidth;
            const isDesktop = ww >= 1024;
            const isMd = ww >= 768;
            const gridWidth = Math.min(1200, ww - 48);
            const targetX = isDesktop ? (gridWidth * 0.208) : 0;
            const targetScale = isMd ? (380 / 700) : (300 / 500);
            setLayout({ x: targetX, y: 0, scale: targetScale });
        };
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    const globeScale = useTransform(
        scrollYProgress, 
        [0.48, 0.55, 0.65, 0.75, 0.85, 0.92], 
        [4, 3.2, 2, 1.4, 1.1, layout.scale]
    );
    const globeY = useTransform(
        scrollYProgress, 
        [0.48, 0.55, 0.62, 0.70, 0.80, 0.92], 
        ['90%', '60%', '30%', '10%', '0%', '0px']
    );
    const globeX = useTransform(
        scrollYProgress, 
        [0.82, 0.86, 0.90, 0.92], 
        [0, layout.x * 0.3, layout.x * 0.7, layout.x]
    );

    // Background darkens for mountain scene, then lightens back
    const bgDarkness = useTransform(scrollYProgress, [0.30, 0.38, 0.65, 0.78], [0, 1, 1, 0]);
    
    const overlayOpacity = useTransform(scrollYProgress, [0.78, 0.92], [1, 0]);

    return (
        <div ref={containerRef} style={{ height: '700vh' }} className="relative">
            <motion.div 
                className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden pointer-events-none"
                style={{ opacity: overlayOpacity }}
            >
                {/* Base background */}
                <div className="absolute inset-0 bg-white dark:bg-black transition-colors duration-700" />
                
                {/* Dark cinematic overlay for mountain scene */}
                <motion.div 
                    className="absolute inset-0 bg-[#0a0f1e] pointer-events-none"
                    style={{ opacity: bgDarkness }}
                />
                
                {/* Background ticker effects (fade out during mountain) */}
                <motion.div 
                    className="absolute inset-0 pointer-events-none"
                    style={{ opacity: useTransform(scrollYProgress, [0.30, 0.38], [0.6, 0.15]) }}
                >
                    <BackgroundEffects isDark={isDark} />
                </motion.div>

                {/* Ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
                />

                {/* Star field — appears during mountain scene */}
                <StarField opacity={starFieldOpacity} />
                
                {/* ── Scene 1: Logo + "Cresta." ── */}
                <motion.div 
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ opacity: logoOpacity, scale: logoScale, filter: logoBlurFilter }}
                >
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col items-center justify-center gap-6"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-black dark:text-white transform scale-[2.5] drop-shadow-[0_0_20px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-colors duration-700"
                        >
                            <Logo />
                        </motion.div>
                        
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-baseline justify-center"
                        >
                            <span className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-black dark:text-white tracking-[-0.04em] apple-display transition-colors duration-700">
                                Cresta
                            </span>
                            <motion.span 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.9, duration: 0.5, type: "spring", stiffness: 200 }}
                                className="inline-block w-2.5 h-2.5 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 rounded-full bg-emerald-400 ml-1 mb-2 md:mb-3 shadow-[0_0_20px_rgba(52,211,153,0.8),0_0_60px_rgba(52,211,153,0.4)]"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                            className="mt-2 text-sm md:text-base text-notion-muted font-medium tracking-wide"
                        >
                            AI-Powered Wealth Management
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* ── Scene 2: Typography ── */}
                <motion.div 
                    className="absolute inset-0 flex items-center justify-center text-center px-4"
                    style={{ opacity: text1Opacity, y: text1Y }}
                >
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-black dark:text-white tracking-tight apple-display transition-colors duration-700">
                        Intelligence.
                    </h2>
                </motion.div>

                <motion.div 
                    className="absolute inset-0 flex items-center justify-center text-center px-4"
                    style={{ opacity: text2Opacity, y: text2Y }}
                >
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-black dark:text-white tracking-tight apple-display transition-colors duration-700">
                        Precision.
                    </h2>
                </motion.div>

                {/* ── Scene 3: Mountain Silhouette + Eclipse ── */}
                <MountainSilhouette 
                    drawProgress={mountainDrawProgress}
                    opacity={mountainOpacity}
                    blur={mountainBlurFilter}
                    glowIntensity={eclipseGlowIntensity}
                    scrollYProgress={scrollYProgress}
                />

                {/* "The Pinnacle of Intelligence" */}
                <motion.div 
                    className="absolute inset-0 flex items-center justify-center text-center px-4 z-20"
                    style={{ opacity: pinnacleOpacity, y: pinnacleY, scale: pinnacleScale }}
                >
                    <div className="flex flex-col items-center gap-5">
                        <motion.span 
                            className="text-[10px] md:text-xs uppercase tracking-[0.35em] font-semibold text-emerald-400/70"
                            style={{ opacity: pinnacleOpacity }}
                        >
                            cresta — the peak
                        </motion.span>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight apple-display bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                            The Pinnacle of Intelligence.
                        </h2>
                        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent mt-2" />
                    </div>
                </motion.div>

                {/* ── Scene 4: Globe rises from behind mountain ── */}
                <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ 
                        opacity: globeOpacity,
                        scale: globeScale,
                        y: globeY,
                        x: globeX,
                    }}
                >
                    <div className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] relative">
                        <div className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                background: 'radial-gradient(circle at 50% 40%, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.05) 40%, transparent 70%)',
                            }}
                        />
                        {isLowPerformance ? (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300 shadow-[inset_0_-20px_60px_rgba(0,0,0,0.1),0_10px_30px_rgba(0,0,0,0.05)] opacity-90 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,0.8)_0%,transparent_60%)] pointer-events-none"></div>
                                <div className="absolute w-full h-[1px] bg-blue-300/30 top-1/2 left-0 -translate-y-1/2 pointer-events-none"></div>
                                <div className="absolute h-full w-[1px] bg-blue-300/30 left-1/2 top-0 -translate-x-1/2 pointer-events-none"></div>
                            </div>
                        ) : (
                            <canvas
                                ref={globeCanvasRef}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    contain: 'layout paint size',
                                    opacity: 0,
                                    transition: 'opacity 1s ease',
                                }}
                            />
                        )}
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div 
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.06], [1, 0]) }}
                >
                    <span className="text-xs uppercase tracking-[0.2em] font-medium text-black/50 dark:text-white/50 transition-colors duration-700">Scroll to explore</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <ChevronDown className="w-6 h-6 text-black/50 dark:text-white/50 transition-colors duration-700" />
                    </motion.div>
                </motion.div>

                {/* Skip Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    onClick={() => {
                        if (containerRef.current) {
                            if (lenis) {
                                lenis.scrollTo(containerRef.current.offsetHeight, { duration: 0.5 });
                            } else {
                                window.scrollTo({ top: containerRef.current.offsetHeight, behavior: 'smooth' });
                            }
                        }
                    }}
                    className="absolute bottom-10 right-10 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white text-sm font-medium tracking-wide flex items-center gap-2 transition-all bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 px-5 py-2.5 rounded-full backdrop-blur-md border border-black/10 dark:border-white/10 cursor-pointer pointer-events-auto shadow-lg"
                >
                    Skip Intro <span className="opacity-50 text-[10px] uppercase font-bold tracking-widest">(Esc)</span> <ArrowRight className="w-4 h-4 ml-1" />
                </motion.button>
            </motion.div>
        </div>
    );
};

export default IntroSequence;
