/**
 * UI 應用邏輯
 * 實現搜尋、顯示、計算等功能
 */

import {
  loadLocalData,
  normalizeMarginData,
  searchFutures,
  findByStockCode,
} from '../logic/dataLoader';
import { 
  calculateMargin, 
  calculateSummary,
  calculateRiskMetrics,
  getRiskLevelText,
  formatRiskRatio,
} from '../logic/marginCalculator';
import { formatNumber, formatPercentage, debounce, ToastManager } from '../logic/utils';
import { 
  checkMarginUpdateCooldown, 
  checkPriceUpdateCooldown,
  setMarginUpdateTime,
  setPriceUpdateTime,
  formatRemainingTime,
} from '../logic/cooldownManager';
import { 
  saveEquity, 
  loadEquity, 
  saveCalculationList, 
  loadCalculationList 
} from '../logic/storageManager';
import { updateMultiplePrices } from '../logic/priceUpdater';
import type { MarginItem, CalculationResult } from '../logic/types';

// 全域狀態
let marginData: MarginItem[] = [];
let selectedItem: MarginItem | null = null;
let calculationList: CalculationResult[] = [];
let currentEquity: number = 0;
let cooldownTimers: { margin?: number; price?: number } = {};

// UI 管理器
const toast = new ToastManager();

/**
 * 初始化應用程式
 */
export async function initApp() {
  try {
    console.log('[App] 開始初始化應用程式...');
    
    // 顯示初始狀態（不自動載入資料）
    updateStatus('warning', '尚未載入資料，請點擊「更新保證金」按鈕');
    
    // 清除所有 localStorage 資料（每次開啟時重新開始）
    calculationList = [];
    currentEquity = 0;
    
    // 清除計算列表
    const tbody = document.querySelector('.calc-table tbody');
    if (tbody) {
      tbody.innerHTML = Array(10).fill(0).map((_, index) => `
        <tr class="empty-row" data-index="${index}">
          <td>${index + 1}</td>
          <td colspan="8" style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
            尚未加入合約
          </td>
        </tr>
      `).join('');
    }
    
    // 清除權益總值輸入框
    const equityInput = document.getElementById('equity-input') as HTMLInputElement;
    if (equityInput) {
      equityInput.value = '';
      equityInput.title = '';
    }
    
    // 清除總計顯示
    document.getElementById('sum-clearing')!.textContent = '$0';
    document.getElementById('sum-maintenance')!.textContent = '$0';
    document.getElementById('sum-initial')!.textContent = '$0';
    
    // 初始化風險管理面板
    initRiskPanel();
    
    // 啟動冷卻倒計時
    startCooldownTimers();
    
    console.log('[App] ✓ 應用程式初始化完成，所有資訊已清除');
    
  } catch (error) {
    console.error('[App] ✗ 初始化失敗:', error);
    updateStatus('error', '初始化失敗');
    toast.show('應用程式初始化失敗，請重新整理頁面', 'error', 5000);
  }
}

/**
 * 手動更新保證金資料
 * 注意：資料由 GitHub Actions 每天自動更新
 * 此函數用於手動重新載入最新資料
 */
export async function updateMarginData() {
  const updateBtn = document.getElementById('update-data-btn') as HTMLButtonElement;
  
  // 檢查冷卻時間
  const cooldownCheck = checkMarginUpdateCooldown();
  if (!cooldownCheck.canUpdate) {
    toast.show(cooldownCheck.message || '更新冷卻中', 'error', 3000);
    return;
  }
  
  // 立即禁用按鈕，防止重複點擊
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.textContent = '⏳ 更新中...';
  }
  
  try {
    console.log('[App] 開始重新載入保證金資料...');
    
    // 顯示載入狀態
    updateStatus('loading', '正在載入保證金資料...');
    
    // 載入本地資料
    const localData = await loadLocalData();
    
    if (localData && localData.futures && localData.futures.length > 0) {
      // 使用本地資料
      marginData = normalizeMarginData(localData.futures);
      updateStatus('success', `資料已載入（${localData.data_date}）- ${marginData.length} 筆期貨`);
      console.log(`[App] ✓ 更新成功：${marginData.length} 筆`);
      toast.show(`✓ 成功載入 ${marginData.length} 筆期貨資料`, 'success', 3000);
      
      // 啟用搜尋框
      const searchInput = document.getElementById('search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.placeholder = '搜尋股票代碼或名稱...';
        searchInput.disabled = false;
      }
    } else {
      // 資料載入失敗
      updateStatus('error', '資料載入失敗');
      console.error('[App] ✗ 資料載入失敗');
      toast.show('資料載入失敗，請稍後再試', 'error', 5000);
    }
    
  } catch (error) {
    console.error('[App] ✗ 更新失敗:', error);
    updateStatus('error', '更新失敗');
    toast.show('資料更新失敗，請檢查網路連線', 'error', 5000);
  } finally {
    // 更新完成後才開始冷卻倒數
    setMarginUpdateTime();
    startCooldownTimers();
    
    // 恢復按鈕狀態
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.textContent = '🔄 更新保證金';
    }
  }
}

/**
 * 初始化事件監聽器
 */
export function initEventListeners() {
  console.log('[App] 設定事件監聽器...');
  
  // 搜尋框輸入事件 (使用 debounce 優化)
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearchInput, 200));
    searchInput.addEventListener('focus', handleSearchFocus);
    searchInput.addEventListener('blur', handleSearchBlur);
  }
  
  // 帶入計算按鈕
  const addBtn = document.getElementById('add-to-calc-btn');
  if (addBtn) {
    addBtn.addEventListener('click', handleAddToCalculation);
  }
  
  // 點擊外部關閉下拉選單
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const searchWrap = document.querySelector('.search-wrap');
    if (searchWrap && !searchWrap.contains(target)) {
      hideDropdown();
    }
  });
}

/**
 * 處理搜尋輸入
 */
function handleSearchInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const query = input.value.trim();
  
  console.log(`[Search] 搜尋: "${query}"`);
  
  if (query.length === 0) {
    hideDropdown();
    return;
  }
  
  // 搜尋期貨
  const results = searchFutures(marginData, query, 10);
  console.log(`[Search] 找到 ${results.length} 筆結果`);
  
  if (results.length === 0) {
    showDropdown([]);
    return;
  }
  
  // 顯示搜尋結果
  showDropdown(results.map(r => r.item));
  
  // 如果只有一個結果，自動選擇（優化項目3）
  if (results.length === 1) {
    setTimeout(() => selectMarginItem(results[0].item), 300);
  }
}

/**
 * 處理搜尋框獲得焦點
 */
function handleSearchFocus() {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput && searchInput.value.trim()) {
    handleSearchInput({ target: searchInput } as any);
  }
}

/**
 * 處理搜尋框失去焦點
 */
function handleSearchBlur() {
  // 延遲關閉，讓點擊事件能觸發
  setTimeout(() => hideDropdown(), 200);
}

/**
 * 顯示下拉選單
 */
function showDropdown(items: MarginItem[]) {
  const dropdown = document.getElementById('search-dropdown');
  if (!dropdown) return;
  
  if (items.length === 0) {
    dropdown.innerHTML = '<div class="dropdown-empty">沒有找到相關期貨</div>';
    dropdown.classList.add('show');
    return;
  }
  
  dropdown.innerHTML = items.map(item => `
    <div class="dropdown-item" data-code="${item.contractCode}">
      <div class="dropdown-item-name">${item.contractName}</div>
      <div class="dropdown-item-info">
        代碼：${item.stockCode} | 
        每口：${item.lotSize} 股 | 
        ${item.type === 'stock' ? 
          `保證金：${formatPercentage(item.initialRate || 0)}` : 
          `保證金：$${formatNumber(item.initialFixed || 0)}`
        }
      </div>
    </div>
  `).join('');
  
  dropdown.classList.add('show');
  
  // 為每個項目添加點擊事件
  dropdown.querySelectorAll('.dropdown-item').forEach(el => {
    el.addEventListener('click', (e) => {
      const code = (e.currentTarget as HTMLElement).dataset.code;
      const item = items.find(i => i.contractCode === code);
      if (item) {
        selectMarginItem(item);
        hideDropdown();
      }
    });
  });
}

/**
 * 隱藏下拉選單
 */
function hideDropdown() {
  const dropdown = document.getElementById('search-dropdown');
  if (dropdown) {
    dropdown.classList.remove('show');
  }
}

/**
 * 選擇保證金項目（優化項目3：自動帶出資訊）
 */
function selectMarginItem(item: MarginItem) {
  console.log(`[Select] 選擇: ${item.contractName}`);
  
  selectedItem = item;
  
  // 更新輸入框
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = item.contractName;
  }
  
  // 顯示保證金資訊
  displayMarginInfo(item);
  
  // 隱藏 placeholder，顯示內容
  const placeholder = document.querySelector('.result-placeholder') as HTMLElement;
  const content = document.querySelector('.result-content') as HTMLElement;
  if (placeholder) placeholder.style.display = 'none';
  if (content) content.style.display = 'block';
}

/**
 * 顯示保證金資訊
 */
function displayMarginInfo(item: MarginItem) {
  // 合約類型標籤
  const typeBadge = document.getElementById('result-type-badge');
  if (typeBadge) {
    if (item.contractName.includes('小型')) {
      typeBadge.textContent = '小型期貨';
      typeBadge.className = 'result-type-badge small';
    } else if (item.type === 'etf') {
      typeBadge.textContent = 'ETF 期貨';
      typeBadge.className = 'result-type-badge etf';
    } else {
      typeBadge.textContent = '一般股票期貨';
      typeBadge.className = 'result-type-badge stock';
    }
  }
  
  // 合約名稱
  const contractName = document.getElementById('result-contract-name');
  if (contractName) contractName.textContent = item.contractName;
  
  // 股票代碼
  const contractSub = document.getElementById('result-contract-sub');
  if (contractSub) contractSub.textContent = `代碼：${item.stockCode}`;
  
  // 每口股數
  const lotSize = document.getElementById('result-lot-size');
  if (lotSize) lotSize.textContent = item.lotSize.toString();
  
  // 保證金比例/金額
  if (item.type === 'stock') {
    document.getElementById('result-clearing')!.textContent = formatPercentage(item.clearingRate || 0);
    document.getElementById('result-maintenance')!.textContent = formatPercentage(item.maintenanceRate || 0);
    document.getElementById('result-initial')!.textContent = formatPercentage(item.initialRate || 0);
  } else {
    document.getElementById('result-clearing')!.textContent = `$${formatNumber(item.clearingFixed || 0)}`;
    document.getElementById('result-maintenance')!.textContent = `$${formatNumber(item.maintenanceFixed || 0)}`;
    document.getElementById('result-initial')!.textContent = `$${formatNumber(item.initialFixed || 0)}`;
  }
}

/**
 * 處理帶入計算
 */
function handleAddToCalculation() {
  if (!selectedItem) {
    toast.show('請先搜尋並選擇期貨', 'error');
    return;
  }
  
  if (calculationList.length >= 10) {
    toast.show('最多只能同時計算 10 個合約', 'error');
    return;
  }
  
  // 添加到計算列表（預設 1 口，股價為 0 需使用者輸入）
  const result = calculateMargin(selectedItem, 0, 1);
  calculationList.push(result);
  
  // 更新計算表
  renderCalculationTable();
  updateSummary();
  
  toast.show(`已加入：${selectedItem.contractName}`, 'success');
}

/**
 * 初始化計算表
 */
// @ts-ignore - 此函數目前由 initApp() 內聯實現
function initCalculationTable() {
  const tbody = document.querySelector('.calc-table tbody');
  if (!tbody) return;
  
  // 生成 10 個空行
  tbody.innerHTML = Array(10).fill(0).map((_, index) => `
    <tr class="empty-row" data-index="${index}">
      <td>${index + 1}</td>
      <td colspan="8" style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
        尚未加入合約
      </td>
    </tr>
  `).join('');
}

 /**
  * 渲染計算表
  */
function renderCalculationTable() {
  const tbody = document.querySelector('.calc-table tbody');
  if (!tbody) return;
  
  tbody.innerHTML = Array(10).fill(0).map((_, index) => {
    const calc = calculationList[index];
    if (!calc) {
      return `
        <tr class="empty-row" data-index="${index}">
          <td>${index + 1}</td>
          <td colspan="10" style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
            尚未加入合約
          </td>
        </tr>
      `;
    }
    
    // 取得原始項目以獲取保證金比例
    const item = marginData.find(m => m.contractCode === calc.contractCode);
    const totalMarketValue = calc.lots * calc.lotSize * calc.price;
    
    // 計算保證金比例顯示
    let clearingLabel = '';
    let maintenanceLabel = '';
    let initialLabel = '';
    
    if (item && item.type === 'stock') {
      clearingLabel = item.clearingRate ? `<div class="margin-ratio">${formatPercentage(item.clearingRate)}</div>` : '';
      maintenanceLabel = item.maintenanceRate ? `<div class="margin-ratio">${formatPercentage(item.maintenanceRate)}</div>` : '';
      initialLabel = item.initialRate ? `<div class="margin-ratio">${formatPercentage(item.initialRate)}</div>` : '';
    }
     
    return `
       <tr data-index="${index}">
         <td>${index + 1}</td>
         <td>${calc.contractName}</td>
         <td>${calc.stockCode}</td>
         <td>${calc.lotSize}</td>
         <td>
           <input type="number" class="calc-input" value="${calc.lots}" min="1" 
             onchange="window.updateLots(${index}, this.value)" title="${formatNumber(calc.lots)}" />
         </td>
         <td>
           <input type="number" class="calc-input" value="${calc.price}" min="0" step="0.1"
             onchange="window.updatePrice(${index}, this.value)" title="${formatNumber(Math.round(calc.price))}" />
         </td>
         <td style="text-align: right; padding-right: 12px;">${formatNumber(Math.round(totalMarketValue))}</td>
         <td>
           ${clearingLabel}
           <div>$${formatNumber(calc.clearingMargin)}</div>
         </td>
         <td>
           ${maintenanceLabel}
           <div>$${formatNumber(calc.maintenanceMargin)}</div>
         </td>
         <td>
           ${initialLabel}
           <div>$${formatNumber(calc.initialMargin)}</div>
         </td>
         <td>
           <button class="btn-delete" onclick="window.deleteRow(${index})" title="刪除此列">
             ❌
           </button>
         </td>
       </tr>
     `;
  }).join('');
}

/**
 * 更新總計
 */
function updateSummary() {
  if (calculationList.length === 0) {
    document.getElementById('sum-clearing')!.textContent = '$0';
    document.getElementById('sum-maintenance')!.textContent = '$0';
    document.getElementById('sum-initial')!.textContent = '$0';
    return;
  }
  
  const summary = calculateSummary(calculationList);
  document.getElementById('sum-clearing')!.textContent = `$${formatNumber(summary.totalClearing)}`;
  document.getElementById('sum-maintenance')!.textContent = `$${formatNumber(summary.totalMaintenance)}`;
  document.getElementById('sum-initial')!.textContent = `$${formatNumber(summary.totalInitial)}`;
}

/**
 * 更新口數
 */
function updateLots(index: number, lots: string) {
  const calc = calculationList[index];
  if (!calc) return;
  
  const item = marginData.find(m => m.contractCode === calc.contractCode);
  if (!item) return;
  
  const newCalc = calculateMargin(item, calc.price, parseInt(lots) || 1);
  calculationList[index] = newCalc;
  
  renderCalculationTable();
  updateSummary();
}

/**
 * 更新股價
 */
function updatePrice(index: number, price: string) {
  const calc = calculationList[index];
  if (!calc) return;
  
  const item = marginData.find(m => m.contractCode === calc.contractCode);
  if (!item) return;
  
  const newCalc = calculateMargin(item, parseFloat(price) || 0, calc.lots);
  calculationList[index] = newCalc;
  
  renderCalculationTable();
  updateSummary();
}

/**
 * 更新狀態指示器（優化項目1）
 */
function updateStatus(status: 'loading' | 'success' | 'warning' | 'error', message: string) {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.getElementById('status-text');
  
  if (statusDot) {
    statusDot.className = `status-dot ${status}`;
  }
  
  if (statusText) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    statusText.textContent = `${message} (${timeStr})`;
  }
}

/**
 * 測試股票代碼
 */
export function testStockCodes(codes: string[]) {
  console.log('\n[Test] 測試股票代碼:', codes);
  codes.forEach(code => {
    const item = findByStockCode(marginData, code);
    if (item) {
      console.log(`  ✓ ${code}: ${item.contractName}`);
    } else {
      console.log(`  ✗ ${code}: 找不到`);
    }
  });
}

/**
 * 恢復 localStorage 中的資料
 */
// @ts-ignore - 此函數目前由 initApp() 內聯實現
function restoreStoredData() {
  // 恢復權益總值
  const savedEquity = loadEquity();
  if (savedEquity !== null) {
    currentEquity = savedEquity;
    const equityInput = document.getElementById('equity-input') as HTMLInputElement;
    if (equityInput) {
      equityInput.value = savedEquity.toString();
    }
    console.log(`[App] ✓ 恢復權益總值: $${savedEquity.toLocaleString()}`);
  }
  
  // 恢復計算列表
  const savedList = loadCalculationList();
  if (savedList && savedList.length > 0) {
    calculationList = savedList;
    renderCalculationTable();
    updateSummary();
    updateRiskMetrics();
    console.log(`[App] ✓ 恢復計算列表: ${savedList.length} 項`);
  }
}

/**
 * 初始化風險管理面板
 */
function initRiskPanel() {
  const equityInput = document.getElementById('equity-input') as HTMLInputElement;
  if (equityInput) {
    equityInput.addEventListener('input', debounce(handleEquityInput, 300));
  }
  
  // 如果已有權益總值，顯示風險指標
  if (currentEquity > 0) {
    updateRiskMetrics();
  }
}

/**
 * 處理權益總值輸入
 */
function handleEquityInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const equity = parseFloat(input.value) || 0;
  
  currentEquity = equity;
  
  // 保存到 localStorage
  if (equity > 0) {
    saveEquity(equity);
  }
  
  // 更新輸入框的 title 以顯示千位分隔符
  if (equity > 0) {
    input.title = `${formatNumber(Math.round(equity))}`;
  }
  
  // 更新風險指標
  updateRiskMetrics();
}

/**
 * 更新風險指標顯示
 */
function updateRiskMetrics() {
  const summary = calculateSummary(calculationList);
  const totalInitialMargin = summary.totalInitial;
  
  const metricsDiv = document.getElementById('risk-metrics');
  const placeholderDiv = document.getElementById('risk-placeholder');
  
  if (currentEquity <= 0 || totalInitialMargin <= 0) {
    // 隱藏風險指標，顯示 placeholder
    if (metricsDiv) metricsDiv.style.display = 'none';
    if (placeholderDiv) placeholderDiv.style.display = 'block';
    return;
  }
  
  // 計算風險指標
  const metrics = calculateRiskMetrics(currentEquity, totalInitialMargin);
  
  // 顯示風險指標
  if (metricsDiv) metricsDiv.style.display = 'grid';
  if (placeholderDiv) placeholderDiv.style.display = 'none';
  
  // 更新原始保證金總計
  const initialMarginEl = document.getElementById('risk-initial-margin');
  if (initialMarginEl) {
    initialMarginEl.textContent = `$${formatNumber(totalInitialMargin)}`;
  }
  
  // 更新風險指標值
  const riskRatioEl = document.getElementById('risk-ratio');
  if (riskRatioEl) {
    riskRatioEl.textContent = formatRiskRatio(metrics.riskRatio);
    riskRatioEl.className = `risk-metric-value risk-${metrics.riskLevel}`;
  }
  
  // 更新超額保證金
  const excessMarginEl = document.getElementById('excess-margin');
  if (excessMarginEl) {
    const prefix = metrics.excessMargin >= 0 ? '+$' : '-$';
    const absValue = Math.abs(metrics.excessMargin);
    excessMarginEl.textContent = `${prefix}${formatNumber(absValue)}`;
    excessMarginEl.className = `risk-metric-value ${metrics.excessMargin >= 0 ? 'positive' : 'negative'}`;
  }
  
  // 更新風險等級標籤
  const riskLevelBadge = document.getElementById('risk-level-badge');
  if (riskLevelBadge) {
    riskLevelBadge.textContent = getRiskLevelText(metrics.riskLevel);
    riskLevelBadge.className = `risk-level-badge risk-${metrics.riskLevel}`;
  }
}

/**
 * 手動更新風險指標（用於「更新」按鈕）
 */
function updateRiskMetricsManually() {
  if (calculationList.length === 0) {
    toast.show('請先加入合約到試算表', 'error', 3000);
    return;
  }
  
  if (currentEquity <= 0) {
    toast.show('請先輸入權益總值', 'error', 3000);
    return;
  }
  
  // 重新計算風險指標
  updateRiskMetrics();
  
  // 顯示提示
  toast.show('✓ 風險指標已更新', 'success', 2000);
}

/**
 * 更新股價（從 TWSE 或 Yahoo Finance）
 */
export async function updateStockPrices() {
  const updateBtn = document.getElementById('update-price-btn') as HTMLButtonElement;
  
  // 檢查是否有合約需要更新
  if (calculationList.length === 0) {
    toast.show('請先加入合約到試算表', 'error', 3000);
    return;
  }
  
  // 檢查冷卻時間
  const cooldownCheck = checkPriceUpdateCooldown();
  if (!cooldownCheck.canUpdate) {
    toast.show(cooldownCheck.message || '更新冷卻中', 'error', 3000);
    return;
  }
  
  // 立即禁用按鈕
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.textContent = '⏳ 更新中...';
  }
  
  try {
    console.log('[App] 開始更新股價...');
    
    // 顯示載入狀態
    updateStatus('loading', '正在更新股價...');
    
    // 取得所有股票代碼
    const stockCodes = [...new Set(calculationList.map(c => c.stockCode))];
    
    // 批次更新股價
    const results = await updateMultiplePrices(stockCodes);
    
    // 更新計算列表中的股價
    let successCount = 0;
    calculationList.forEach((calc, index) => {
      const result = results.find(r => r.stockCode === calc.stockCode);
      if (result && result.success && result.price) {
        const item = marginData.find(m => m.contractCode === calc.contractCode);
        if (item) {
          calculationList[index] = calculateMargin(item, result.price, calc.lots);
          successCount++;
        }
      }
    });
    
    // 更新 UI
    renderCalculationTable();
    updateSummary();
    updateRiskMetrics();
    
    // 保存到 localStorage
    saveCalculationList(calculationList);
    
    // 顯示結果
    if (successCount > 0) {
      updateStatus('success', `股價更新完成：${successCount}/${stockCodes.length} 成功`);
      toast.show(`✓ 成功更新 ${successCount} 個股票價格`, 'success', 3000);
    } else {
      updateStatus('error', '股價更新失敗');
      toast.show('無法更新股價，請稍後再試', 'error', 5000);
    }
    
  } catch (error) {
    console.error('[App] ✗ 股價更新失敗:', error);
    updateStatus('error', '股價更新失敗');
    toast.show('股價更新失敗，請檢查網路連線', 'error', 5000);
  } finally {
    // 更新完成後才開始冷卻倒數
    setPriceUpdateTime();
    startCooldownTimers();
    
    // 恢復按鈕狀態
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.textContent = '💰 更新股價';
    }
  }
}

/**
 * 啟動冷卻倒計時
 */
function startCooldownTimers() {
  // 清除現有計時器
  if (cooldownTimers.margin) clearInterval(cooldownTimers.margin);
  if (cooldownTimers.price) clearInterval(cooldownTimers.price);
  
  // 更新保證金按鈕冷卻
  updateMarginButtonCooldown();
  cooldownTimers.margin = window.setInterval(updateMarginButtonCooldown, 1000);
  
  // 更新股價按鈕冷卻
  updatePriceButtonCooldown();
  cooldownTimers.price = window.setInterval(updatePriceButtonCooldown, 1000);
}

/**
 * 更新保證金按鈕冷卻顯示
 */
function updateMarginButtonCooldown() {
  const cooldownCheck = checkMarginUpdateCooldown();
  const updateBtn = document.getElementById('update-data-btn') as HTMLButtonElement;
  
  if (!updateBtn) return;
  
  if (cooldownCheck.canUpdate) {
    updateBtn.textContent = '🔄 更新保證金';
    updateBtn.disabled = false;
    updateBtn.title = '點擊更新保證金資料';
  } else {
    const timeLeft = formatRemainingTime(cooldownCheck.remaining);
    updateBtn.textContent = `⏳ ${timeLeft}`;
    updateBtn.disabled = true;
    updateBtn.title = cooldownCheck.message || '冷卻中';
  }
}

/**
 * 更新股價按鈕冷卻顯示
 */
function updatePriceButtonCooldown() {
  const cooldownCheck = checkPriceUpdateCooldown();
  const updateBtn = document.getElementById('update-price-btn') as HTMLButtonElement;
  
  if (!updateBtn) return;
  
  if (cooldownCheck.canUpdate) {
    updateBtn.textContent = '💰 更新股價';
    updateBtn.disabled = false;
    updateBtn.title = '點擊更新股價資料';
  } else {
    const timeLeft = formatRemainingTime(cooldownCheck.remaining);
    updateBtn.textContent = `⏳ ${timeLeft}`;
    updateBtn.disabled = true;
    updateBtn.title = cooldownCheck.message || '冷卻中';
  }
}

/**
 * 刪除指定列的資料
 */
function deleteRow(index: number) {
  if (index < 0 || index >= calculationList.length) return;
  
  const item = calculationList[index];
  console.log(`[Delete] 刪除第 ${index + 1} 列：${item.contractName}`);
  
  // 從列表中移除
  calculationList.splice(index, 1);
  
  // 重新渲染
  renderCalculationTable();
  updateSummary();
  updateRiskMetrics();
  
  // 保存到 localStorage
  saveCalculationList(calculationList);
  
  // 顯示提示
  toast.show(`已刪除：${item.contractName}`, 'success', 2000);
}

/**
 * 清除清單所有內容
 */
function clearCalculationList() {
  if (calculationList.length === 0) {
    toast.show('清單已為空', 'info', 2000);
    return;
  }
  
  // 確認對話框
  const confirmed = confirm(`確定要清除清單中的 ${calculationList.length} 筆資料嗎？`);
  if (!confirmed) return;
  
  console.log('[Clear] 清除所有計算資料');
  
  // 清空列表
  calculationList = [];
  
  // 清除權益總值
  currentEquity = 0;
  const equityInput = document.getElementById('equity-input') as HTMLInputElement;
  if (equityInput) {
    equityInput.value = '';
    equityInput.title = '';
  }
  
  // 重新渲染
  renderCalculationTable();
  updateSummary();
  updateRiskMetrics();
  
  // 保存到 localStorage
  saveCalculationList(calculationList);
  saveEquity(0); // 清除權益總值的 localStorage
  
  // 顯示提示
  toast.show('已清除清單所有內容', 'success', 2000);
}

// 暴露給全域使用
(window as any).updateLots = updateLots;
(window as any).updatePrice = updatePrice;
(window as any).updateStockPrices = updateStockPrices;
(window as any).updateRiskMetricsManually = updateRiskMetricsManually;
(window as any).deleteRow = deleteRow;
(window as any).clearCalculationList = clearCalculationList;
