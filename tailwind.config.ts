import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/domains/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // CSS 변수 기반 색상 - 자동 다크모드
        'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--bg-secondary) / <alpha-value>)',
        'bg-tertiary': 'rgb(var(--bg-tertiary) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-tertiary) / <alpha-value>)',
        'border-primary': 'rgb(var(--border-primary) / <alpha-value>)',
        'border-secondary': 'rgb(var(--border-secondary) / <alpha-value>)',

        white: "#ffffff",
        black: "#000000",
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
        red: {
          50: "#fef2f2",
          100: "#fee2e2",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          800: "#991b1b",
        },
        yellow: {
          400: "#facc15",
          800: "#854d0e",
        },
        green: {
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          800: "#166534",
        },
        blue: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        slate: {
          50: "#f8fafc",
          800: "#1e293b",
          950: "#020617",
        },
      },
      animation: {
        progress: 'progress 5s linear forwards',
      },
      keyframes: {
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      borderRadius: {
        'dynamic': 'var(--border-radius-desktop)',
        'dynamic-mobile': 'var(--border-radius-mobile)',
      },
    },
  },
  plugins: [
    typography,
    // 다크모드 자동 적용 플러그인 - 커스텀 색상 적용
    function({ addBase }) {
      addBase({
        // 다크모드 자동 색상 매핑 (새 팔레트)
        '.dark': {
          // 배경색 자동 변환
          '.bg-white': { backgroundColor: '#1D1D1D' }, // 컨테이너
          '.bg-gray-50': { backgroundColor: '#262626' }, // 컨테이너 헤더
          '.bg-gray-100': { backgroundColor: '#262626' }, // 컨테이너 헤더
          '.bg-gray-200': { backgroundColor: '#2A2A2A' },

          // 텍스트 색상 자동 변환
          '.text-gray-900': { color: '#F0F0F0' }, // 주 텍스트
          '.text-gray-800': { color: '#E0E0E0' },
          '.text-gray-700': { color: '#D0D0D0' },
          '.text-gray-600': { color: '#B4B4B4' },
          '.text-gray-500': { color: '#8C8C8C' },

          // 테두리 색상 자동 변환
          '.border-gray-200': { borderColor: '#323232' },
          '.border-gray-300': { borderColor: '#3C3C3C' },

          // hover 상태 자동 변환
          '.hover\\:bg-gray-50:hover': { backgroundColor: '#2A2A2A' },
          '.hover\\:bg-gray-100:hover': { backgroundColor: '#2A2A2A' },
          '.hover\\:bg-gray-200:hover': { backgroundColor: '#303030' },
          '.hover\\:text-gray-900:hover': { color: '#F0F0F0' },
        }
      })
    },
  ],
};

export default config;