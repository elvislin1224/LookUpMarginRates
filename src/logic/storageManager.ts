/**
 * localStorage 管理
 * 統一管理所有的本地儲存操作
 */

import type { CalculationResult } from './types';

const STORAGE_KEYS = {
  EQUITY: 'user_equity',
  CALCULATION_LIST: 'calculation_list',
  LAST_MARGIN_UPDATE: 'last_margin_update',
  LAST_PRICE_UPDATE: 'last_price_update',
};

/**
 * 保存權益總值
 */
export function saveEquity(value: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EQUITY, value.toString());
    console.log(`[Storage] 權益總值已保存: $${value.toLocaleString()}`);
  } catch (error) {
    console.error('[Storage] 保存權益總值失敗:', error);
  }
}

/**
 * 讀取權益總值
 */
export function loadEquity(): number | null {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.EQUITY);
    if (value) {
      const equity = parseFloat(value);
      console.log(`[Storage] 權益總值已讀取: $${equity.toLocaleString()}`);
      return equity;
    }
  } catch (error) {
    console.error('[Storage] 讀取權益總值失敗:', error);
  }
  return null;
}

/**
 * 清除權益總值
 */
export function clearEquity(): void {
  localStorage.removeItem(STORAGE_KEYS.EQUITY);
}

/**
 * 保存計算列表
 */
export function saveCalculationList(list: CalculationResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CALCULATION_LIST, JSON.stringify(list));
    console.log(`[Storage] 計算列表已保存: ${list.length} 項`);
  } catch (error) {
    console.error('[Storage] 保存計算列表失敗:', error);
  }
}

/**
 * 讀取計算列表
 */
export function loadCalculationList(): CalculationResult[] | null {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.CALCULATION_LIST);
    if (value) {
      const list = JSON.parse(value) as CalculationResult[];
      console.log(`[Storage] 計算列表已讀取: ${list.length} 項`);
      return list;
    }
  } catch (error) {
    console.error('[Storage] 讀取計算列表失敗:', error);
  }
  return null;
}

/**
 * 清除計算列表
 */
export function clearCalculationList(): void {
  localStorage.removeItem(STORAGE_KEYS.CALCULATION_LIST);
}

/**
 * 保存上次更新時間
 */
export function saveLastUpdateTime(key: string, timestamp: number = Date.now()): void {
  try {
    localStorage.setItem(key, timestamp.toString());
  } catch (error) {
    console.error('[Storage] 保存更新時間失敗:', error);
  }
}

/**
 * 讀取上次更新時間
 */
export function loadLastUpdateTime(key: string): number | null {
  try {
    const value = localStorage.getItem(key);
    return value ? parseInt(value, 10) : null;
  } catch (error) {
    console.error('[Storage] 讀取更新時間失敗:', error);
    return null;
  }
}

/**
 * 清除所有儲存的資料
 */
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('[Storage] 所有儲存資料已清除');
}

/**
 * 獲取儲存資料的摘要
 */
export function getStorageSummary(): {
  hasEquity: boolean;
  hasCalculationList: boolean;
  calculationCount: number;
} {
  const equity = loadEquity();
  const list = loadCalculationList();
  
  return {
    hasEquity: equity !== null,
    hasCalculationList: list !== null && list.length > 0,
    calculationCount: list?.length || 0,
  };
}

export { STORAGE_KEYS };
