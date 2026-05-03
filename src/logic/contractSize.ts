/**
 * 合約規格識別邏輯
 * 符合 .clinerules 第 6 條：自動化識別邏輯 (Contract Size Auto-Detection)
 */

/**
 * 根據合約名稱自動識別合約規格股數
 * 
 * 規則：
 * - 條件 A：若商品名稱包含「小型」二字，則 contract_size 自動設為 100
 * - 條件 B：若商品名稱中未出現「小型」，則預設 contract_size 為 2000
 * - 條件 C：ETF 期貨預設為 1000
 * 
 * @param contractName - 合約名稱
 * @param type - 合約類型 ('stock' | 'etf')
 * @returns 每口股數 (100 | 2000 | 1000)
 */
export function identifyContractSize(
  contractName: string | undefined | null,
  type: 'stock' | 'etf' = 'stock'
): number {
  // ETF 期貨特殊處理
  if (type === 'etf') {
    return 1000;
  }
  
  // 空值檢查
  if (!contractName) {
    return 2000;
  }
  
  // 條件 A：包含「小型」→ 100 股
  if (contractName.includes('小型')) {
    return 100;
  }
  
  // 條件 B：不包含「小型」→ 2000 股（預設）
  return 2000;
}

/**
 * 判斷是否為小型期貨
 */
export function isSmallContract(contractName: string | undefined | null): boolean {
  return contractName?.includes('小型') ?? false;
}

/**
 * 測試案例（供測試框架使用）
 */
export const contractSizeTests = [
  { input: '台積電小型期貨', type: 'stock' as const, expected: 100 },
  { input: '台積電期貨', type: 'stock' as const, expected: 2000 },
  { input: '小型聯發科期貨', type: 'stock' as const, expected: 100 },
  { input: '鴻海期貨', type: 'stock' as const, expected: 2000 },
  { input: '', type: 'stock' as const, expected: 2000 },
  { input: null, type: 'stock' as const, expected: 2000 },
  { input: undefined, type: 'stock' as const, expected: 2000 },
  { input: '元大台灣50 ETF期貨', type: 'etf' as const, expected: 1000 },
  { input: '富邦台50 ETF期貨', type: 'etf' as const, expected: 1000 },
];
