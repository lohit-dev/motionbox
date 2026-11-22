const plugin = require('tailwindcss/plugin');

const colors = require('./constants/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: colors.ink,
        s1: colors.s1,
        s2: colors.s2,
        s3: colors.s3,
        t2: colors.t2,
        t3: colors.t3,
        live: colors.live,
        danger: colors.danger,
      },
      spacing: {
        gutter: '20px',
      },
      borderRadius: {
        card: '18px',
        poster: '14px',
      },
      fontSize: {
        eyebrow: ['11px', { letterSpacing: '1.1px' }],
        title: ['30px', { lineHeight: '32px', letterSpacing: '-1px' }],
        section: ['22px', { lineHeight: '26px', letterSpacing: '-0.6px' }],
      },
    },
  },
  // React Native needs a font file per weight, so each weight class picks its Inter file
  // instead of setting fontWeight (which would double up with the file's own weight).
  corePlugins: { fontWeight: false },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.font-normal': { fontFamily: 'Inter24pt-Regular' },
        '.font-medium': { fontFamily: 'Inter24pt-Medium' },
        '.font-semibold': { fontFamily: 'Inter24pt-SemiBold' },
        '.font-bold': { fontFamily: 'Inter24pt-Bold' },
        '.font-extrabold': { fontFamily: 'Inter24pt-ExtraBold' },
      });
    }),
  ],
};
