/**
 * 股價更新邏輯
 * 使用 Google Apps Script (GAS) 作為中繼 API 解決 CORS 問題
 */

import type { PriceUpdateResult, PriceSource } from './types';

/**
 * Google Apps Script Web App URL
 * 用於取得台灣股票即時股價（TWSE 優先，Yahoo Finance 備選）
 */
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbyCRA-hHoWDtb_pHnqI38vpSkQBSddOWKb91g-Hidsr_Bme5kVqIdjwu3pkwy3Vs8osMg/exec';

/**
 * 隨機延遲函數（符合爬蟲禮節）
 */
function randomDelay(min = 500, max = 1500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 從 Google Apps Script 取得股價
 * GAS 會自動從 TWSE 或 Yahoo Finance 爬取最新股價
 */
async function fetchPriceFromGAS(stockCode: string, timeout = 10000): Promise<number | null> {
  try {
    console.log(`[PriceUpdater] 從 GAS 取得股價: ${stockCode}`);
    
    const url = `${GAS_API_URL}?symbol=${encodeURIComponent(stockCode)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // GAS 回傳格式與 TWSE 相同：{ msgArray: [{ z: "成交價", y: "昨收價", ... }] }
    if (data.msgArray && data.msgArray.length > 0) {
      const stock = data.msgArray[0];
      // z: 成交價，若為 "-" 則使用 y: 昨收價
      const price = stock.z !== '-' ? parseFloat(stock.z) : parseFloat(stock.y);
      
      if (price && price > 0) {
        console.log(`[PriceUpdater] ✓ GAS: ${stockCode} = $${price}`);
        return price;
      }
    }
    
    throw new Error('無法從 GAS 取得股價');
  } catch (error) {
    console.warn(`[PriceUpdater] ✗ GAS 失敗 (${stockCode}):`, error);
    return null;
  }
}

/**
 * 更新單一股票價格（帶重試機制）
 */
export async function updateSinglePrice(
  stockCode: string,
  retries = 2
): Promise<PriceUpdateResult> {
  let lastError: string = '';
  
  // 嘗試從 GAS 取得股價（包含重試）
  for (let i = 0; i <= retries; i++) {
    if (i > 0) {
      console.log(`[PriceUpdater] 重試 (第 ${i} 次)...`);
      await randomDelay(1000, 2000);
    }
    
    const price = await fetchPriceFromGAS(stockCode);
    if (price !== null) {
      return {
        stockCode,
        price,
        source: 'twse',
        success: true,
      };
    }
  }
  
  lastError = 'GAS API 爬取失敗';
  
  // 全部失敗
  return {
    stockCode,
    price: null,
    source: 'twse',
    success: false,
    error: lastError,
  };
}

/**
 * 批次更新多個股票價格（逐一處理以確保穩定性）
 */
export async function updateMultiplePrices(
  stockCodes: string[]
): Promise<PriceUpdateResult[]> {
  console.log(`[PriceUpdater] 開始批次更新 ${stockCodes.length} 個股票價格...`);
  console.log(`[PriceUpdater] 使用 Google Apps Script (GAS) API`);
  
  const results: PriceUpdateResult[] = [];
  
  for (let i = 0; i < stockCodes.length; i++) {
    const code = stockCodes[i];
    console.log(`[PriceUpdater] [${i + 1}/${stockCodes.length}] 更新：${code}`);
    
    const result = await updateSinglePrice(code);
    results.push(result);
    
    // 每次請求之間延遲（避免被限流）
    if (i < stockCodes.length - 1) {
      await randomDelay(1000, 2000);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`[PriceUpdater] 批次更新完成: ${successCount}/${stockCodes.length} 成功`);
  
  return results;
}

/**
 * 獲取數據來源的顯示名稱
 */
export function getSourceDisplayName(source: PriceSource): string {
  const names: Record<PriceSource, string> = {
    twse: 'TWSE（證交所）',
    yahoo: 'Yahoo Finance',
    manual: '手動輸入',
  };
  return names[source] || source;
}
