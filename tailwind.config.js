/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#07080c',
        surface: {
          950: '#0a0c12',
          900: '#0e111a',
          800: '#141824',
          700: '#1c2233',
          600: '#252d42',
        },
        metallic: {
          light: '#f1f5f9',
          silver: '#cbd5e1',
          chrome: '#94a3b8',
          border: 'rgba(255, 255, 255, 0.08)',
          highlight: 'rgba(255, 255, 255, 0.15)',
        },
        electric: {
          cyan: '#38bdf8',
          blue: '#3b82f6',
          violet: '#8b5cf6',
          purple: '#a855f7',
          glow: 'rgba(56, 189, 248, 0.25)',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
        display: ['Inter', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        widestx: '0.25em',
        cinematic: '0.35em',
      },
      boxShadow: {
        'glow-blue': '0 0 30px -5px rgba(56, 189, 248, 0.25)',
        'glow-violet': '0 0 35px -5px rgba(139, 92, 246, 0.25)',
        'glow-danger': '0 0 30px -5px rgba(239, 68, 68, 0.3)',
        'metallic-card': '0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'glass-panel': '0 20px 40px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 7s ease-in-out infinite',
        'beacon': 'beacon 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        beacon: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
