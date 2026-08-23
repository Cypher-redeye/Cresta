import React, { useEffect, useRef } from 'react';
import { usePerformance } from '../../context/PerformanceContext';

const NeuralNetwork = ({ isHovered, isDark }) => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const { isLowPerformance } = usePerformance();

    useEffect(() => {
        if (isLowPerformance) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const parent = canvas.parentElement;

        let width = parent.clientWidth;
        let height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;

        const resize = () => {
            width = parent.clientWidth;
            height = parent.clientHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', resize);

        const nodes = Array.from({ length: 30 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
        }));

        let animationId;
        let currentAlpha = 0;

        const draw = () => {
            // Smoothly interpolate alpha based on hover state
            const targetAlpha = isHovered ? 1 : 0;
            currentAlpha += (targetAlpha - currentAlpha) * 0.1;

            ctx.clearRect(0, 0, width, height);

            if (currentAlpha < 0.01) {
                animationId = requestAnimationFrame(draw);
                return;
            }

            const baseColor = isDark ? '52, 211, 153' : '16, 185, 129'; // emerald-400 : emerald-500

            // Update nodes
            nodes.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                if (node.x <= 0 || node.x >= width) node.vx *= -1;
                if (node.y <= 0 || node.y >= height) node.vy *= -1;
                
                // Keep inside bounds
                node.x = Math.max(0, Math.min(width, node.x));
                node.y = Math.max(0, Math.min(height, node.y));
            });

            // Draw connections
            const connectionDistance = 80;
            const mouseDistance = 140;

            for (let i = 0; i < nodes.length; i++) {
                // Connect to mouse
                const dx = nodes[i].x - mouseRef.current.x;
                const dy = nodes[i].y - mouseRef.current.y;
                const distToMouse = Math.sqrt(dx * dx + dy * dy);

                if (distToMouse < mouseDistance) {
                    const lineAlpha = (1 - distToMouse / mouseDistance) * currentAlpha * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
                    ctx.strokeStyle = `rgba(${baseColor}, ${lineAlpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Connect to other nodes
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx2 = nodes[i].x - nodes[j].x;
                    const dy2 = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                    if (dist < connectionDistance) {
                        const lineAlpha = (1 - dist / connectionDistance) * currentAlpha * 0.3;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(${baseColor}, ${lineAlpha})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                // Draw node
                ctx.beginPath();
                ctx.arc(nodes[i].x, nodes[i].y, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${baseColor}, ${currentAlpha * 0.8})`;
                ctx.fill();
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };
        
        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        parent.addEventListener('mousemove', handleMouseMove);
        parent.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('resize', resize);
            parent.removeEventListener('mousemove', handleMouseMove);
            parent.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationId);
        };
    }, [isHovered, isLowPerformance, isDark]);

    if (isLowPerformance) return null;

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
            style={{ zIndex: 0 }}
        />
    );
};

export default NeuralNetwork;
