/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shield: {
          dark: '#0B0F19',
          card: '#111827',
          surface: '#1A2234',
          border: '#243049',
          accent: '#3B82F6',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          textMuted: '#94A3B8',
          textHighlight: '#F8FAFC',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Roboto Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

