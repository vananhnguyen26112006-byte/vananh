import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PRD 5단계: 홈 화면 설치 + 오프라인 동작
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 새 버전을 배포하면 다음 실행 때 자동으로 바뀜
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'EngLoop',
        short_name: 'EngLoop',
        description: '모국어 해설로 배우는 영어 어휘·문법',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#111111',
        background_color: '#E9E7E4',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 앱 화면·문제은행(JS 안에 포함)·아이콘·영문 글꼴(Inter)은 설치 시 미리 저장 → 비행기 모드에서도 동작
        globPatterns: ['**/*.{js,css,html,ico,png,svg}', 'assets/inter-*.woff2'],
        globIgnores: ['**/og-image.png'], // 공유 미리보기 전용 이미지는 오프라인 저장이 필요 없음
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // 한·중·일 글꼴은 수백 개 조각이라 미리 받지 않고, 화면에 쓰인 조각만 처음 볼 때 저장해 둔다.
        // (오프라인에서 처음 보는 글자는 기기 기본 글꼴로 표시되며, 글자가 깨지지는 않음)
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/') && url.pathname.endsWith('.woff2'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
