import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const TextReveal = ({ text, className = "", delay = 0, once = true }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: "-10%" });

    // Split text into words, keeping track of spaces as distinct items or handling them implicitly
    const words = text.split(" ");

    return (
        <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
            {words.map((word, i) => (
                <span key={i} className="inline-flex overflow-hidden pb-1 -mb-1 mr-[0.25em]">
                    <motion.span
                        initial={{ y: "100%", opacity: 0, rotate: 5 }}
                        animate={isInView ? { y: 0, opacity: 1, rotate: 0 } : { y: "100%", opacity: 0, rotate: 5 }}
                        transition={{
                            type: "spring",
                            damping: 12,
                            stiffness: 100,
                            delay: delay + i * 0.04
                        }}
                        className="inline-block origin-bottom-left"
                    >
                        {word}
                    </motion.span>
                </span>
            ))}
        </span>
    );
};

export default TextReveal;
