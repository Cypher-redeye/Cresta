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
                'fintech-bg': '#0d0d0d',
                'fintech-card': '#0d0d0d',
                'fintech-primary': '#0d0d0d',
                // Dark mode accents (Neon)
                
                'neon-emerald': '#34D399',
                'neon-blue': '#3B82F6',
                // Light mode accents (Darker, more readable)
                'fintech-emerald': '#059669',    // cyan-600
                'fintech-emerald': '#059669', // emerald-600
                'fintech-blue': '#2563EB',    // blue-600
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
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
            },
        },
    },
    plugins: [],
}
