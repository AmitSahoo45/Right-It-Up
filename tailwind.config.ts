import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'midnight-void': '#0F172A',
        'charcoal-layer': '#1E293B',
        'electric-violet': '#7C3AED',
        'cyber-blue': '#3B82F6',
        'verdict-green': '#10B981',
        'objection-red': '#EF4444',
        'caution-amber': '#F59E0B',
        'starlight-white': '#F8FAFC',
        'steel-grey': '#94A3B8',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Space Mono', 'Roboto Mono', 'monospace'],
        'sans': ['Inter', 'Satoshi', 'DM Sans', 'sans-serif'],
      },
      animation: {
        'gavel-slam': 'gavel-slam 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'scan-line': 'scan-line 2s ease-in-out',
        'typing': 'typing 0.5s steps(20)',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.8s ease-out forwards',
        'fade-in-up': 'fade-in-up 1s ease-out forwards',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        'gavel-slam': {
          '0%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'typing': {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.8)' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          'from': { opacity: '0', transform: 'translateY(40px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.7)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'electric-glow': '0 0 30px rgba(124, 58, 237, 0.6)',
        'verdict-green-glow': '0 0 30px rgba(16, 185, 129, 0.6)',
        'objection-red-glow': '0 0 30px rgba(239, 68, 68, 0.6)',
        'cyber-blue-glow': '0 0 30px rgba(59, 130, 246, 0.6)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;