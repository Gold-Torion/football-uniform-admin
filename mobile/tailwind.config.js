// Tailwind config aligned with NativeWind v4. Palette is the authoritative
// "Arena dos Mantos" brand book Eduardo signed off on (Guide_de_cores_arena.docx):
// forest green background, antique-gold primary, light-gold logo accent, and
// a near-black warm brown for deep surfaces. src/theme/colors.ts mirrors
// these values for callsites that need raw hex (StatusBar, native splash).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Arena dos Mantos brand book ──────────────────────────────────
        arena: {
          // Forest green — primary screen background. Matches the logo plate.
          verde: '#335336',
          // Slightly darker companion used at the bottom of background gradients.
          'verde-dark': '#243B26',
          // Antique gold — primary accent (CTAs, headlines, accent lines).
          dourado: '#D4AF37',
          // Lighter gold — used inside the logo and for hover/highlight states.
          'dourado-claro': '#E1C16E',
          // Near-black warm brown — deep surface / footer fade.
          fundo: '#211B15',
        },
        // Status colours kept generic for cross-screen reuse.
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#22C55E',
        // Light theme surfaces (used inside post-auth content cards).
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F4EFE3',     // warm off-white that pairs with gold
          border: '#E5DCC4',
        },
        ink: {
          1: '#1C1A14',          // primary text on light backgrounds
          2: '#5C5547',          // secondary
          3: '#9C9486',          // muted
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
        black: ['Inter_900Black', 'System'],
      },
    },
  },
  plugins: [],
};
