import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
    Shield, 
    Brain, 
    Code2, 
    Bot, 
    Sparkles, 
    Github, 
    Linkedin, 
    ArrowRight, 
    TrendingUp, 
    Target, 
    Users, 
    Zap,
    CheckCircle2
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const teamMembers = [
    {
        name: "Ankit Mishra",
        role: "Team Leader & Backend / Integration Lead",
        institution: "Parul University",
        bio: "Oversees overall project coordination, core system integration, Django REST architecture, security protocols, database modeling, and real-time market data pipelines.",
        focus: ["Project Leadership", "System Integration", "Django REST Framework", "PostgreSQL & Redis"],
        github: "https://github.com/ankitrmishra01",
        linkedin: "https://www.linkedin.com/in/ankitrmishra01",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces",
        tag: "Team Lead & Backend"
    },
    {
        name: "Om Sharma",
        role: "Frontend Lead",
        institution: "Parul University",
        bio: "Leads complete frontend development, Modern UX/UI architecture, Framer Motion interactions, responsive layouts, and client-side performance optimization.",
        focus: ["Frontend Architecture", "React & Vite", "Framer Motion", "Tailwind CSS"],
        github: "https://github.com/Cypher-redeye",
        linkedin: "https://www.linkedin.com/in/om-sharma38",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces",
        tag: "Frontend & UX"
    },
    {
        name: "Shivam Panchal",
        role: "Machine Learning Lead",
        institution: "Parul University",
        bio: "Develops machine learning algorithms, risk classification models, FinBERT financial news sentiment analysis, and stock price forecasting pipelines.",
        focus: ["ML Architecture", "XGBoost Profiler", "FinBERT Sentiment", "Stock Predictions"],
        github: "https://github.com",
        linkedin: "https://www.linkedin.com/in/shivam-panchal-7471052a5",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces",
        tag: "AI & ML Lead"
    },
    {
        name: "Shubham Jha",
        role: "Chatbot & Conversational AI Lead",
        institution: "Parul University",
        bio: "Engineers Cresta's AI conversational co-pilot, LangChain tool-calling workflows, real-time SSE streaming, and intelligent portfolio assistant capabilities.",
        focus: ["Chatbot Architecture", "LangChain & LLMs", "Tool-Calling Agents", "SSE Streaming"],
        github: "https://github.com",
        linkedin: "https://www.linkedin.com/in/shubham-jha-986520312",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=faces",
        tag: "Chatbot & NLP"
    }
];

const pillars = [
    {
        icon: <Shield className="w-6 h-6 text-accent-emerald" />,
        title: "Demystifying Stock Markets",
        desc: "Millions of middle-class individuals avoid investing because they perceive stock investment as similar to gambling. Cresta replaces fear with institutional-grade risk profiling and explainable mathematical models."
    },
    {
        icon: <Zap className="w-6 h-6 text-accent-blue" />,
        title: "Zero Costly Intermediaries",
        desc: "Traditional wealth managers and advisory firms charge users exorbitant fees for stock predictions and investment advice. Cresta provides automated, unbiased guidance directly to you at zero commission."
    },
    {
        icon: <Brain className="w-6 h-6 text-accent-emerald" />,
        title: "Explainable, Transparent AI",
        desc: "No black boxes. Every stock recommendation and portfolio allocation comes with clear, plain-English rationales based on real financial fundamentals and live market data."
    }
];

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-notion-bg text-notion-text flex flex-col selection:bg-accent-emerald/20 selection:text-accent-emerald">
            <Navbar />

            <main className="flex-1 pt-32 pb-24">
                {/* Hero Section */}
                <section className="max-w-6xl mx-auto px-6 mb-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-notion-hover border border-notion-border text-xs font-semibold text-accent-emerald mb-6"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>The Vision Behind Cresta</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 max-w-4xl mx-auto"
                    >
                        Intelligent Wealth Advisory for the <span className="text-accent-emerald">Everyday Investor</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-notion-muted max-w-3xl mx-auto leading-relaxed"
                    >
                        Cresta is an AI-based robo-advisory system designed to eliminate the dependency on costly intermediaries and large firms that charge users for stock predictions and investment advice.
                    </motion.p>
                </section>

                {/* Mission & Problem Statement */}
                <section className="max-w-6xl mx-auto px-6 mb-28">
                    <div className="p-8 md:p-12 rounded-3xl bg-notion-hover/40 border border-notion-border relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-emerald/10 rounded-full blur-[100px] pointer-events-none" />
                        
                        <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
                            <div className="md:col-span-7 space-y-4">
                                <span className="text-xs uppercase tracking-widest font-bold text-accent-emerald">Our Core Mission</span>
                                <h2 className="text-2xl sm:text-3xl font-bold">Bridging the Gap for Middle-Class Investors</h2>
                                <p className="text-notion-muted leading-relaxed">
                                    Our primary target audience is middle-class individuals who avoid investing in the stock market because they perceive stock investment as similar to gambling. 
                                    Cresta aims to make investment guidance more accessible, simple, and affordable for them.
                                </p>
                                <p className="text-notion-muted leading-relaxed">
                                    By uniting behavioural risk profiling, real-time market data, backtested algorithmic strategies, and an intelligent conversational co-pilot, 
                                    we empower users to build disciplined, data-backed portfolios without second-guessing.
                                </p>
                            </div>
                            <div className="md:col-span-5 space-y-3">
                                {[
                                    "Zero intermediary costs or subscription lock-ins",
                                    "Tailored risk classification based on age, income & goals",
                                    "Live Nifty 50 sentiment tracking powered by FinBERT",
                                    "Interactive AI Co-Pilot for real-time market queries"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-notion-bg/60 border border-notion-border/60">
                                        <CheckCircle2 className="w-5 h-5 text-accent-emerald shrink-0 mt-0.5" />
                                        <span className="text-sm font-medium text-notion-text">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Pillars */}
                <section className="max-w-6xl mx-auto px-6 mb-28">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Our Guiding Pillars</h2>
                        <p className="text-notion-muted max-w-xl mx-auto text-sm">
                            Built upon transparency, accessibility, and modern machine learning.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {pillars.map((pillar, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="p-8 rounded-2xl bg-notion-card border border-notion-border hover:border-notion-muted/40 transition-all duration-300"
                            >
                                <div className="p-3 rounded-xl bg-notion-hover w-fit mb-6">
                                    {pillar.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{pillar.title}</h3>
                                <p className="text-notion-muted text-sm leading-relaxed">{pillar.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Founding Team Section */}
                <section className="max-w-6xl mx-auto px-6 mb-28">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-notion-hover border border-notion-border text-xs font-semibold text-accent-emerald mb-3">
                            <Users className="w-3.5 h-3.5" />
                            <span>Parul University Engineering Team</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Meet The Team</h2>
                        <p className="text-notion-muted max-w-xl mx-auto text-sm">
                            The engineers and architects building Cresta's robo-advisory ecosystem.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {teamMembers.map((member, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="p-8 rounded-3xl bg-notion-card border border-accent-emerald/50 shadow-[0_0_30px_rgba(16,185,129,0.08)] hover:border-accent-emerald transition-all duration-300 group flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-emerald bg-accent-emerald/10 px-2.5 py-1 rounded-full">
                                                {member.tag}
                                            </span>
                                            <h3 className="text-2xl font-bold mt-3 text-notion-text">{member.name}</h3>
                                            <p className="text-sm font-medium text-notion-muted mt-0.5">{member.role}</p>
                                            <p className="text-xs text-notion-muted/80">{member.institution}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {member.github && (
                                                <a 
                                                    href={member.github} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-notion-hover hover:text-accent-emerald text-notion-muted transition-colors"
                                                    title="GitHub Profile"
                                                >
                                                    <Github className="w-4 h-4" />
                                                </a>
                                            )}
                                            {member.linkedin && (
                                                <a 
                                                    href={member.linkedin} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg bg-notion-hover hover:text-accent-blue text-notion-muted transition-colors"
                                                    title="LinkedIn Profile"
                                                >
                                                    <Linkedin className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-notion-muted text-sm leading-relaxed mb-6">
                                        {member.bio}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-notion-border/60">
                                    <div className="text-xs font-semibold text-notion-muted mb-2">Key Areas of Ownership:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {member.focus.map((skill, sIdx) => (
                                            <span key={sIdx} className="text-xs px-2.5 py-1 rounded-md bg-notion-hover text-notion-text border border-notion-border/40">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Call to Action */}
                <section className="max-w-4xl mx-auto px-6 text-center">
                    <div className="p-10 rounded-3xl bg-gradient-to-b from-notion-hover to-notion-card border border-notion-border">
                        <h2 className="text-3xl font-bold mb-4">Ready to Start Your Investment Journey?</h2>
                        <p className="text-notion-muted text-sm max-w-lg mx-auto mb-8">
                            Take our 2-minute behavioral risk assessment and discover a personalized portfolio tailored to your unique financial goals.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/risk-assessment"
                                className="stark-btn-primary py-3 px-8 rounded-full text-sm font-semibold flex items-center gap-2"
                            >
                                <span>Begin Assessment</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/markets"
                                className="py-3 px-8 rounded-full text-sm font-semibold bg-notion-hover hover:bg-notion-border text-notion-text transition-colors"
                            >
                                Explore Live Markets
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default AboutPage;
