/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // ─── Clean Neutral System (Apple-inspired) ───
                background: '#F8F9FA',
                surface: '#FFFFFF',
                'surface-dark': '#1D1D1F',
                'primary-text': '#1D1D1F',
                'secondary-text': '#86868B',

                // ─── Core Accent ───
                accent: {
                    DEFAULT: '#0071E3',
                    hover: '#0077ED',
                    light: '#EBF5FF',
                    50: '#EBF5FF',
                    100: '#D6EBFF',
                    500: '#0071E3',
                    600: '#0064CC',
                    700: '#0058B3',
                },

                // ─── Semantic Colors ───
                success: {
                    DEFAULT: '#34C759',
                    light: '#E8FAE6',
                    50: '#ECFDF5',
                    500: '#34C759',
                    600: '#2AA84A',
                },
                warning: {
                    DEFAULT: '#FF9F0A',
                    light: '#FFF8E6',
                    50: '#FFFBEB',
                    500: '#FF9F0A',
                    600: '#E58A00',
                },
                danger: {
                    DEFAULT: '#FF3B30',
                    light: '#FEE2E2',
                    50: '#FEF2F2',
                    500: '#FF3B30',
                    600: '#DC2626',
                },

                // ─── Humanexa Protocol Colors (preserved for compatibility) ───
                humanexa: {
                    trust: '#0071E3',      // Trust → maps to Accent Blue
                    sincere: '#D4A574',    // Warm Gold
                    verified: '#34C759',   // Verified → maps to Success Green
                    honest: '#FF3B30',     // Maps to Danger Red
                },

                // ─── Gradient Endpoints (preserved for compatibility) ───
                sapphire: {
                    start: '#0071E3',
                    end: '#40A9FF',
                    DEFAULT: '#0071E3',
                },
                emerald: {
                    start: '#059669',
                    end: '#34C759',
                    DEFAULT: '#34C759',
                },
                amber: {
                    start: '#B45309',
                    end: '#FF9F0A',
                    DEFAULT: '#FF9F0A',
                },
                crimson: {
                    start: '#991B1B',
                    end: '#FF3B30',
                    DEFAULT: '#FF3B30',
                },

                // ─── Legacy Support ───
                primary: {
                    50: '#EBF5FF', 100: '#D6EBFF', 200: '#B3D9FF',
                    300: '#80C4FF', 400: '#4DAEFF', 500: '#0071E3',
                    600: '#0064CC', 700: '#0058B3', 800: '#004C99',
                    900: '#003D80', 950: '#002E60',
                },
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
                'serif-text': ['Lora', 'Crimson Text', 'serif'],
                mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
                script: ['Great Vibes', 'Pinyon Script', 'cursive'],
            },
            fontSize: {
                'display': ['56px', { lineHeight: '1.07', letterSpacing: '-0.015em', fontWeight: '700' }],
                'title-1': ['40px', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
                'title-2': ['28px', { lineHeight: '1.14', letterSpacing: '-0.007em', fontWeight: '600' }],
                'title-3': ['22px', { lineHeight: '1.27', letterSpacing: '-0.005em', fontWeight: '600' }],
                'headline': ['17px', { lineHeight: '1.47', letterSpacing: '-0.008em', fontWeight: '600' }],
                'body': ['15px', { lineHeight: '1.47', letterSpacing: '-0.009em', fontWeight: '400' }],
                'callout': ['14px', { lineHeight: '1.43', letterSpacing: '-0.006em', fontWeight: '400' }],
                'subhead': ['13px', { lineHeight: '1.38', letterSpacing: '-0.003em', fontWeight: '400' }],
                'footnote': ['12px', { lineHeight: '1.33', letterSpacing: '0', fontWeight: '400' }],
                'caption-1': ['11px', { lineHeight: '1.27', letterSpacing: '0.006em', fontWeight: '400' }],
            },
            borderRadius: {
                'apple-sm': '8px',
                'apple': '12px',
                'apple-lg': '16px',
                'apple-xl': '20px',
                'apple-2xl': '24px',
            },
            boxShadow: {
                'soft-xs': '0 1px 2px rgba(0, 0, 0, 0.04)',
                'soft-sm': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                'soft-md': '0 4px 12px rgba(0, 0, 0, 0.06)',
                'soft-lg': '0 8px 30px rgba(0, 0, 0, 0.08)',
                'soft-xl': '0 20px 60px rgba(0, 0, 0, 0.1)',
                'soft-2xl': '0 25px 80px rgba(0, 0, 0, 0.12)',
                'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                'card-hover': '0 12px 40px rgba(0, 0, 0, 0.08)',
                'glow': '0 0 20px rgba(0, 113, 227, 0.15)',
                'glow-success': '0 0 20px rgba(52, 199, 89, 0.15)',
                'glow-amber': '0 0 20px rgba(255, 159, 10, 0.15)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'gentle-pulse': 'gentlePulse 2.5s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 2.5s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(16px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                gentlePulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.6' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'gradient-accent': 'linear-gradient(135deg, #0071E3 0%, #40A9FF 100%)',
                'gradient-success': 'linear-gradient(135deg, #059669 0%, #34C759 100%)',
                'gradient-amber': 'linear-gradient(135deg, #B45309 0%, #FF9F0A 100%)',
                'gradient-danger': 'linear-gradient(135deg, #991B1B 0%, #FF3B30 100%)',
                'gradient-dark': 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
                'glass': 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            },
            transitionTimingFunction: {
                'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
            },
        },
    },
    plugins: [],
}
