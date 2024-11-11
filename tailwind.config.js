/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "sans-serif"],
      },fontSize: {
        // 더 큰 텍스트 크기로 조정
        'base': ['1.25rem', { lineHeight: '1.875rem' }],   // 20px
        'lg': ['1.5rem', { lineHeight: '2.125rem' }],      // 24px
        'xl': ['1.75rem', { lineHeight: '2.25rem' }],      // 28px
        '2xl': ['2rem', { lineHeight: '2.5rem' }],         // 32px
        '3xl': ['2.5rem', { lineHeight: '3rem' }],         // 40px
        '4xl': ['3rem', { lineHeight: '3.5rem' }],         // 48px
        '5xl': ['3.75rem', { lineHeight: '4rem' }],        // 60px
        '6xl': ['4.5rem', { lineHeight: '4.5rem' }],       // 72px
      '7xl': ['5.25rem', { lineHeight: '5.25rem' }],     // 84px
        //  맥용
        // 'base': '1.125rem',
        // 'lg': '1.25rem',
        // 'xl': '1.375rem',
        // '2xl': '1.625rem',
        // '4xl': '2.25rem',
        // '6xl': '3.375rem',
      },animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}