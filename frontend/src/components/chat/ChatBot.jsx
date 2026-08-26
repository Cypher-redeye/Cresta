import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, Mic, MicOff, RotateCcw,
    Sparkles, ChevronDown, ArrowUp
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import { API_BASE, apiCall } from '../../api';

/* ─────────────────────────────────────────────
   Apple-inspired Thinking Indicator
   ───────────────────────────────────────────── */
const ThinkingIndicator = () => (
    <div className="flex items-center gap-3 py-1">
        <div className="flex items-center gap-1">
            <span className="w-[5px] h-[5px] rounded-full bg-notion-muted/60 animate-[dotPulse_1.4s_ease-in-out_0s_infinite]" />
            <span className="w-[5px] h-[5px] rounded-full bg-notion-muted/60 animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite]" />
            <span className="w-[5px] h-[5px] rounded-full bg-notion-muted/60 animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite]" />
        </div>
    </div>
);

/* ─────────────────────────────────────────────
   Markdown-lite renderer for bold, newlines
   ───────────────────────────────────────────── */
const FormattedText = ({ text }) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, i) => {
        // Bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
            <React.Fragment key={i}>
                {i > 0 && <br />}
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={j}>{part}</span>;
                })}
            </React.Fragment>
        );
    });
};

/* ═════════════════════════════════════════════
   ChatBot — Apple Intelligence-inspired design
   ═════════════════════════════════════════════ */
const ChatBot = () => {
    const { user } = useUser();
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! I\'m your CRESTA co-pilot. I can help you with portfolio insights, stock forecasts, and market analysis.',
            followups: ['What stocks do I hold?', 'Forecast RELIANCE.NS', 'Market sentiment on INFY'],
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

    // Auto-scroll to bottom on new messages
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Detect if user has scrolled up
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        setShowScrollBtn(!isNearBottom);
    }, []);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Listen for external open triggers (e.g. from Asset Allocation card)
    useEffect(() => {
        const handleExternalOpen = (e) => {
            setIsOpen(true);
            if (e.detail?.message) {
                setInput(e.detail.message);
            }
        };
        window.addEventListener('open-cresta-chat', handleExternalOpen);
        return () => window.removeEventListener('open-cresta-chat', handleExternalOpen);
    }, []);

    // Parse followups from the response
    const parseFollowups = (text) => {
        try {
            // Match optional ```json or ``` followed by the JSON block
            const jsonMatch = text.match(/(?:```(?:json)?\s*)?(\{[\s]*"followups"[\s]*:[\s]*\[.*)$/is);
            if (jsonMatch) {
                const fullMatch = jsonMatch[0];
                const jsonContent = jsonMatch[1].replace(/```\s*$/, '').trim(); // Remove trailing backticks if any for parsing
                const cleanText = text.replace(fullMatch, '').trim();
                
                try {
                    // Try to parse if it's complete
                    const parsed = JSON.parse(jsonContent);
                    return { text: cleanText, followups: parsed.followups || [] };
                } catch {
                    // If JSON is malformed/truncated, still hide it from the UI
                    return { text: cleanText, followups: [] };
                }
            }
        } catch {
            // regex failed
        }
        return { text, followups: [] };
    };

    // Send message via SSE stream
    const sendMessage = async (messageText) => {
        const msg = (messageText || input).trim();
        if (!msg || isStreaming) return;

        const userMsg = { role: 'user', content: msg, timestamp: new Date() };
        const assistantPlaceholder = { role: 'assistant', content: '', followups: [], timestamp: new Date() };

        setMessages(prev => [...prev, userMsg, assistantPlaceholder]);
        setInput('');
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
                                const { text: cleanText } = parseFollowups(fullResponse);
                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1] = {
                                        ...updated[updated.length - 1],
                                        content: cleanText,
                                    };
                                    return updated;
                                });
                            }
                        } catch {
                            // Skip malformed SSE data
                        }
                    }
                }
            }

            // Parse followups from final response
            const { text, followups } = parseFollowups(fullResponse);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: text,
                    followups,
                    timestamp: new Date(),
                };
                return updated;
            });
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: 'assistant',
                    content: `Something went wrong. Please try again.`,
                    followups: [],
                    timestamp: new Date(),
                };
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    // Voice input using Web Speech API
    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice input is not supported in this browser. Use Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    };

    const clearChat = async () => {
        try {
            await apiCall('/chat/clear/', { method: 'POST' });
        } catch { /* ignore */ }

        setMessages([{
            role: 'assistant',
            content: 'Conversation cleared. How can I help you?',
            followups: ['Show my portfolio', 'Market overview', 'Forecast RELIANCE.NS'],
            timestamp: new Date(),
        }]);
    };

    if (!user) return null;

    return (
        <>
            {/* ─── Floating Action Button ─── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 group"
                        aria-label="Open AI Chat"
                    >
                        {/* Glow ring */}
                        <span className="absolute inset-0 rounded-full bg-notion-emerald/20 blur-xl 
                            group-hover:bg-notion-emerald/30 transition-all duration-500" />

                        <span className="relative w-14 h-14 rounded-full flex items-center justify-center
                            bg-notion-card border border-notion-border
                            shadow-lg shadow-black/5 dark:shadow-black/30
                            backdrop-blur-xl
                            group-hover:border-notion-emerald/40
                            transition-all duration-300">
                            <Sparkles className="w-5 h-5 text-notion-emerald" />
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ─── Chat Panel ─── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.96 }}
                            transition={{ 
                                duration: 0.4, 
                                ease: [0.32, 0.72, 0, 1],
                            }}
                            className="fixed bottom-6 right-6 z-50
                                w-[400px] max-w-[calc(100vw-2rem)] 
                                h-[580px] max-h-[calc(100vh-3rem)]
                                rounded-[20px] overflow-hidden
                                flex flex-col
                                bg-notion-bg
                                border border-notion-border/60
                                shadow-[0_24px_80px_-12px_rgba(0,0,0,0.15)]
                                dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5)]"
                        >
                            {/* ─── Header ─── */}
                            <div className="relative flex items-center justify-between px-5 py-4">
                                {/* Subtle bottom border */}
                                <div className="absolute bottom-0 left-5 right-5 h-px bg-notion-border/50" />

                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-9 h-9 rounded-full 
                                            bg-gradient-to-br from-notion-emerald/20 to-notion-emerald/5
                                            flex items-center justify-center
                                            border border-notion-emerald/20">
                                            <Sparkles className="w-4 h-4 text-notion-emerald" />
                                        </div>
                                        {/* Online dot */}
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 
                                            rounded-full bg-green-500 border-2 border-notion-bg" />
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-semibold text-notion-text tracking-tight">
                                            CRESTA
                                        </h3>
                                        <p className="text-[11px] text-notion-muted font-medium tracking-wide">
                                            {isStreaming ? 'Thinking…' : 'AI Co-pilot'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={clearChat}
                                        className="w-8 h-8 rounded-full flex items-center justify-center
                                            text-notion-muted hover:text-notion-text
                                            hover:bg-notion-hover/80
                                            transition-all duration-200"
                                        title="New conversation"
                                    >
                                        <RotateCcw className="w-[15px] h-[15px]" />
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center
                                            text-notion-muted hover:text-notion-text
                                            hover:bg-notion-hover/80
                                            transition-all duration-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* ─── Messages ─── */}
                            <div
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                                data-lenis-prevent="true"
                                className="flex-1 overflow-y-auto px-5 py-4 space-y-5
                                    scrollbar-thin scrollbar-thumb-notion-border scrollbar-track-transparent"
                            >
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={i > 0 ? { opacity: 0, y: 8 } : false}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'user' ? (
                                            /* ─── User message ─── */
                                            <div className="max-w-[85%]">
                                                <div className="px-4 py-2.5 rounded-[18px] rounded-br-[6px]
                                                    bg-notion-emerald text-white
                                                    text-[14px] leading-[1.5] font-normal">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ) : (
                                            /* ─── Assistant message ─── */
                                            <div className="max-w-[90%] space-y-2.5">
                                                <div className="text-[14px] leading-[1.65] text-notion-text/90 font-normal">
                                                    {msg.content ? (
                                                        <FormattedText text={msg.content} />
                                                    ) : (
                                                        isStreaming && i === messages.length - 1 && (
                                                            <ThinkingIndicator />
                                                        )
                                                    )}
                                                    {/* Streaming cursor */}
                                                    {msg.content && msg.role === 'assistant' && i === messages.length - 1 && isStreaming && (
                                                        <span className="inline-block w-[2px] h-[16px] ml-0.5 -mb-[3px]
                                                            bg-notion-emerald animate-pulse rounded-full" />
                                                    )}
                                                </div>

                                                {/* Follow-up suggestions */}
                                                {msg.followups?.length > 0 && !isStreaming && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {msg.followups.map((q, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => sendMessage(q)}
                                                                className="text-[12px] px-3 py-[6px] rounded-full
                                                                    bg-notion-hover/60 text-notion-muted
                                                                    border border-notion-border/50
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

                            {/* ─── Scroll to bottom ─── */}
                            <AnimatePresence>
                                {showScrollBtn && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={scrollToBottom}
                                        className="absolute bottom-[76px] left-1/2 -translate-x-1/2
                                            w-8 h-8 rounded-full
                                            bg-notion-card/90 backdrop-blur-sm
                                            border border-notion-border/50
                                            shadow-lg shadow-black/5
                                            flex items-center justify-center
                                            hover:bg-notion-hover transition-all duration-200"
                                    >
                                        <ChevronDown className="w-4 h-4 text-notion-muted" />
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            {/* ─── Input Bar ─── */}
                            <div className="relative px-4 py-3">
                                {/* Top border */}
                                <div className="absolute top-0 left-5 right-5 h-px bg-notion-border/50" />

                                <div className="flex items-end gap-2 
                                    bg-notion-hover/50 rounded-2xl 
                                    border border-notion-border/40
                                    focus-within:border-notion-emerald/30
                                    focus-within:bg-notion-hover/70
                                    transition-all duration-300
                                    px-3 py-2">

                                    {/* Voice button */}
                                    <button
                                        onClick={toggleVoice}
                                        className={`flex-shrink-0 w-8 h-8 rounded-full 
                                            flex items-center justify-center
                                            transition-all duration-200
                                            ${isListening
                                                ? 'bg-red-500/10 text-red-500'
                                                : 'text-notion-muted hover:text-notion-text hover:bg-notion-hover'
                                            }`}
                                        title={isListening ? 'Stop listening' : 'Voice input'}
                                    >
                                        {isListening
                                            ? <MicOff className="w-[15px] h-[15px]" />
                                            : <Mic className="w-[15px] h-[15px]" />
                                        }
                                    </button>

                                    {/* Text input */}
                                    <input
                                        ref={inputRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                        placeholder={isListening ? 'Listening…' : 'Ask anything…'}
                                        disabled={isStreaming}
                                        className="flex-1 bg-transparent text-[14px] text-notion-text
                                            placeholder:text-notion-muted/60
                                            outline-none py-1 min-w-0
                                            disabled:opacity-50"
                                    />

                                    {/* Send button */}
                                    <motion.button
                                        whileTap={{ scale: 0.88 }}
                                        onClick={() => sendMessage()}
                                        disabled={isStreaming || !input.trim()}
                                        className={`flex-shrink-0 w-8 h-8 rounded-full 
                                            flex items-center justify-center
                                            transition-all duration-200
                                            ${input.trim() && !isStreaming
                                                ? 'bg-notion-emerald text-white shadow-sm shadow-notion-emerald/20'
                                                : 'text-notion-muted/40 cursor-not-allowed'
                                            }`}
                                    >
                                        <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                                    </motion.button>
                                </div>

                                {/* Powered by label */}
                                <p className="text-center text-[10px] text-notion-muted/40 mt-2 font-medium tracking-wide">
                                    Powered by Gemini
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ─── Keyframe for thinking dots ─── */}
            <style>{`
                @keyframes dotPulse {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1.1); }
                }
            `}</style>
        </>
    );
};

export default ChatBot;
