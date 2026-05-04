import { defineConfig } from 'vite';

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
});
