import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// public/icon.svg → 홈 화면 아이콘 PNG들 생성 (npm run icons)
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#111111' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#111111' } },
  },
  images: ['public/icon.svg'],
})
