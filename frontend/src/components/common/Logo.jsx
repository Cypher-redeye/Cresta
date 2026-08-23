import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable Cresta brand logo component.
 * Renders the clean double-triangle mountain crest icon.
 */
const Logo = ({ width = 28, height = 28, className = '', animateDrawing = false }) => {
  const PathComponent = animateDrawing ? motion.path : 'path';
  
  const outerProps = animateDrawing ? {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: [0, 1, 0], opacity: [0.5, 1, 0.5] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  } : {};

  const innerProps = animateDrawing ? {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: [0, 1, 0], opacity: [0.5, 1, 0.5] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
  } : {};

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <PathComponent 
        d="M50 15L85 75H15Z" 
        stroke="var(--accent-emerald, #10b981)" 
        strokeWidth="8" 
        strokeLinejoin="round" 
        {...outerProps}
      />
      <PathComponent 
        d="M50 45L68 75H32Z" 
        stroke="var(--accent-emerald, #10b981)" 
        strokeWidth="6" 
        strokeLinejoin="round" 
        {...innerProps}
      />
    </svg>
  );
};

export default Logo;
