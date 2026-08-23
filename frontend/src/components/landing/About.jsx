import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Target, Eye, Users } from 'lucide-react';

const About = () => {
    const { t } = useTranslation();
    const containerRef = useRef(null);

    const stats = [
        { label: 'Trained Profiles', value: '25K+' },
        { label: 'Risk Accuracy', value: '84%' },
        { label: 'Directional Edge*', value: '55%' },
    ];

    const values = [
        {
            icon: <Target className="w-8 h-8 text-notion-text" />,
            title: t('about_mission'),
            desc: t('about_mission_desc')
        },
        {
            icon: <Eye className="w-8 h-8 text-notion-text" />,
            title: t('about_vision'),
            desc: t('about_vision_desc')
        },
        {
            icon: <Users className="w-8 h-8 text-notion-text" />,
            title: t('about_team'),
            desc: t('about_team_desc')
        }
    ];

    return (
        <section id="about" ref={containerRef} className="py-32 bg-notion-bg relative overflow-hidden">
            {/* Minimal Background gradient */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-notion-border to-transparent" />
            
            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                <div className="mb-24 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-notion-text apple-header-1 tracking-tight"
                    >
                        {t('about_title')}
                    </motion.h2>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-1 w-24 bg-notion-text rounded-full origin-center mx-auto"
                    ></motion.div>
                </div>

                {/* Staggered Timeline Layout */}
                <div className="relative max-w-4xl mx-auto mb-32">
                    {/* Vertical line */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-notion-border to-transparent hidden md:block" />
                    
                    {values.map((item, index) => (
                        <div key={index} className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-24 relative ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                            <div className={`flex-1 text-center ${index % 2 === 1 ? 'md:text-left' : 'md:text-right'}`}>
                                <motion.div
                                    initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
                                >
                                    <div className={`inline-flex mb-6 p-4 rounded-2xl apple-glass shadow-sm ${index % 2 === 1 ? 'md:mr-auto' : 'md:ml-auto'}`}>
                                        {item.icon}
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4 text-notion-text apple-header-1">{item.title}</h3>
                                    <p className="text-lg text-notion-muted leading-relaxed">
                                        {item.desc}
                                    </p>
                                </motion.div>
                            </div>
                            
                            {/* Center dot */}
                            <div className="hidden md:flex justify-center items-center w-12 h-12 relative z-10">
                                <div className="w-3 h-3 rounded-full bg-notion-text shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
                            </div>
                            
                            {/* Empty space for the other side */}
                            <div className="flex-1 hidden md:block" />
                        </div>
                    ))}
                </div>

                {/* Floating Stats Bar */}
                <div className="relative max-w-5xl mx-auto">
                    {/* Glow behind stats */}
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-emerald-bg via-accent-blue-bg to-accent-emerald-bg blur-[60px] opacity-60 rounded-full" />
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="apple-glass rounded-3xl p-10 md:p-14 relative z-10 flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4 overflow-hidden"
                    >
                        {/* Shimmer effect inside the bar */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[100%] animate-[shimmer_3s_infinite]" />

                        {stats.map((stat, index) => (
                            <div key={index} className="text-center flex-1 w-full md:w-auto">
                                <div className="text-5xl md:text-6xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-br from-notion-text to-notion-muted tracking-tighter">
                                    {stat.value}
                                </div>
                                <div className="text-sm font-bold uppercase tracking-[0.2em] text-notion-muted">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                    
                    <div className="text-center mt-6">
                        <p className="text-xs text-notion-muted font-medium opacity-60">
                            *55% out-of-sample directional accuracy established over 249 trading days across major Nifty 50 equities.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
