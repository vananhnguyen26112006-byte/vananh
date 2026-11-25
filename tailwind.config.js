/** @type {import('tailwindcss').Config} */
// DESIGN.md: 색은 CSS 변수로만, 둥근 모서리·그림자는 아예 쓸 수 없게 비워 둔다.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: 'var(--bg)',
      'bg-soft': 'var(--bg-soft)',
      'surface-mid': 'var(--surface-mid)',
      ink: 'var(--ink)',
      'ink-muted': 'var(--ink-muted)',
      line: 'var(--line)',
      'on-ink': 'var(--on-ink)',
      correct: 'var(--correct)',
      wrong: 'var(--wrong)',
    },
    borderRadius: { none: '0' },
    boxShadow: { none: 'none' },
    extend: {
      fontFamily: {
        sans: 'var(--font-sans)',
      },
    },
  },
  plugins: [],
}
