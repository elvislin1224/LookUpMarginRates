/**
 * 台灣股票期貨保證金計算系統 - 型別定義
 * 符合 .clinerules 規範：定義 10 個核心計算欄位
 */

/**
 * 保證金資料項目（10 個核心欄位）
 */
export interface MarginItem {
  // 1. 合約代號
  contractCode: string;
  
  // 2. 合約名稱
  contractName: string;
  
  // 3. 股票代碼
  stockCode: string;
  
  // 4. 股票名稱（可選）
  stockName?: string;
  
  // 5. 合約類型
  type: 'stock' | 'etf';
  
  // 6. 每口股數（100/2000/1000）
  lotSize: number;
  
  // 7. 結算保證金（比例或固定金額）
  clearingRate?: number;        // 股票期貨：比例
  clearingFixed?: number;       // ETF 期貨：固定金額
  
  // 8. 維持保證金（比例或固定金額）
  maintenanceRate?: number;     // 股票期貨：比例
  maintenanceFixed?: number;    // ETF 期貨：固定金額
  
  // 9. 原始保證金（比例或固定金額）
  initialRate?: number;         // 股票期貨：比例
  initialFixed?: number;        // ETF 期貨：固定金額
  
  // 10. 資料日期
  date?: string;
  
  // 其他輔助欄位
  contract?: string;
  underlying?: string;
  securityType?: string;
  groupLevel?: string;
  _hasMargin?: boolean;
}

/**
 * 計算結果（包含 10 個核心計算欄位）
 */
export interface CalculationResult {
  // 基本資訊
  contractCode: string;
  contractName: string;
  stockCode: string;
  
  // 計算參數
  lotSize: number;              // 每口股數
  price: number;                // 股價
  lots: number;                 // 口數
  
  // 計算結果（3 種保證金）
  clearingMargin: number;       // 結算保證金金額
  maintenanceMargin: number;    // 維持保證金金額
  initialMargin: number;        // 原始保證金金額
}

/**
 * 總計結果
 */
export interface SummaryResult {
  totalClearing: number;        // 總結算保證金
  totalMaintenance: number;     // 總維持保證金
  totalInitial: number;         // 總原始保證金
  itemCount: number;            // 合約數量
}

/**
 * API 回應資料結構
 */
export interface MarginDataResponse {
  last_updated: string;         // 最後更新時間
  data_date: string;            // 資料日期
  total_count: number;          // 總筆數
  futures: MarginItem[];        // 期貨清單
}

/**
 * 搜尋結果
 */
export interface SearchResult {
  item: MarginItem;
  relevance: number;            // 相關性分數
}
