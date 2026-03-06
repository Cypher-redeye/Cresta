import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Target, Eye, Users } from 'lucide-react';

const About = () => {
    const { t } = useTranslation();

    const stats = [
        { label: 'Active Users', value: '10K+' },
        { label: 'Total AUM', value: '₹500Cr+' },
        { label: 'AI Models', value: '25+' },
    ];

    const values = [
        {
            icon: <Target className="w-8 h-8 text-cyan-600 dark:text-neon-cyan" />,
            title: t('about_mission'),
            desc: t('about_mission_desc')
        },
        {
            icon: <Eye className="w-8 h-8 text-blue-600 dark:text-neon-blue" />,
            title: t('about_vision'),
            desc: t('about_vision_desc')
        },
        {
            icon: <Users className="w-8 h-8 text-emerald-600 dark:text-neon-emerald" />,
            title: t('about_team'),
            desc: t('about_team_desc')
        }
    ];

    return (
        <section id="about" className="py-24 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl font-bold mb-6"
                    >
                        {t('about_title')}
                    </motion.h2>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full mb-8"
                    ></motion.div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {values.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className="glass-panel p-10 rounded-3xl relative group"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                            <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 w-fit">
                                {item.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                                {item.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-12 glass-panel rounded-3xl bg-cyan-500/5 border-cyan-500/10">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-neon-cyan dark:to-neon-blue mb-2">
                                {stat.value}
                            </div>
                            <div className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default About;
