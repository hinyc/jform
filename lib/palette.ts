/**
 * JForm Color Palette
 * Brand colors based on the logo design
 */

export const palette = {
  // Primary - Cyan/Blue (from logo)
  primary: {
    DEFAULT: '#04a4e2',
    50: '#e6f7fd',
    100: '#b3e7f9',
    200: '#80d7f5',
    300: '#4dc7f1',
    400: '#1ab7ed',
    500: '#04a4e2', // Main brand color
    600: '#0383b5',
    700: '#026288',
    800: '#02415a',
    900: '#01202d',
  },

  // Secondary - Dark Gray (from logo)
  secondary: {
    DEFAULT: '#3b4045',
    50: '#f5f5f6',
    100: '#e6e7e8',
    200: '#c8cacc',
    300: '#aaacb0',
    400: '#8c8f94',
    500: '#3b4045', // Main dark color
    600: '#2f3338',
    700: '#23262a',
    800: '#181a1c',
    900: '#0c0d0e',
  },

  // Success - Green
  success: {
    DEFAULT: '#10b981',
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Error - Red
  error: {
    DEFAULT: '#ef4444',
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Warning - Amber
  warning: {
    DEFAULT: '#f59e0b',
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Info - Light Blue
  info: {
    DEFAULT: '#3b82f6',
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Neutral - Zinc (for backgrounds, borders, text)
  neutral: {
    DEFAULT: '#71717a',
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
} as const;

export type PaletteColor = keyof typeof palette;
export type PaletteShade = keyof typeof palette.primary;
