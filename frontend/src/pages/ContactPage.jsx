import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Mail, 
    MessageSquare, 
    Send, 
    Linkedin, 
    Github, 
    Building2, 
    Sparkles, 
    CheckCircle,
    Phone,
    Globe
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const teamContacts = [
    {
        name: "Ankit Mishra",
        role: "Team Leader & Backend / Integration Lead",
        institution: "Parul University",
        linkedin: "https://www.linkedin.com/in/ankitrmishra01",
        github: "https://github.com/ankitrmishra01",
        email: "ankitrmishra01@gmail.com",
        tag: "Project Lead & Architecture"
    },
    {
        name: "Om Sharma",
        role: "Frontend & Deployment Lead",
        institution: "Parul University",
        linkedin: "https://www.linkedin.com/in/om-sharma38",
        github: "https://github.com/Cypher-redeye",
        email: "omsharma@crestafinance.me",
        tag: "UI/UX, Frontend & Deployment Lead"
    },
    {
        name: "Shivam Panchal",
        role: "Machine Learning Lead",
        institution: "Parul University",
        linkedin: "https://www.linkedin.com/in/shivam-panchal-7471052a5",
        github: "https://github.com",
        email: "shivam@crestafinance.me",
        tag: "Quantitative AI & ML"
    },
    {
        name: "Shubham Jha",
        role: "Chatbot & Conversational AI Lead",
        institution: "Parul University",
        linkedin: "https://www.linkedin.com/in/shubham-jha-986520312",
        github: "https://github.com",
        email: "shubham@crestafinance.me",
        tag: "NLP & AI Co-Pilot"
    }
];

const ContactPage = () => {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="min-h-screen bg-notion-bg text-notion-text flex flex-col selection:bg-accent-emerald/20 selection:text-accent-emerald">
            <Navbar />

            <main className="flex-1 pt-32 pb-24">
                <section className="max-w-6xl mx-auto px-6 mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-notion-hover border border-notion-border text-xs font-semibold text-accent-emerald mb-6"
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Get In Touch</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6"
                    >
                        Connect with the <span className="text-accent-emerald">Cresta Team</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg text-notion-muted max-w-2xl mx-auto leading-relaxed"
                    >
                        Have questions regarding our AI models, institutional partnerships, or academic inquiries? 
                        Reach out directly to any of our lead engineers or send us a message below.
                    </motion.p>
                </section>

                {/* Team LinkedIn & GitHub Cards */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <h2 className="text-2xl font-bold mb-8 text-center sm:text-left">Founding Engineers & Leads</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {teamContacts.map((member, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="p-6 rounded-2xl bg-notion-card border border-accent-emerald/40 hover:border-accent-emerald shadow-[0_0_25px_rgba(16,185,129,0.06)] transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-emerald bg-accent-emerald/10 px-2 py-0.5 rounded-full">
                                        {member.tag}
                                    </span>
                                    <h3 className="text-lg font-bold mt-3 text-notion-text">{member.name}</h3>
                                    <p className="text-xs font-medium text-notion-muted mt-1">{member.role}</p>
                                    <p className="text-[11px] text-notion-muted/80">{member.institution}</p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-notion-border/60 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-notion-muted">Profiles</span>
                                    <div className="flex gap-2">
                                        <a 
                                            href={member.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-notion-hover hover:bg-accent-blue/20 hover:text-accent-blue text-notion-muted transition-colors"
                                            title="Connect on LinkedIn"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                        </a>
                                        <a 
                                            href={member.github}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-lg bg-notion-hover hover:bg-accent-emerald/20 hover:text-accent-emerald text-notion-muted transition-colors"
                                            title="GitHub Profile"
                                        >
                                            <Github className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Contact Form & University Info */}
                <section className="max-w-6xl mx-auto px-6">
                    <div className="grid md:grid-cols-12 gap-10">
                        {/* Info Column */}
                        <div className="md:col-span-5 space-y-6">
                            <div className="p-8 rounded-3xl bg-notion-card border border-notion-border space-y-6">
                                <h3 className="text-xl font-bold">Project Coordinates</h3>
                                
                                <div className="flex items-start gap-4">
                                    <Building2 className="w-5 h-5 text-accent-emerald shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-sm font-bold">Institution</h4>
                                        <p className="text-xs text-notion-muted mt-0.5">Parul University, Vadodara, Gujarat, India</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Mail className="w-5 h-5 text-accent-blue shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-sm font-bold">Direct Email</h4>
                                        <a href="mailto:ankitrmishra01@gmail.com" className="text-xs text-accent-emerald hover:underline mt-0.5 block">
                                            ankitrmishra01@gmail.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <Globe className="w-5 h-5 text-accent-emerald shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-sm font-bold">Live Platform</h4>
                                        <p className="text-xs text-notion-muted mt-0.5">crestafinance.me</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Column */}
                        <div className="md:col-span-7">
                            <div className="p-8 md:p-10 rounded-3xl bg-notion-card border border-notion-border">
                                <h3 className="text-xl font-bold mb-2">Send a Message</h3>
                                <p className="text-xs text-notion-muted mb-6">We typically respond to inquiries within 24 hours.</p>

                                {submitted ? (
                                    <div className="p-6 rounded-2xl bg-accent-emerald/10 border border-accent-emerald/30 text-center space-y-2">
                                        <CheckCircle className="w-8 h-8 text-accent-emerald mx-auto" />
                                        <h4 className="text-sm font-bold text-accent-emerald">Message Received!</h4>
                                        <p className="text-xs text-notion-muted">Thank you for reaching out. A team member will get back to you shortly.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-semibold text-notion-muted mb-1 block">Your Name</label>
                                                <input 
                                                    type="text" 
                                                    required 
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="e.g. Rahul Verma"
                                                    className="w-full px-4 py-2.5 rounded-xl bg-notion-hover border border-notion-border text-sm text-notion-text focus:outline-none focus:border-accent-emerald"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-notion-muted mb-1 block">Your Email</label>
                                                <input 
                                                    type="email" 
                                                    required 
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="name@example.com"
                                                    className="w-full px-4 py-2.5 rounded-xl bg-notion-hover border border-notion-border text-sm text-notion-text focus:outline-none focus:border-accent-emerald"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-notion-muted mb-1 block">Subject</label>
                                            <input 
                                                type="text" 
                                                required 
                                                value={formData.subject}
                                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                                placeholder="e.g. Feedback, Model Architecture, Collaboration"
                                                className="w-full px-4 py-2.5 rounded-xl bg-notion-hover border border-notion-border text-sm text-notion-text focus:outline-none focus:border-accent-emerald"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-notion-muted mb-1 block">Message</label>
                                            <textarea 
                                                rows={4} 
                                                required 
                                                value={formData.message}
                                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                                placeholder="Write your thoughts or questions here..."
                                                className="w-full px-4 py-2.5 rounded-xl bg-notion-hover border border-notion-border text-sm text-notion-text focus:outline-none focus:border-accent-emerald resize-none"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="stark-btn-primary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                                        >
                                            <span>Send Message</span>
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ContactPage;
