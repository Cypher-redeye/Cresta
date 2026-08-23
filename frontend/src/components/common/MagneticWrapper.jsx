import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const MagneticWrapper = ({ children, className = '', strength = 0.5 }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const shouldReduceMotion = useReducedMotion();

    const handleMouse = (e) => {
        if (shouldReduceMotion) return;
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * strength, y: middleY * strength });
    };

    const reset = () => {
        if (shouldReduceMotion) return;
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseEnter = () => {
        // removed audio
    };

    const handleClick = () => {
        // removed audio
    };

    const { x, y } = position;

    if (shouldReduceMotion) {
        return <div className={`inline-block ${className}`} onClick={handleClick}>{children}</div>;
    }

    return (
        <motion.div
            className={`inline-block ${className}`}
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            onMouseEnter={handleMouseEnter}
            onClick={handleClick}
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
        >
            <motion.div
                animate={{ x: x * 0.4, y: y * 0.4 }}
                transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
                className="w-full h-full flex"
            >
                {children}
            </motion.div>
        </motion.div>
    );
};

export default MagneticWrapper;
