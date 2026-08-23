import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, TrendingUp, Zap, Command, X,
    Briefcase, Activity, BarChart2, ArrowUp,
    Mic, MicOff, RotateCcw, MessageSquare, PieChart
} from 'lucide-react';
import Logo from './Logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { API_BASE, apiCall } from '../../api';
import { useLenis } from 'lenis/react';


/* ─────────────────────────────────────────────
   Thinking dots indicator
   ───────────────────────────────────────────── */
const ThinkingDots = () => (
    <div className="flex items-center gap-1 py-1 px-1">
        <span className="w-[5px] h-[5px] rounded-full bg-notion-muted/50 animate-[dotPulse_1.4s_ease-in-out_0s_infinite]" />
        <span className="w-[5px] h-[5px] rounded-full bg-notion-muted/50 animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]" />
        <span className="w-[5px] h-[5px] rounded-full bg-notion-muted/50 animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]" />
    </div>
);

/* ─────────────────────────────────────────────
   Simple markdown: **bold**, newlines
   ───────────────────────────────────────────── */
const FormattedText = ({ text }) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
            <React.Fragment key={i}>
                {i > 0 && <br />}
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-semibold text-notion-text">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={j}>{part}</span>;
                })}
            </React.Fragment>
        );
    });
};

/* ─────────────────────────────────────────────
   Parse followups from AI response
   ───────────────────────────────────────────── */
const parseFollowups = (text) => {
    try {
        const jsonMatch = text.match(/\{[\s]*"followups"[\s]*:[\s]*\[.*?\]\s*\}/s);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const cleanText = text.replace(jsonMatch[0], '').trim();
            return { text: cleanText, followups: parsed.followups || [] };
        }
    } catch { /* ignore */ }
    return { text, followups: [] };
};


/* ═════════════════════════════════════════════════
   CommandPalette — Unified Search + AI Copilot
   ═════════════════════════════════════════════════ */
const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    // AI Chat state
    const [aiMode, setAiMode] = useState(false);
    const [messages, setMessages] = useState([]);
    const [aiInput, setAiInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const inputRef = useRef(null);
    const aiInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const recognitionRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { toggleTheme } = useTheme();
    const { user } = useUser();
    const { i18n } = useTranslation();
    const lenis = useLenis();

    // Lock scroll when open
    useEffect(() => {
        if (!isOpen) return;
        lenis?.stop();
        return () => lenis?.start();
    }, [isOpen, lenis]);

    // Contextual categories based on auth and route
    const isLoggedIn = !!user;
    const dynamicCategories = [];

    if (isLoggedIn) {
        if (location.pathname.includes('/dashboard')) {
            dynamicCategories.push({
                name: 'Dashboard Actions',
                items: [
                    { id: 'ctx-dash-alloc', icon: BarChart2, label: 'Analyze Asset Allocation', action: 'ASK_AI_PREFILL', query: 'Analyze my current asset allocation' },
                ]
            });
        } else if (location.pathname.includes('/markets')) {
            dynamicCategories.push({
                name: 'Market Actions',
                items: [
                    { id: 'ctx-mkt-news', icon: MessageSquare, label: 'Market Sentiment', action: 'ASK_AI_PREFILL', query: 'What is the current market sentiment?' },
                    { id: 'ctx-mkt-compare', icon: PieChart, label: 'Compare Indices', action: 'NAVIGATE', path: '/dashboard/markets' },
                ]
            });
        }

        dynamicCategories.push({
            name: 'AI Insights',
            items: [
                { id: 'ai-chat', icon: (props) => <Logo {...props} width={props.size || 16} height={props.size || 16} />, label: 'Ask AI (Chat)', action: 'ASK_AI', shortcut: 'Tab' },
                { id: 'ai-summary', icon: Activity, label: 'Generate Portfolio Summary', action: 'GOTO', path: '/dashboard' },
            ]
        });

        dynamicCategories.push({
            name: 'Navigation',
            items: [
                { id: 'nav-dashboard', icon: Briefcase, label: 'Go to Dashboard', action: 'GOTO', path: '/dashboard' },
                { id: 'nav-markets', icon: TrendingUp, label: 'Market Watch', action: 'GOTO', path: '/markets' },
            ]
        });
    } else {
        dynamicCategories.push({
            name: 'Navigation',
            items: [
                { id: 'nav-markets', icon: TrendingUp, label: 'Market Watch', action: 'GOTO', path: '/markets' },
            ]
        });
    }

    dynamicCategories.push({
        name: 'Actions',
        items: [
            { id: 'action-theme', icon: Zap, label: 'Toggle Theme', action: 'TOGGLE_THEME' },
        ]
    });

    const flatItems = dynamicCategories.flatMap(cat =>
        cat.items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    );

    // ⌘K toggle
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                if (!isOpen) {
                    setAiMode(false);
                    setQuery('');
                }
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setAiMode(false);
                setQuery('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, aiMode]);

    // Auto-focus
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (aiMode) {
                    aiInputRef.current?.focus();
                } else {
                    inputRef.current?.focus();
                }
            }, 100);
        }
    }, [isOpen, aiMode]);

    useEffect(() => { setSelectedIndex(0); }, [query]);

    // Auto-scroll chat
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // Open externally (from Hero bar)
    useEffect(() => {
        const handler = (e) => {
            setIsOpen(true);
            setAiMode(true);
            if (e.detail?.query) {
                setAiInput(e.detail.query);
            }
        };
        window.addEventListener('open-command-palette-ai', handler);
        return () => window.removeEventListener('open-command-palette-ai', handler);
    }, []);

    /* ── Execute command ── */
    const handleExecute = (item) => {
        if (item.action === 'GOTO') {
            navigate(item.path);
            setIsOpen(false);
        } else if (item.action === 'ASK_AI') {
            setAiMode(true);
            if (query.trim()) {
                setAiInput(query);
            }
            setQuery('');
        } else if (item.action === 'ASK_AI_PREFILL') {
            setAiMode(true);
            setAiInput(item.query || '');
            setQuery('');
        } else if (item.action === 'TOGGLE_THEME') {
            toggleTheme();
            setIsOpen(false);
        }
    };

    /* ── Keyboard navigation (search mode) ── */
    const handleSearchKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % (flatItems.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + flatItems.length) % (flatItems.length || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatItems.length > 0) {
                handleExecute(flatItems[selectedIndex]);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (flatItems.length > 0 && flatItems[selectedIndex].action === 'ASK_AI') {
                handleExecute(flatItems[selectedIndex]);
            }
        }
    };

    /* ── Send AI message ── */
    const sendMessage = async (messageText) => {
        const msg = (messageText || aiInput).trim();
        if (!msg || isStreaming) return;

        const userMsg = { role: 'user', content: msg };
        const assistantPlaceholder = { role: 'assistant', content: '', followups: [] };

        setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
        setAiInput('');
        setIsStreaming(true);

        const lang = i18n.language || 'en';

        try {
            const response = await apiCall('/chat/', {
                method: 'POST',
                body: JSON.stringify({ message: msg, lang }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.token) {
                                fullResponse += parsed.token;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = {
                                        ...updated[updated.length - 1],
                                        content: fullResponse,
                                    };
                                    return updated;
                                });
                            }
                        } catch { /* skip */ }
                    }
                }
            }

            const { text, followups } = parseFollowups(fullResponse);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: text, followups };
                return updated;
            });
        } catch (error) {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: 'Something went wrong. Please try again.',
                    followups: [],
                };
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    /* ── Voice input ── */
    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
            setAiInput(event.results[0][0].transcript);
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };

    /* ── Clear chat ── */
    const clearChat = async () => {
        try { await apiCall('/chat/clear/', { method: 'POST' }); } catch { /* */ }
        setMessages([]);
    };

    if (!isOpen) return null;

    const hasMessages = messages.length > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-xl"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        className="relative w-full max-w-[640px] rounded-[20px] overflow-hidden
                            bg-notion-bg border border-notion-border/50
                            shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)]
                            dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.6)]
                            flex flex-col"
                        style={{ maxHeight: 'calc(100vh - 16vh)' }}
                    >
                        {/* ─── Search / AI toggle header ─── */}
                        {!aiMode ? (
                            /* Search Mode Header */
                            <div className="flex items-center px-5 py-4 border-b border-notion-border/40">
                                <Search className="text-notion-muted mr-3 shrink-0" size={20} />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search commands, stocks, or ask AI..."
                                    className="flex-1 bg-transparent border-none outline-none text-notion-text
                                        placeholder-notion-muted/60 text-[17px] font-medium tracking-tight"
                                    autoFocus
                                />
                                <span className="text-[10px] uppercase font-mono font-semibold px-2 py-1
                                    bg-notion-hover text-notion-muted rounded-md tracking-wider shrink-0">
                                    ESC
                                </span>
                            </div>
                        ) : (
                            /* AI Mode Header */
                            <div className="relative flex items-center justify-between px-5 py-3.5">
                                <div className="absolute bottom-0 left-5 right-5 h-px bg-notion-border/30" />

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full
                                        bg-gradient-to-br from-notion-emerald/15 to-notion-emerald/5
                                        flex items-center justify-center
                                        border border-notion-emerald/15">
                                        <Logo width={14} height={14} animateDrawing={true} className="text-notion-emerald" />
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-semibold text-notion-text tracking-tight leading-tight">
                                            CRESTA AI
                                        </h3>
                                        <p className="text-[10px] text-notion-muted font-medium tracking-wide">
                                            {isStreaming ? 'Thinking...' : 'Ask anything about your portfolio'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    {hasMessages && (
                                        <button
                                            onClick={clearChat}
                                            className="w-7 h-7 rounded-full flex items-center justify-center
                                                text-notion-muted hover:text-notion-text
                                                hover:bg-notion-hover transition-all duration-200"
                                            title="New conversation"
                                        >
                                            <RotateCcw className="w-[13px] h-[13px]" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setAiMode(false);
                                            setIsOpen(false);
                                        }}
                                        className="w-7 h-7 rounded-full flex items-center justify-center
                                            text-notion-muted hover:text-notion-text
                                            hover:bg-notion-hover transition-all duration-200"
                                        title="Close"
                                    >
                                        <X className="w-[14px] h-[14px]" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── Content Area ─── */}
                        {!aiMode ? (
                            /* Search Results */
                            <div data-lenis-prevent className="max-h-[55vh] overflow-y-auto p-2">
                                {flatItems.length === 0 ? (
                                    <div className="py-12 text-center text-notion-muted font-medium text-sm">
                                        No results found.
                                    </div>
                                ) : (
                                    dynamicCategories.map((cat) => {
                                        const catItems = cat.items.filter(item =>
                                            item.label.toLowerCase().includes(query.toLowerCase())
                                        );
                                        if (catItems.length === 0) return null;

                                        return (
                                            <div key={cat.name} className="mb-3">
                                                <div className="px-4 py-2 text-[11px] font-semibold text-notion-muted
                                                    uppercase tracking-wider">
                                                    {cat.name}
                                                </div>
                                                {catItems.map((item) => {
                                                    const globalIndex = flatItems.indexOf(item);
                                                    const isSelected = selectedIndex === globalIndex;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => handleExecute(item)}
                                                            className={`flex items-center justify-between px-4 py-3 
                                                                rounded-xl cursor-pointer transition-all duration-150
                                                                ${isSelected
                                                                    ? 'bg-notion-text text-notion-bg'
                                                                    : 'text-notion-text hover:bg-notion-hover'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <item.icon size={17}
                                                                    className={isSelected ? 'opacity-70' : 'text-notion-muted'} />
                                                                <span className="font-medium text-[14px] tracking-tight">
                                                                    {item.label}
                                                                </span>
                                                            </div>
                                                            {item.shortcut && (
                                                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono
                                                                    font-semibold tracking-wider
                                                                    ${isSelected
                                                                        ? 'bg-notion-bg/20'
                                                                        : 'bg-notion-hover text-notion-muted'
                                                                    }`}>
                                                                    {item.shortcut}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            /* AI Chat Area */
                            <>
                                <div
                                    ref={messagesContainerRef}
                                    data-lenis-prevent="true"
                                    className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
                                    style={{ maxHeight: 'calc(100vh - 16vh - 140px)', minHeight: '200px' }}
                                >
                                    {/* Empty state */}
                                    {!hasMessages && !isStreaming && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-12 h-12 rounded-full bg-notion-hover
                                                flex items-center justify-center mb-4">
                                                <Logo width={20} height={20} animateDrawing={true} className="text-notion-muted" />
                                            </div>
                                            <p className="text-[14px] text-notion-muted font-medium mb-1">
                                                Ask CRESTA AI anything
                                            </p>
                                            <p className="text-[12px] text-notion-muted/60">
                                                Portfolio, forecasts, market data, risk analysis
                                            </p>

                                            {/* Quick suggestions */}
                                            <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-md">
                                                {['What stocks do I hold?', 'Forecast RELIANCE.NS', 'Market sentiment on INFY'].map((q, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => sendMessage(q)}
                                                        className="text-[12px] px-3.5 py-[7px] rounded-full
                                                            bg-notion-hover/60 text-notion-muted
                                                            border border-notion-border/40
                                                            hover:bg-notion-hover hover:text-notion-text
                                                            hover:border-notion-border
                                                            active:scale-[0.97]
                                                            transition-all duration-200"
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Messages */}
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={i > 0 ? { opacity: 0, y: 6 } : false}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {msg.role === 'user' ? (
                                                <div className="max-w-[80%]">
                                                    <div className="px-4 py-2.5 rounded-[18px] rounded-br-[6px]
                                                        bg-notion-emerald text-white
                                                        text-[14px] leading-[1.5]">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="max-w-[90%] space-y-2">
                                                    <div className="text-[14px] leading-[1.65] text-notion-text/90">
                                                        {msg.content ? (
                                                            <FormattedText text={msg.content} />
                                                        ) : (
                                                            isStreaming && i === messages.length - 1 && (
                                                                <ThinkingDots />
                                                            )
                                                        )}
                                                        {msg.content && i === messages.length - 1 && isStreaming && (
                                                            <span className="inline-block w-[2px] h-[15px] ml-0.5 -mb-[2px]
                                                                bg-notion-emerald animate-pulse rounded-full" />
                                                        )}
                                                    </div>

                                                    {/* Follow-ups */}
                                                    {msg.followups?.length > 0 && !isStreaming && (
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {msg.followups.map((q, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => sendMessage(q)}
                                                                    className="text-[12px] px-3 py-[6px] rounded-full
                                                                        bg-notion-hover/50 text-notion-muted
                                                                        border border-notion-border/40
                                                                        hover:bg-notion-hover hover:text-notion-text
                                                                        hover:border-notion-border
                                                                        active:scale-[0.97]
                                                                        transition-all duration-200"
                                                                >
                                                                    {q}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* ─── AI Input Bar ─── */}
                                <div className="relative px-4 py-3">
                                    <div className="absolute top-0 left-5 right-5 h-px bg-notion-border/30" />

                                    <div className="flex items-end gap-2
                                        bg-notion-hover/40 rounded-2xl
                                        border border-notion-border/30
                                        focus-within:border-notion-emerald/25
                                        transition-all duration-300
                                        px-3 py-2">

                                        <button
                                            onClick={toggleVoice}
                                            className={`shrink-0 w-8 h-8 rounded-full 
                                                flex items-center justify-center transition-all duration-200
                                                ${isListening
                                                    ? 'bg-red-500/10 text-red-400'
                                                    : 'text-notion-muted hover:text-notion-text hover:bg-notion-hover'
                                                }`}
                                            title={isListening ? 'Stop' : 'Voice input'}
                                        >
                                            {isListening
                                                ? <MicOff className="w-[14px] h-[14px]" />
                                                : <Mic className="w-[14px] h-[14px]" />
                                            }
                                        </button>

                                        <input
                                            ref={aiInputRef}
                                            value={aiInput}
                                            onChange={e => setAiInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder={isListening ? 'Listening...' : 'Ask anything...'}
                                            disabled={isStreaming}
                                            className="flex-1 bg-transparent text-[14px] text-notion-text
                                                placeholder:text-notion-muted/50
                                                outline-none py-1 min-w-0
                                                disabled:opacity-50"
                                        />

                                        <motion.button
                                            whileTap={{ scale: 0.88 }}
                                            onClick={() => sendMessage()}
                                            disabled={isStreaming || !aiInput.trim()}
                                            className={`shrink-0 w-8 h-8 rounded-full 
                                                flex items-center justify-center transition-all duration-200
                                                ${aiInput.trim() && !isStreaming
                                                    ? 'bg-notion-emerald text-white'
                                                    : 'text-notion-muted/30 cursor-not-allowed'
                                                }`}
                                        >
                                            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                                        </motion.button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ─── Footer (search mode only) ─── */}
                        {!aiMode && (
                            <div className="px-5 py-3 border-t border-notion-border/30
                                flex items-center justify-between text-[11px] text-notion-muted font-medium">
                                <div className="flex gap-4">
                                    <span className="flex items-center gap-1.5">
                                        <kbd className="font-mono bg-notion-hover px-1.5 py-0.5 rounded text-[10px]">↑</kbd>
                                        <kbd className="font-mono bg-notion-hover px-1.5 py-0.5 rounded text-[10px]">↓</kbd>
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <kbd className="font-mono bg-notion-hover px-1.5 py-0.5 rounded text-[10px]">↵</kbd>
                                        Select
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-60">
                                    <Command size={12} /> Cresta
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Keyframes */}
            <style>{`
                @keyframes dotPulse {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1.1); }
                }
            `}</style>
        </AnimatePresence>
    );
};

export default CommandPalette;
