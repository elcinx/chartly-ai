/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f172a', // Slate 900 base
                surface: '#1e293b', // Slate 800 base
                primary: {
                    DEFAULT: '#06b6d4', // Cyan 500
                    hover: '#0891b2',   // Cyan 600
                },
                secondary: {
                    DEFAULT: '#8b5cf6', // Violet 500
                    hover: '#7c3aed',   // Violet 600
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            backgroundImage: {
                'main-gradient': 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', // Deep Indigo to Slate
            }
        },
    },
    plugins: [],
}
