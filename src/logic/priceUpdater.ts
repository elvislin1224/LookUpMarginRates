/**
 * 股價更新邏輯
 * 從 TWSE（優先）或 Yahoo Finance（備選）爬取股價
 * 使用 CORS Proxy 解決跨域問題
 */

import type { PriceUpdateResult, PriceSource } from './types';

/**
 * CORS Proxy 列表（備援機制）
 */
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/',
];

/**
 * 隨機延遲（符合爬蟲禮節）
 */
function randomDelay(min = 500, max = 1500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 使用 CORS Proxy 抓取資料
 */
async function fetchWithProxy(url: string, timeout = 10000): Promise<any> {
  let lastError: Error | null = null;
  
  // 嘗試每個 CORS Proxy
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    
    try {
      console.log(`[PriceUpdater] 嘗試 Proxy ${i + 1}/${CORS_PROXIES.length}: ${proxy.substring(0, 30)}...`);
      
      const proxyUrl = proxy + encodeURIComponent(url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // 處理 allorigins 的包裝格式
      if (data.contents) {
        return JSON.parse(data.contents);
      }
      
      return data;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[PriceUpdater] Proxy ${i + 1} 失敗:`, error);
      
      // 等待後重試下一個 Proxy
      if (i < CORS_PROXIES.length - 1) {
        await randomDelay(500, 1000);
      }
    }
  }
  
  throw lastError || new Error('所有 CORS Proxy 均失敗');
}

/**
 * 從 TWSE API 爬取股價（使用 CORS Proxy）
 * API 文件: https://openapi.twse.com.tw/
 */
async function fetchPriceFromTWSE(stockCode: string): Promise<number | null> {
  try {
    console.log(`[PriceUpdater] 正在從 TWSE 爬取股價: ${stockCode}`);
    
    // TWSE API 端點
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${stockCode}.tw&json=1&delay=0`;
    
    // 使用 CORS Proxy 抓取
    const data = await fetchWithProxy(url);
    
    // 解析回應資料
    if (data.msgArray && data.msgArray.length > 0) {
      const stock = data.msgArray[0];
      const price = parseFloat(stock.z || stock.y); // z: 成交價, y: 昨收價
      
      if (price && price > 0) {
        console.log(`[PriceUpdater] ✓ TWSE: ${stockCode} = $${price}`);
        return price;
      }
    }
    
    throw new Error('無法從 TWSE 取得股價');
  } catch (error) {
    console.warn(`[PriceUpdater] ✗ TWSE 失敗 (${stockCode}):`, error);
    return null;
  }
}

/**
 * 從 Yahoo Finance API 爬取股價（使用 CORS Proxy）
 */
async function fetchPriceFromYahoo(stockCode: string): Promise<number | null> {
  try {
    console.log(`[PriceUpdater] 正在從 Yahoo Finance 爬取股價: ${stockCode}`);
    
    // Yahoo Finance 台股符號格式: 2330.TW
    const symbol = `${stockCode}.TW`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    
    // 使用 CORS Proxy 抓取
    const data = await fetchWithProxy(url);
    
    // 解析回應資料
    if (data.chart?.result && data.chart.result.length > 0) {
      const result = data.chart.result[0];
      const price = result.meta?.regularMarketPrice;
      
      if (price && price > 0) {
        console.log(`[PriceUpdater] ✓ Yahoo: ${stockCode} = $${price}`);
        return price;
      }
    }
    
    throw new Error('無法從 Yahoo Finance 取得股價');
  } catch (error) {
    console.warn(`[PriceUpdater] ✗ Yahoo Finance 失敗 (${stockCode}):`, error);
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
  
  // 嘗試 TWSE（優先）
  for (let i = 0; i <= retries; i++) {
    if (i > 0) {
      console.log(`[PriceUpdater] 重試 TWSE (第 ${i} 次)...`);
      await randomDelay(1000, 2000);
    }
    
    const price = await fetchPriceFromTWSE(stockCode);
    if (price !== null) {
      return {
        stockCode,
        price,
        source: 'twse',
        success: true,
      };
    }
  }
  
  lastError = 'TWSE 爬取失敗';
  console.log(`[PriceUpdater] TWSE 失敗，嘗試 Yahoo Finance...`);
  
  // 嘗試 Yahoo Finance（備選）
  await randomDelay();
  
  for (let i = 0; i <= retries; i++) {
    if (i > 0) {
      console.log(`[PriceUpdater] 重試 Yahoo (第 ${i} 次)...`);
      await randomDelay(1000, 2000);
    }
    
    const price = await fetchPriceFromYahoo(stockCode);
    if (price !== null) {
      return {
        stockCode,
        price,
        source: 'yahoo',
        success: true,
      };
    }
  }
  
  lastError = 'TWSE 和 Yahoo Finance 皆爬取失敗';
  
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
 * 批次更新多個股票價格（並行處理，加快速度）
 */
export async function updateMultiplePrices(
  stockCodes: string[],
  batchSize = 3  // 每批並行處理 3 個股票
): Promise<PriceUpdateResult[]> {
  console.log(`[PriceUpdater] 開始批次更新 ${stockCodes.length} 個股票價格...`);
  console.log(`[PriceUpdater] 使用並行處理（每批 ${batchSize} 個）以加快速度`);
  
  const results: PriceUpdateResult[] = [];
  
  // 將股票代碼分成多個批次
  for (let i = 0; i < stockCodes.length; i += batchSize) {
    const batch = stockCodes.slice(i, i + batchSize);
    console.log(`[PriceUpdater] 處理第 ${Math.floor(i / batchSize) + 1} 批：${batch.join(', ')}`);
    
    // 並行處理當前批次
    const batchPromises = batch.map(code => updateSinglePrice(code));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // 批次之間稍微延遲（避免被封鎖）
    if (i + batchSize < stockCodes.length) {
      await randomDelay(500, 1000);
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
