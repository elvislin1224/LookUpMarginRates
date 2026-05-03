/**
 * 保證金計算邏輯
 * 符合 .clinerules 第 3、5 條：精確度要求與計算公式規範
 */

import { MarginItem, CalculationResult, SummaryResult } from './types';

/**
 * 計算單個合約的保證金
 * 
 * 公式：
 * - 股票期貨：保證金 = 口數 × 每口股數 × 股價 × 保證金比例
 * - ETF 期貨：保證金 = 口數 × 固定保證金金額
 * 
 * @param item - 保證金資料項目
 * @param price - 股價
 * @param lots - 口數
 * @returns 計算結果
 */
export function calculateMargin(
  item: MarginItem,
  price: number,
  lots: number
): CalculationResult {
  let clearing = 0;
  let maintenance = 0;
  let initial = 0;
  
  if (item.type === 'stock') {
    // 股票期貨：比例制
    const baseAmount = lots * item.lotSize * price;
    clearing = baseAmount * (item.clearingRate ?? 0);
    maintenance = baseAmount * (item.maintenanceRate ?? 0);
    initial = baseAmount * (item.initialRate ?? 0);
  } else if (item.type === 'etf') {
    // ETF 期貨：固定金額制
    clearing = lots * (item.clearingFixed ?? 0);
    maintenance = lots * (item.maintenanceFixed ?? 0);
    initial = lots * (item.initialFixed ?? 0);
  }
  
  // 根據期交所規則進行取整（四捨五入至整數）
  return {
    contractCode: item.contractCode,
    contractName: item.contractName,
    stockCode: item.stockCode,
    lotSize: item.lotSize,
    price,
    lots,
    clearingMargin: Math.round(clearing),
    maintenanceMargin: Math.round(maintenance),
    initialMargin: Math.round(initial),
  };
}

/**
 * 計算多個合約的總保證金
 * 
 * @param results - 計算結果陣列
 * @returns 總計結果
 */
export function calculateSummary(results: CalculationResult[]): SummaryResult {
  const totalClearing = results.reduce((sum, r) => sum + r.clearingMargin, 0);
  const totalMaintenance = results.reduce((sum, r) => sum + r.maintenanceMargin, 0);
  const totalInitial = results.reduce((sum, r) => sum + r.initialMargin, 0);
  
  return {
    totalClearing: Math.round(totalClearing),
    totalMaintenance: Math.round(totalMaintenance),
    totalInitial: Math.round(totalInitial),
    itemCount: results.length,
  };
}

/**
 * 驗證計算參數是否有效
 */
export function validateCalculationParams(
  price: number,
  lots: number
): { valid: boolean; error?: string } {
  if (price <= 0) {
    return { valid: false, error: '股價必須大於 0' };
  }
  
  if (lots <= 0) {
    return { valid: false, error: '口數必須大於 0' };
  }
  
  if (!Number.isFinite(price) || !Number.isFinite(lots)) {
    return { valid: false, error: '參數必須為有效數字' };
  }
  
  return { valid: true };
}

/**
 * 格式化保證金金額（加入千分位逗號）
 */
export function formatMarginAmount(amount: number): string {
  return Math.round(amount).toLocaleString('zh-TW');
}
