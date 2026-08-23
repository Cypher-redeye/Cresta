/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'notion-bg': 'var(--notion-bg)',
                'notion-text': 'var(--notion-text)',
                'notion-muted': 'var(--notion-muted)',
                'notion-border': 'var(--notion-border)',
                'notion-hover': 'var(--notion-hover)',
                'notion-card': 'var(--notion-card)',
                'notion-sidebar': 'var(--notion-sidebar)',
                
                'notion-emerald': 'var(--accent-emerald)',
                'notion-emerald-bg': 'var(--accent-emerald-bg)',
                'notion-blue': 'var(--accent-blue)',
                'notion-blue-bg': 'var(--accent-blue-bg)',
                
                'fintech-bg': 'var(--notion-bg)',
                'fintech-card': 'var(--notion-card)',
                'fintech-primary': 'var(--notion-bg)',
                'fintech-emerald': 'var(--accent-emerald)',
                'fintech-blue': 'var(--accent-blue)',
                'neon-emerald': 'var(--accent-emerald)',
                'neon-blue': 'var(--accent-blue)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                space: ['Space Grotesk', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                },
            },
        },
    },
    plugins: [],
}
