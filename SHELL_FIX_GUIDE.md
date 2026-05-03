# Shell Integration 問題修復指南

## 🔍 問題診斷結果

**診斷日期**: 2026-05-03  
**問題**: Shell Integration Unavailable (VS Code 終端無法正常執行 npm 命令)

---

## ✅ 已確認的系統狀態

### 已安裝的工具
- ✅ **Node.js**: v25.9.0 (已安裝在 `C:\Program Files\nodejs`)
- ✅ **npm**: v11.12.1
- ✅ **Python**: 已安裝且可用
- ✅ **Git**: v2.54.0.windows.1

### 問題根源
- ❌ **Node.js 不在系統 PATH 中** (PowerShell 無法直接找到 `node` 和 `npm`)
- ❌ **PowerShell Execution Policy 限制** (阻止執行 npm.ps1 腳本)

---

## 🛠️ 解決方案

### 方案 1：臨時修復（當前終端有效）

在每次開啟 PowerShell 時執行：

```powershell
$env:PATH += ";C:\Program Files\nodejs"
```

然後使用完整路徑呼叫 npm：

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
& "C:\Program Files\nodejs\npm.cmd" test
```

### 方案 2：永久修復 PATH（推薦）

**步驟 1**: 開啟系統環境變數設定
1. 按 `Win + X` → 選擇「系統」
2. 點選「進階系統設定」
3. 點選「環境變數」
4. 在「系統變數」中找到 `Path`
5. 點選「編輯」→「新增」
6. 加入：`C:\Program Files\nodejs`
7. 確定並關閉所有視窗

**步驟 2**: 重啟 VS Code

完成後，您可以直接使用：
```powershell
node --version
npm --version
npm install
npm run dev
```

### 方案 3：使用 CMD 而非 PowerShell

在 VS Code 中切換預設終端：

1. 按 `Ctrl + Shift + P`
2. 輸入 "Terminal: Select Default Profile"
3. 選擇 "Command Prompt"
4. 開啟新終端

在 CMD 中，npm 命令可以直接使用：
```cmd
cd D:\App\LookUpMarginRates
npm install
npm run dev
npm test
```

---

## 📊 專案狀態

### 已完成
- ✅ 診斷 Shell 整合問題
- ✅ 識別 Node.js 安裝位置
- ✅ 成功安裝專案依賴 (`node_modules` 已創建)
- ✅ 驗證所有工具可用性

### 可用的開發命令

使用完整路徑（臨時方案）：
```powershell
# 開發伺服器
& "C:\Program Files\nodejs\npm.cmd" run dev

# 執行測試
& "C:\Program Files\nodejs\npm.cmd" test

# 建置專案
& "C:\Program Files\nodejs\npm.cmd" run build

# 下載資料
python scripts\fetch_data.py
```

修復 PATH 後：
```powershell
npm run dev
npm test
npm run build
python scripts\fetch_data.py
```

---

## 🎯 快速啟動指南

### 選項 A：使用完整路徑（立即可用）

```powershell
# 1. 下載保證金資料
python scripts\fetch_data.py

# 2. 啟動開發伺服器
& "C:\Program Files\nodejs\npm.cmd" run dev

# 3. 開啟瀏覽器訪問 http://localhost:3000
```

### 選項 B：修復 PATH 後（推薦）

```powershell
# 1. 下載保證金資料
python scripts\fetch_data.py

# 2. 啟動開發伺服器
npm run dev

# 3. 開啟瀏覽器訪問 http://localhost:3000
```

---

## 🐛 常見問題

### Q: 為什麼 npm 無法執行？
A: PowerShell Execution Policy 阻止了 `npm.ps1` 執行。使用 `npm.cmd` 而非 `npm` 可以繞過此限制。

### Q: 每次都要輸入完整路徑嗎？
A: 不需要。修復系統 PATH 後，可以直接使用 `npm` 命令。

### Q: 如何驗證 PATH 是否修復？
A: 重啟 VS Code 後，在新終端執行 `node --version`，如果顯示版本號即表示成功。

### Q: 還有其他方法嗎？
A: 可以切換到 CMD 終端，它不受 PowerShell Execution Policy 限制。

---

## 📝 建議

**立即行動**：
1. ✅ 專案依賴已安裝，可以開始開發
2. 🔧 建議修復系統 PATH（永久解決方案）
3. 🚀 執行 `npm run dev` 啟動專案

**長期規劃**：
- 配置 VS Code 預設終端為 CMD（避免 PowerShell 限制）
- 或設定 PowerShell Execution Policy（需管理員權限）

---

**文件版本**: 1.0  
**最後更新**: 2026-05-03  
**作者**: Cline AI Assistant
