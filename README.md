# 股票期貨保證金查詢系統 v2.0

台灣期貨交易所股票期貨保證金計算與即時查詢應用程式

## 📋 功能特色

- ✅ **官方資料來源**：從期交所官方 CSV 下載保證金資料
- ✅ **24 小時智能快取**：優先使用本地資料，減少網路請求
- ✅ **自動合約識別**：自動判別標準型（2000股）vs 小型（100股）期貨
- ✅ **即時股價整合**：支援證交所即時股價查詢
- ✅ **10 口試算**：同時計算多個合約的保證金需求
- ✅ **響應式設計**：支援桌面與行動裝置

## 🚀 快速開始

### 方法 1：使用本地 JSON（推薦）

1. **下載保證金資料**（每日執行一次即可）
   ```batch
   # 雙擊執行
   run_fetch.bat
   
   # 或使用命令列
   python scripts/fetch_data.py
   ```

2. **開啟應用程式**
   ```
   雙擊 index.html
   ```
   
   應用程式會自動：
   - 優先讀取 `data/margin_data.json`
   - 檢查資料是否超過 24 小時
   - 若資料有效，直接使用本地快取（秒開）
   - 若資料過期或不存在，自動切換至線上 API

### 方法 2：使用線上 API（備援）

如果未執行 Python 腳本，系統會自動使用線上 API（需等待 5-15 秒）：
- 直接開啟 `index.html`
- 系統會透過 CORS Proxy 抓取線上資料
- 載入成功後可正常使用

## 📂 專案結構

```
LookUpMarginRates/
├── index.html              # 主應用程式（單一檔案）
├── run_fetch.bat           # Windows 批次執行腳本
├── scripts/
│   └── fetch_data.py       # Python 資料下載腳本
├── data/
│   └── margin_data.json    # 本地保證金資料（自動生成）
├── CHANGELOG.md            # 更新日誌
├── VERIFICATION_REPORT.md  # 驗證報告
└── README.md               # 本文件
```

## 🛠️ 系統需求

### 必要條件
- 現代瀏覽器（Chrome、Firefox、Edge、Safari）

### 可選條件（用於資料下載）
- Python 3.6 或更新版本
- 網路連線（存取期交所官網）

## 📖 詳細使用說明

### 一、資料下載（Python 腳本）

#### Windows 使用者
```batch
# 方法 1：雙擊執行
run_fetch.bat

# 方法 2：使用 CMD
cd D:\App\LookUpMarginRates
python scripts\fetch_data.py
```

#### macOS / Linux 使用者
```bash
# 確保腳本有執行權限
chmod +x scripts/fetch_data.py

# 執行腳本
python3 scripts/fetch_data.py
```

#### 執行結果
```
============================================
開始下載期交所資料
============================================

[步驟 1/4] 下載股票期貨清單...
[API] StockFuturesList.csv: 下載 CSV...
✓ 下載成功：12345 字元

[步驟 2/4] 下載股票期貨保證金...
[API] StockFuturesMargin.csv: 下載 CSV...
✓ 下載成功：23456 字元

[步驟 3/4] 下載 ETF 期貨保證金...
[API] ETFFuturesMargin.csv: 下載 CSV...
✓ 下載成功：3456 字元

[步驟 4/4] 解析 CSV 資料...
✓ 股票期貨清單：279 筆
✓ 股票期貨保證金：150 筆
✓ ETF 期貨保證金：12 筆

✓ 資料處理完成：共 279 筆期貨資料
✓ 資料日期：20260501

============================================
儲存資料
============================================
✓ JSON 已儲存：D:\App\LookUpMarginRates\data\margin_data.json
✓ 檔案大小：123,456 bytes

============================================
✓ 執行完成！耗時：8.23 秒
============================================
```

### 二、使用應用程式

1. **開啟應用程式**
   - 雙擊 `index.html`
   - 或在瀏覽器中開啟該檔案

2. **搜尋期貨**
   - 輸入股票代碼（如：2330）
   - 輸入股票名稱（如：台積電）
   - 即時顯示搜尋結果

3. **查看保證金資訊**
   - 點選搜尋結果
   - 查看結算、維持、原始保證金比例
   - 確認每口股數（100 或 2000）

4. **試算保證金**
   - 點選「帶入計算」按鈕
   - 系統自動抓取即時股價
   - 輸入欲交易口數
   - 自動計算所需保證金

5. **多口試算**
   - 最多可同時試算 10 個合約
   - 自動加總所有保證金需求
   - 支援手動修改股價

## 🔧 進階功能

### 快取機制

系統會記錄 `last_updated` 時間戳記：
```json
{
  "last_updated": "2026-05-01T16:20:00.123456",
  "data_date": "20260501",
  "total_count": 279,
  "futures": [...]
}
```

- **24 小時內**：使用本地快取（秒開）
- **超過 24 小時**：自動切換線上 API
- **手動更新**：執行 `run_fetch.bat`

### 合約規格自動識別

系統依據 `contractName` 自動判斷：

| 合約名稱包含 | 每口股數 | 類型 |
|-------------|---------|------|
| 「小型」    | 100 股  | 小型期貨 |
| 無「小型」  | 2000 股 | 標準期貨 |
| ETF         | 1000 單位 | ETF 期貨 |

### 保證金計算公式

**股票期貨**：
```
保證金 = 口數 × 每口股數 × 股價 × 保證金比例
```

**ETF 期貨**：
```
保證金 = 口數 × 固定保證金金額
```

## ⚙️ 設定選項

### 修改快取有效期

編輯 `index.html`，搜尋 `isDataFresh`：

```javascript
function isDataFresh(lastUpdated, maxAgeHours = 24) {
  // 修改 maxAgeHours 值（預設 24 小時）
}
```

### 修改 CSV 來源

編輯 `scripts/fetch_data.py`，修改 `CSV_URLS`：

```python
CSV_URLS = {
    "stock_futures_list": "https://...",
    "stock_margin": "https://...",
    "etf_margin": "https://...",
}
```

## 🐛 疑難排解

### Q1: Python 腳本執行失敗？

**檢查 Python 版本**：
```bash
python --version
# 或
py --version
```

需要 Python 3.6+，若未安裝：
- Windows: https://www.python.org/downloads/
- macOS: `brew install python3`
- Linux: `sudo apt install python3`

### Q2: 下載 CSV 失敗？

**可能原因**：
1. 網路連線問題
2. 期交所網站維護中
3. 防火牆阻擋

**解決方法**：
- 稍後再試
- 檢查防火牆設定
- 使用線上 API 模式（開啟 index.html 即可）

### Q3: 本地 JSON 無法讀取？

**檢查項目**：
1. `data/margin_data.json` 是否存在？
2. 檔案權限是否正確？
3. JSON 格式是否有效？

**修復方法**：
```bash
# 重新執行腳本
python scripts/fetch_data.py
```

### Q4: 網頁載入緩慢？

**原因**：本地 JSON 不存在，正在使用線上 API

**解決方法**：
```bash
# 執行腳本建立本地資料
run_fetch.bat
```

## 📅 建議使用流程

### 日常使用
```
早上開盤前執行 → run_fetch.bat → 一整天快速使用
```

### 週期性更新
- **每日**：執行一次 `run_fetch.bat`（建議開盤前）
- **臨時需要**：若資料過期，系統自動切換線上模式

## 🔐 資料安全性

- ✅ 所有資料來自期交所官方網站
- ✅ 無第三方追蹤程式碼
- ✅ 本地執行，資料不上傳
- ✅ 開源透明，可自行檢視程式碼

## 📝 授權與免責聲明

### 授權
本專案採用 MIT License，可自由使用、修改、分發。

### 免責聲明
- 本系統僅供參考，不構成投資建議
- 保證金金額以期交所官方公告為準
- 使用者需自行承擔交易風險
- 作者不對任何投資損失負責

## 📞 技術支援

### 查看詳細日誌
按 `F12` 開啟瀏覽器開發者工具 → Console 標籤

### 常見錯誤訊息

| 訊息 | 原因 | 解決方法 |
|------|------|----------|
| `本地檔案不存在` | 未執行 Python 腳本 | 執行 `run_fetch.bat` |
| `資料已過期` | 超過 24 小時 | 重新執行 Python 腳本 |
| `所有 CORS Proxy 均失敗` | 網路問題 | 稍後再試或使用本地 JSON |

## 🎯 開發roadmap

- [x] 官方 CSV 資料來源
- [x] 24 小時智能快取
- [x] 自動合約規格識別
- [ ] 定時自動更新（Windows 排程）
- [ ] 多語言支援（English）
- [ ] PWA 離線支援
- [ ] 匯出試算結果（PDF/Excel）

## 📚 參考資源

- [期交所開放資料專區](https://www.taifex.com.tw/cht/3/futuresDataDown)
- [期貨保證金標準](https://www.taifex.com.tw/cht/2/stockMargining)
- [證交所行情資訊](https://mis.twse.com.tw/)

## 👨‍💻 作者

**Cline AI Assistant**  
開發日期：2026-05-01  
版本：v2.0.0

---

**⚡ 快速啟動指令**

```bash
# Step 1: 下載資料（每日一次）
run_fetch.bat

# Step 2: 開啟應用程式
start index.html

# 完成！開始使用
```
