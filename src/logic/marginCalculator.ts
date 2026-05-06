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
    // 注意：保證金比例是百分比形式（例如 30.38 代表 30.38%），需要除以 100
    clearing = baseAmount * (item.clearingRate ?? 0) / 100;
    maintenance = baseAmount * (item.maintenanceRate ?? 0) / 100;
    initial = baseAmount * (item.initialRate ?? 0) / 100;
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

/**
 * 計算風險指標
 * 
 * @param equity - 權益總值
 * @param totalInitialMargin - 原始保證金總計
 * @returns 風險指標資訊
 */
export function calculateRiskMetrics(
  equity: number,
  totalInitialMargin: number
): import('./types').RiskMetrics {
  // 計算風險指標 = 權益總值 / 原始保證金
  const riskRatio = totalInitialMargin > 0 ? equity / totalInitialMargin : 0;
  
  // 計算超額保證金（正數）或追繳金額（負數）
  const excessMargin = equity - totalInitialMargin;
  
  // 判斷風險等級
  let riskLevel: import('./types').RiskLevel;
  if (riskRatio > 1.5) {
    riskLevel = 'safe';      // >150%: 綠色（安全）
  } else if (riskRatio >= 1.2) {
    riskLevel = 'warning';   // 120%-150%: 黃色（警告）
  } else {
    riskLevel = 'danger';    // <120%: 紅色（危險）
  }
  
  return {
    equity,
    totalInitialMargin,
    riskRatio,
    excessMargin,
    riskLevel,
  };
}

/**
 * 根據風險指標值獲取風險等級
 */
export function getRiskLevel(riskRatio: number): import('./types').RiskLevel {
  if (riskRatio > 1.5) {
    return 'safe';
  } else if (riskRatio >= 1.2) {
    return 'warning';
  } else {
    return 'danger';
  }
}

/**
 * 獲取風險等級的顯示文字
 */
export function getRiskLevelText(riskLevel: import('./types').RiskLevel): string {
  const texts: Record<import('./types').RiskLevel, string> = {
    safe: '安全',
    warning: '警告',
    danger: '危險',
  };
  return texts[riskLevel];
}

/**
 * 格式化風險指標百分比
 */
export function formatRiskRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}
