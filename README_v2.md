# 股票期貨保證金查詢系統 v2.0 - TypeScript 模組化版本

## 📋 版本說明

此為 v2.0 版本，採用 TypeScript + Vite 架構，完全符合 `.clinerules` 規範：

- ✅ **邏輯分離**：所有計算邏輯獨立於 UI，存放在 `src/logic/` 目錄
- ✅ **型別安全**：使用 TypeScript 定義 10 個核心計算欄位
- ✅ **自動識別**：`identifyContractSize()` 函數自動判別標準/小型期貨
- ✅ **完整測試**：Jest 測試框架覆蓋所有核心邏輯
- ✅ **模組化架構**：易於維護和擴展

## 🏗️ 專案結構

```
LookUpMarginRates/
├── src/
│   ├── logic/                      # 邏輯層（獨立於 UI）
│   │   ├── types.ts                # TypeScript 型別定義（10 個核心欄位）
│   │   ├── contractSize.ts         # 合約規格識別邏輯
│   │   ├── marginCalculator.ts     # 保證金計算公式
│   │   ├── dataLoader.ts           # 資料載入邏輯
│   │   └── utils.ts                # 工具函數
│   ├── ui/                         # UI 層
│   │   ├── app.ts                  # 主應用邏輯
│   │   └── styles.css              # 樣式表
│   └── main.ts                     # 應用程式入口點
├── tests/                          # 測試檔案
│   ├── contractSize.test.ts        # 合約識別測試
│   ├── marginCalculator.test.ts   # 計算公式測試
│   └── dataLoader.test.ts          # 資料載入測試
├── data/
│   └── margin_data.json            # 爬蟲生成的資料（由 Python 腳本生成）
├── scripts/
│   └── fetch_data.py               # Python 爬蟲腳本（保持不變）
├── index.html                      # 主 HTML（模組化版本）
├── index.legacy.html               # 舊版 HTML（備份）
├── package.json                    # 依賴管理
├── tsconfig.json                   # TypeScript 配置
├── vite.config.js                  # Vite 配置
├── jest.config.js                  # Jest 配置
└── README_v2.md                    # 本文件
```

## 🚀 快速開始

### 1. 安裝依賴

首先確保你已安裝 Node.js (v18+)，然後執行：

```bash
npm install
```

### 2. 下載保證金資料

```bash
# 執行 Python 爬蟲腳本
python scripts/fetch_data.py

# 或使用批次檔
run_fetch.bat
```

這會生成 `data/margin_data.json` 檔案。

### 3. 啟動開發伺服器

```bash
npm run dev
```

這會啟動 Vite 開發伺服器，並自動開啟瀏覽器。

### 4. 測試功能

在開發伺服器啟動後，應該能夠：
- ✅ 搜尋期貨（輸入 2330、2383、6274 等）
- ✅ 查看保證金資訊
- ✅ 帶入計算表試算
- ✅ 查看 Console 的詳細日誌

## 📖 開發指令

```bash
# 開發模式（熱重載）
npm run dev

# 執行測試
npm test

# 監聽模式測試
npm run test:watch

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview

# 下載最新保證金資料
npm run fetch-data
```

## 🔧 核心邏輯說明

### 1. 合約規格識別 (`src/logic/contractSize.ts`)

```typescript
export function identifyContractSize(
  contractName: string,
  type: 'stock' | 'etf' = 'stock'
): number {
  if (type === 'etf') return 1000;
  if (!contractName) return 2000;
  return contractName.includes('小型') ? 100 : 2000;
}
```

**規則**：
- 條件 A：包含「小型」→ 100 股
- 條件 B：不包含「小型」→ 2000 股
- 條件 C：ETF 期貨 → 1000 單位

### 2. 保證金計算 (`src/logic/marginCalculator.ts`)

```typescript
export function calculateMargin(
  item: MarginItem,
  price: number,
  lots: number
): CalculationResult {
  // 股票期貨：保證金 = 口數 × 每口股數 × 股價 × 保證金比例
  // ETF 期貨：保證金 = 口數 × 固定保證金金額
  // 結果四捨五入至整數
}
```

### 3. 10 個核心計算欄位 (`src/logic/types.ts`)

```typescript
export interface MarginItem {
  contractCode: string;      // 1. 合約代號
  contractName: string;      // 2. 合約名稱
  stockCode: string;         // 3. 股票代碼
  stockName?: string;        // 4. 股票名稱
  type: 'stock' | 'etf';     // 5. 合約類型
  lotSize: number;           // 6. 每口股數
  clearingRate?: number;     // 7. 結算保證金比例
  maintenanceRate?: number;  // 8. 維持保證金比例
  initialRate?: number;      // 9. 原始保證金比例
  date?: string;             // 10. 資料日期
}
```

## 🧪 測試

執行所有測試：

```bash
npm test
```

測試涵蓋：
- ✅ 合約規格識別（9 個測試案例）
- ✅ 保證金計算公式（股票期貨、小型期貨、ETF 期貨）
- ✅ 資料搜尋與載入
- ✅ 邊界條件處理

## 🎯 驗證需求

根據用戶要求，執行 `npm run dev` 後應該能夠：

1. **搜尋 2330（台積電）**：
   - 應顯示台積電期貨和台積電小型期貨
   - 每口股數分別為 2000 和 100

2. **搜尋 2383（台光電）**：
   - 應顯示相關保證金資訊
   - 自動識別合約規格

3. **搜尋 6274**：
   - 應顯示相關保證金資訊

打開瀏覽器 Console 可以看到詳細的載入日誌。

## 📊 資料流程

```
Python 爬蟲 → data/margin_data.json → Vite Dev Server → App
     ↓                                        ↓
期交所官方 CSV                            TypeScript 邏輯層
                                                ↓
                                           UI 渲染層
```

## 🔐 與舊版本的差異

| 項目 | v1.0（舊版） | v2.0（新版） |
|------|-------------|-------------|
| 架構 | 單一 HTML 檔案 | 模組化 TypeScript |
| 型別檢查 | 無 | 完整 TypeScript |
| 測試 | 無 | Jest 測試框架 |
| 邏輯分離 | UI 和邏輯混合 | 完全分離 |
| 開發體驗 | 手動重載 | 熱重載（HMR） |
| 檔案大小 | 1961 行 | 多個小檔案 |

## 🐛 疑難排解

### Q: npm 指令無法執行？
A: 請確保已安裝 Node.js v18 或更新版本。

### Q: 資料載入失敗？
A: 請先執行 `python scripts/fetch_data.py` 生成資料檔案。

### Q: TypeScript 編譯錯誤？
A: 執行 `npm install` 確保所有依賴已安裝。

### Q: 測試無法執行？
A: 確保已安裝 `@types/jest`，執行 `npm install` 即可。

## 📝 授權與免責聲明

- 本專案採用 MIT License
- 保證金金額以期交所官方公告為準
- 使用者需自行承擔交易風險

---

**版本**: v2.0.0  
**更新日期**: 2026-05-03  
**作者**: Cline AI Assistant
