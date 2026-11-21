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
  // React Native needs a font file per weight, so each weight class picks its Geist file
  // instead of setting fontWeight (which would double up with the file's own weight).
  corePlugins: { fontWeight: false },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.font-normal': { fontFamily: 'Geist-Regular' },
        '.font-medium': { fontFamily: 'Geist-Medium' },
        '.font-semibold': { fontFamily: 'Geist-SemiBold' },
        '.font-bold': { fontFamily: 'Geist-Bold' },
        '.font-extrabold': { fontFamily: 'Geist-ExtraBold' },
      });
    }),
  ],
};
