/**
 * 應用程式入口點
 */

import { initApp, initEventListeners, testStockCodes, updateMarginData } from './ui/app';
import './ui/styles.css';

// 當 DOM 準備就緒時初始化應用程式
document.addEventListener('DOMContentLoaded', async () => {
  console.log('='.repeat(60));
  console.log('股票期貨保證金查詢系統 v2.0 - TypeScript 模組化版本');
  console.log('='.repeat(60));
  
  // 初始化事件監聽器
  initEventListeners();
  
  // 初始化應用程式（不自動載入資料）
  await initApp();
  
  // 綁定更新按鈕事件
  const updateBtn = document.getElementById('update-data-btn');
  if (updateBtn) {
    updateBtn.addEventListener('click', updateMarginData);
    console.log('[Main] ✓ 更新按鈕事件已綁定');
  }
  
  console.log('\n✓ 應用程式初始化完成！請點擊「更新保證金」按鈕載入資料');
});

// 將函數暴露到全域（方便在 Console 中使用）
(window as any).testStockCodes = testStockCodes;
(window as any).updateMarginData = updateMarginData;
