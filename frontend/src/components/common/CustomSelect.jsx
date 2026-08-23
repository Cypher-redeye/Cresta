import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const CustomSelect = ({ value, onChange, options, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
        <div ref={containerRef} className={`relative select-none ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-notion-hover border-[0.5px] border-notion-border rounded-lg px-4 py-2.5 text-xs text-notion-text hover:bg-notion-border transition-colors duration-200 flex items-center justify-between cursor-pointer focus:outline-none"
            >
                <span className="truncate pr-2">{selectedOption?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-notion-muted transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute z-50 left-0 right-0 mt-1.5 apple-glass rounded-lg py-1 overflow-hidden shadow-lg"
                    >
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-xs transition-colors duration-150 flex items-center justify-between ${
                                    opt.value === value
                                        ? 'bg-notion-hover font-semibold text-notion-emerald'
                                        : 'text-notion-text hover:bg-notion-hover'
                                }`}
                            >
                                <span className="truncate pr-2">{opt.label}</span>
                                {opt.value === value && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-notion-emerald shrink-0"></span>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomSelect;
