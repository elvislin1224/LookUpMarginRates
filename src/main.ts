/**
 * 應用程式入口點
 */

import { initApp, initEventListeners, testStockCodes } from './ui/app';
import './ui/styles.css';

// 當 DOM 準備就緒時初始化應用程式
document.addEventListener('DOMContentLoaded', async () => {
  console.log('='.repeat(60));
  console.log('股票期貨保證金查詢系統 v2.0 - TypeScript 模組化版本');
  console.log('='.repeat(60));
  
  // 初始化事件監聽器
  initEventListeners();
  
  // 載入資料並初始化應用程式
  await initApp();
  
  // 測試特定股票代碼（驗證需求）
  testStockCodes(['2330', '2383', '6274']);
  
  console.log('\n✓ 應用程式初始化完成！');
});

// 將測試函數暴露到全域（方便在 Console 中使用）
(window as any).testStockCodes = testStockCodes;
