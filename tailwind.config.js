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
                "main": "#111111",      // --black
                "card": "#1a1a1a",      // --dark-gray
                "border-main": "#333333", // --medium-gray
                "border-slate": "#333333", // Alias for compatibility
                "primary": "#d72638",   // --red (Main Brand)
                "primary-hover": "#a51b2a",
                "secondary": "#1ea9b2", // --accent (Cyan/Teal)
                "muted": "#cccccc",     // --light-gray
                "white": "#ffffff",
            },
            fontFamily: {
                "sans": ["Inter", "sans-serif"],
                "display": ["Inter", "sans-serif"],
            }
        },
    },
    plugins: [],
}
