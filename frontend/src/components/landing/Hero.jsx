import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Logo from '../common/Logo';
import { Link } from 'react-router-dom';
import Typewriter from '../common/Typewriter';
import IndiaGlobe from './IndiaGlobe';
import TextReveal from '../common/TextReveal';
import MagneticWrapper from '../common/MagneticWrapper';
import { useScroll, useTransform } from 'framer-motion';


const Hero = () => {
    const { t } = useTranslation();
    const { scrollY } = useScroll();
    const globeY = useTransform(scrollY, [0, 1000], [0, -150]);

    const openAI = () => {
        window.dispatchEvent(new CustomEvent('open-command-palette-ai'));
    };

    return (
        <section className="relative min-h-screen pt-32 pb-20 flex flex-col items-center overflow-hidden bg-transparent">
            <div className="max-w-[1200px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10 relative">
                
                {/* Left Column (Text & CTA) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="lg:col-span-5 flex flex-col justify-center items-start pt-10"
                >
                    <h1 className="text-4xl md:text-5.5xl font-extrabold leading-[1.08] tracking-[-0.04em] mb-6 apple-display">
                        <span className="block text-notion-text">
                            <TextReveal text={t('your_wealth_powered_by_intelligence').split(',')[0] + ","} delay={0.1} />
                        </span>
                        <span className="block bg-gradient-to-r from-notion-text to-notion-muted bg-clip-text text-transparent mt-2">
                            <TextReveal text={t('your_wealth_powered_by_intelligence').split(',')[1]?.trim() || 'Powered by Intelligence'} delay={0.4} />
                        </span>
                    </h1>

                    <p className="text-notion-muted text-sm md:text-[15px] leading-relaxed mb-10 max-w-lg font-normal tracking-wide">
                        {t('hero_description')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-12">
                        <MagneticWrapper className="flex-1 w-full flex">
                            <Link
                                to="/auth"
                                state={{ isSignUp: true }}
                                className="w-full py-3.5 px-8 rounded-full text-sm font-medium flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black hover:scale-[1.02] active:scale-[0.98] transition-spring shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] group"
                            >
                                {t('get_started')}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </MagneticWrapper>
                        
                        <MagneticWrapper className="flex-1 w-full flex">
                            <Link
                                to="/markets"
                                className="w-full py-3.5 px-8 rounded-full text-sm font-medium flex items-center justify-center bg-transparent border border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] transition-spring"
                            >
                                {t('explore_markets')}
                            </Link>
                        </MagneticWrapper>
                    </div>

                    {/* AI Prompt Trigger — Vercel/Linear Style */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                        className="w-full max-w-md bg-white/40 dark:bg-[#111111]/60 backdrop-blur-xl rounded-2xl p-2 relative shadow-sm border border-black/5 dark:border-white/10
                            group cursor-pointer hover:border-black/20 dark:hover:border-white/20 hover:shadow-md transition-spring overflow-hidden"
                        onClick={openAI}
                    >

                        <div className="flex items-center px-3 py-2 relative z-10">
                            <Logo width={16} height={16} animateDrawing={true} className="opacity-50 group-hover:opacity-100 transition-opacity mr-3 shrink-0" />
                            <span className="flex-1 text-notion-muted group-hover:text-notion-text transition-colors text-[13px] font-medium tracking-tight select-none">
                                Ask Cresta AI anything...
                            </span>
                            <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-80 transition-opacity ml-2 shrink-0">
                                <div className="flex items-center justify-center min-w-[24px] h-[24px] bg-black/5 dark:bg-white/10 rounded-md border border-black/10 dark:border-white/10">
                                    <span className="text-[10px] font-medium px-1.5 text-notion-text">⌘K</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Column - Globe Container */}
                <motion.div
                    style={{ y: globeY }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="lg:col-span-7 apple-glass apple-card-glow rounded-3xl relative flex items-center justify-center overflow-visible min-h-[500px]"
                >
                    <IndiaGlobe />
                </motion.div>

            </div>
        </section>
    );
};

export default Hero;
