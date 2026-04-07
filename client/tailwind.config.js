/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./translations_split/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Pretendard', 'Outfit', 'sans-serif'],
                display: ['Montserrat', 'Pretendard', 'sans-serif'],
                outfit: ['Outfit', 'sans-serif'],
            },
            colors: {
                bee: {
                    yellow: 'var(--beeliber-yellow)', /* Primary Yellow */
                    gold: '#FFD700',
                    blue: '#7ba0c9',
                    black: 'var(--trust-black)',      /* Trust Black */
                    grey: 'var(--dark-gray)',
                    muted: '#71717A',
                    light: 'var(--warm-gray)'
                },
                primary: 'var(--beeliber-yellow)',
            },
            borderRadius: {
                'bee': '40px'
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
                'fade-in': 'fade-in 0.5s ease-out forwards',
                'zoom-in': 'zoom-in 0.3s ease-out forwards',
            },
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'zoom-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                }
            }
        },
    },
    plugins: [],
}
