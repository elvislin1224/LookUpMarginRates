/**
 * 資料載入邏輯
 * 符合 .clinerules 第 2 條：爬蟲規範與資料載入
 */

import { MarginItem, MarginDataResponse, SearchResult } from './types';
import { identifyContractSize } from './contractSize';

/**
 * 載入本地 JSON 資料
 * 優先使用爬蟲生成的 data/margin_data.json
 */
export async function loadLocalData(): Promise<MarginDataResponse | null> {
  try {
    console.log('[DataLoader] 嘗試載入本地資料: /LookUpMarginRates/margin_data.json');
    const response = await fetch('/LookUpMarginRates/margin_data.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: MarginDataResponse = await response.json();
    
    // 驗證資料結構
    if (!data.futures || !Array.isArray(data.futures)) {
      throw new Error('資料格式錯誤：缺少 futures 陣列');
    }
    
    console.log(`[DataLoader] ✓ 本地資料載入成功：${data.total_count} 筆`);
    console.log(`[DataLoader] 資料日期：${data.data_date}`);
    console.log(`[DataLoader] 最後更新：${data.last_updated}`);
    
    return data;
  } catch (error) {
    console.error('[DataLoader] ✗ 本地資料載入失敗:', error);
    return null;
  }
}

/**
 * 檢查資料是否新鮮（24 小時內）
 */
export function isDataFresh(lastUpdated: string, maxAgeHours = 24): boolean {
  try {
    const lastTime = new Date(lastUpdated).getTime();
    const now = new Date().getTime();
    const ageHours = (now - lastTime) / (1000 * 60 * 60);
    
    const isFresh = ageHours < maxAgeHours;
    console.log(`[DataLoader] 資料新鮮度檢查：${ageHours.toFixed(1)} 小時 (${isFresh ? '有效' : '已過期'})`);
    
    return isFresh;
  } catch (error) {
    console.error('[DataLoader] 資料新鮮度檢查失敗:', error);
    return false;
  }
}

/**
 * 處理並標準化保證金資料
 * 確保 lotSize 欄位正確
 */
export function normalizeMarginData(items: MarginItem[]): MarginItem[] {
  return items.map(item => {
    // 如果 lotSize 不存在或為 0，使用自動識別
    if (!item.lotSize || item.lotSize === 0) {
      item.lotSize = identifyContractSize(item.contractName, item.type);
    }
    
    return item;
  });
}

/**
 * 搜尋期貨資料
 * 支援股票代碼、合約名稱、股票名稱模糊搜尋
 */
export function searchFutures(
  data: MarginItem[],
  query: string,
  limit = 50
): SearchResult[] {
  if (!query || query.trim() === '') {
    return [];
  }
  
  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];
  
  for (const item of data) {
    let relevance = 0;
    
    // 股票代碼完全匹配：最高優先級
    if (item.stockCode.toLowerCase() === q) {
      relevance = 100;
    }
    // 股票代碼開頭匹配
    else if (item.stockCode.toLowerCase().startsWith(q)) {
      relevance = 80;
    }
    // 股票代碼包含
    else if (item.stockCode.toLowerCase().includes(q)) {
      relevance = 60;
    }
    // 合約名稱包含
    else if (item.contractName.toLowerCase().includes(q)) {
      relevance = 40;
    }
    // 股票名稱包含
    else if (item.stockName?.toLowerCase().includes(q)) {
      relevance = 30;
    }
    
    if (relevance > 0) {
      results.push({ item, relevance });
    }
  }
  
  // 按相關性排序，取前 N 筆
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

/**
 * 根據股票代碼精確查找
 */
export function findByStockCode(
  data: MarginItem[],
  stockCode: string
): MarginItem | undefined {
  return data.find(item => item.stockCode === stockCode);
}

/**
 * 獲取所有有保證金資料的期貨
 */
export function getAvailableFutures(data: MarginItem[]): MarginItem[] {
  return data.filter(item => 
    item._hasMargin !== false && 
    (item.type === 'stock' ? 
      (item.clearingRate ?? 0) > 0 : 
      (item.clearingFixed ?? 0) > 0
    )
  );
}

/**
 * 隨機延遲函數（符合爬蟲禮節）
 */
export function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}
