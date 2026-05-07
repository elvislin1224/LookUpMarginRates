import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/LookUpMarginRates/',
  root: '.',
  publicDir: 'data',
  server: {
    port: 3000,
    // 方案 A：禁用自動開啟瀏覽器（避免 Cline 卡住）
    open: false,
    host: true,
    strictPort: false,
    
    // 方案 B：提供詳細的伺服器狀態資訊
    middlewareMode: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  
  // 優化配置
  optimizeDeps: {
    include: [],
  },
  
  // 開發時的日誌級別
  logLevel: 'info',
  
  // PWA 配置
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      
      manifest: {
        name: '股票期貨保證金查詢器',
        short_name: '保證金查詢',
        description: '台灣股票期貨保證金即時查詢系統',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'fullscreen',
        orientation: 'portrait-primary',
        scope: '/LookUpMarginRates/',
        start_url: '/LookUpMarginRates/',
        
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230d1117" width="192" height="192"/><text x="96" y="120" font-size="120" fill="%2358a6ff" text-anchor="middle" font-weight="bold" font-family="Arial">📊</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="%230d1117" width="512" height="512"/><text x="256" y="330" font-size="300" fill="%2358a6ff" text-anchor="middle" font-weight="bold" font-family="Arial">📊</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect fill="%231f6feb" width="180" height="180"/><text x="90" y="120" font-size="100" fill="%23fff" text-anchor="middle" font-weight="bold" font-family="Arial">📊</text></svg>',
            sizes: '180x180',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        
        screenshots: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 720"><rect fill="%230d1117" width="540" height="720"/><text x="270" y="150" font-size="48" fill="%2358a6ff" text-anchor="middle" font-weight="bold">保證金查詢器</text><text x="270" y="400" font-size="32" fill="%238b949e" text-anchor="middle">點擊加入主畫面</text></svg>',
            sizes: '540x720',
            type: 'image/svg+xml',
            form_factor: 'narrow',
          },
        ],
        
        categories: ['finance', 'productivity'],
      },
      
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],
});
