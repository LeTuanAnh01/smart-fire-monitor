/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
  corePlugins: {
    // Tắt preflight để không conflict với Ant Design
    preflight: false,
  },
}