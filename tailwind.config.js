/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./{api,pages,server,services}/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
