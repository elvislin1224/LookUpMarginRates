# GitHub Actions 自動更新保證金資料 - 使用指南

**版本**: v3.0.0  
**更新日期**: 2026-05-04  
**狀態**: ✅ **已完成設定**

---

## 🎯 功能說明

本專案已配置 GitHub Actions 自動化工作流，實現：
- ✅ 每天自動執行 Python 爬蟲更新保證金資料
- ✅ 自動推送更新到 GitHub 倉庫
- ✅ 自動部署到 GitHub Pages
- ✅ 無需手動操作，完全自動化

---

## 📋 已建立的檔案

### **1. 保證金資料自動更新工作流**
```
.github/workflows/update-margin-data.yml
```
- **觸發時間**: 每天 UTC 0:00（台灣時間 08:00）
- **功能**: 自動執行 Python 爬蟲，更新 `data/margin_data.json`
- **手動觸發**: 支援（在 GitHub Actions 頁面點擊「Run workflow」）

### **2. GitHub Pages 部署工作流**
```
.github/workflows/deploy.yml
```
- **觸發條件**: 每次推送到 main/master 分支
- **功能**: 自動建置並部署網站到 GitHub Pages

### **3. 修改後的前端代碼**
```
src/ui/app.ts
```
- **變更**: `updateMarginData()` 函數說明更新
- **功能**: 重新載入最新資料（GitHub Actions 已自動更新）

---

## 🚀 部署步驟

### **步驟 1：推送代碼到 GitHub**

```bash
# 添加所有變更
git add .

# 提交變更
git commit -m "feat: add GitHub Actions for auto-update and deploy"

# 推送到 GitHub
git push origin main
```

### **步驟 2：啟用 GitHub Pages**

1. 進入 GitHub 倉庫設定
2. 點擊「Settings」→「Pages」
3. 在「Build and deployment」下：
   - Source: 選擇「GitHub Actions」
4. 點擊「Save」

### **步驟 3：設定工作流權限**

1. 進入「Settings」→「Actions」→「General」
2. 找到「Workflow permissions」
3. 選擇「Read and write permissions」
4. 勾選「Allow GitHub Actions to create and approve pull requests」
5. 點擊「Save」

### **步驟 4：手動觸發工作流（測試）**

1. 進入 GitHub 倉庫
2. 點擊「Actions」標籤
3. 選擇「Update Margin Data Daily」
4. 點擊「Run workflow」
5. 選擇分支：`main`
6. 點擊「Run workflow」

### **步驟 5：驗證部署**

1. 等待工作流完成（通常 5-10 分鐘）
2. 訪問您的 GitHub Pages 網址：
   ```
   https://yourusername.github.io/LookUpMarginRates/
   ```
3. 點擊「保證金更新」按鈕
4. 驗證資料正確載入

---

## 📅 自動更新時間表

| 時間（台灣） | 操作 | 說明 |
|------------|------|------|
| **每天 08:00** | 執行爬蟲 | GitHub Actions 自動執行 |
| **每天 08:05** | 推送更新 | 自動推送到 GitHub |
| **每天 08:10** | 部署網站 | GitHub Pages 自動部署 |

---

## 🔧 手動操作

### **手動觸發資料更新**

1. 進入 GitHub 倉庫
2. 點擊「Actions」
3. 選擇「Update Margin Data Daily」
4. 點擊「Run workflow」
5. 點擊「Run workflow」確認

### **本地更新資料**

```bash
# 執行 Python 爬蟲（本地）
npm run fetch-data

# 或直接執行
python scripts/fetch_data.py
```

---

## 🐛 疑難排解

### **問題 1：工作流執行失敗**

**檢查項目**：
1. 是否已設定工作流權限？
2. Python 爬蟲腳本是否正確？
3. 期交所網站是否正常？

**解決方法**：
1. 進入「Actions」→ 點擊失敗的工作流
2. 查看錯誤日誌
3. 根據錯誤訊息修復問題

### **問題 2：GitHub Pages 無法訪問**

**檢查項目**：
1. 是否已啟用 GitHub Pages？
2. 部署工作流是否成功？
3. 網址是否正確？

**解決方法**：
1. 檢查「Settings」→「Pages」
2. 確認 Source 為「GitHub Actions」
3. 重新執行部署工作流

### **問題 3：資料未更新**

**檢查項目**：
1. 工作流是否已執行？
2. 是否有變更需要提交？
3. 網站快取是否需要清除？

**解決方法**：
1. 檢查「Actions」→「Update Margin Data Daily」
2. 手動觸發工作流
3. 清除瀏覽器快取（Ctrl+Shift+Delete）

---

## 📊 工作流狀態

### **查看工作流狀態**

1. 進入 GitHub 倉庫
2. 點擊「Actions」標籤
3. 查看最近的執行記錄

### **工作流狀態說明**

| 圖示 | 狀態 | 說明 |
|------|------|------|
| ✅ | 成功 | 工作流執行成功 |
| ❌ | 失敗 | 工作流執行失敗 |
| 🟡 | 進行中 | 工作流正在執行 |
| ⏸️ | 取消 | 工作流已取消 |

---

## 💡 最佳實踐

### **1. 定期檢查工作流**
- 每週檢查一次「Actions」頁面
- 確保工作流正常執行
- 處理任何錯誤

### **2. 監控資料品質**
- 定期訪問網站
- 驗證資料是否正確
- 檢查資料日期是否最新

### **3. 備份重要資料**
- 定期下載 `data/margin_data.json`
- 保存在安全的地方
- 以防萬一

---

## 🎉 完成清單

- [x] 建立 `.github/workflows/update-margin-data.yml`
- [x] 建立 `.github/workflows/deploy.yml`
- [x] 修改 `src/ui/app.ts`
- [ ] 推送代碼到 GitHub
- [ ] 啟用 GitHub Pages
- [ ] 設定工作流權限
- [ ] 手動觸發工作流測試
- [ ] 驗證網站部署成功
- [ ] 驗證保證金資料正確載入

---

## 📞 技術支援

### **查看日誌**

```bash
# GitHub Actions 日誌
# 進入 GitHub → Actions → 點擊工作流 → 查看日誌
```

### **常見錯誤**

| 錯誤訊息 | 原因 | 解決方法 |
|---------|------|---------|
| `Permission denied` | 權限不足 | 設定工作流權限 |
| `Python script failed` | 爬蟲失敗 | 檢查期交所網站 |
| `Build failed` | 建置錯誤 | 檢查 TypeScript 編譯 |

---

## 🚀 後續優化

### **可選改進**

1. **添加 Email 通知**
   - 工作流失敗時發送 Email
   - 使用 GitHub Actions Email Action

2. **添加 Slack 通知**
   - 整合 Slack Webhook
   - 實時通知團隊

3. **增加測試步驟**
   - 在部署前執行單元測試
   - 確保代碼品質

4. **優化執行時間**
   - 使用快取加速建置
   - 並行執行多個任務

---

**設定工程師**: Cline AI Assistant  
**文檔版本**: v1.0.0  
**最後更新**: 2026-05-04
