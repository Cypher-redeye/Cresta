import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Typewriter from '../common/Typewriter';
import IndiaGlobe from './IndiaGlobe';

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            {/* Background handled by BackgroundEffects.jsx at root level */}
            <div className="absolute inset-0 z-0 pointer-events-none"></div>

            <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">

                <div className="text-left space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center px-3 py-1 rounded-full border border-emerald-500/30 dark:border-neon-emerald/30 bg-emerald-50 dark:bg-neon-emerald/10 text-emerald-600 dark:text-neon-emerald text-sm mb-6">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            <span>Next Gen Investing</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-4 min-h-[160px] md:min-h-[220px]">
                            Your Wealth, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-neon-emerald dark:to-emerald-400 text-glow block mt-2">
                                <Typewriter text="Powered by Intelligence" delay={50} />
                            </span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-lg leading-relaxed">
                            Experience the future of asset management with our AI-driven robo-advisory system. Real-time analysis, automated rebalancing, and personalized growth strategies.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <Link
                            to="/auth"
                            state={{ isSignUp: true }}
                            className="glass-btn px-8 py-4 rounded-xl font-semibold text-emerald-900 dark:text-white flex items-center justify-center group"
                        >
                            Get Started
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/markets"
                            className="px-8 py-4 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:text-emerald-900 dark:hover:text-white border border-transparent hover:border-emerald-900/20 dark:hover:border-white/20 transition-all flex items-center justify-center"
                        >
                            Explore Markets
                        </Link>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative w-full"
                >
                    <IndiaGlobe />
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
