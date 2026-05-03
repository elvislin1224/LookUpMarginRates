var S=Object.defineProperty;var I=(t,e,n)=>e in t?S(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var w=(t,e,n)=>I(t,typeof e!="symbol"?e+"":e,n);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(o){if(o.ep)return;o.ep=!0;const r=n(o);fetch(o.href,r)}})();function v(t,e="stock"){return e==="etf"?1e3:t&&t.includes("小型")?100:2e3}async function M(){try{console.log("[DataLoader] 嘗試載入本地資料: /LookUpMarginRates/margin_data.json");const t=await fetch("/LookUpMarginRates/margin_data.json");if(!t.ok)throw new Error(`HTTP ${t.status}: ${t.statusText}`);const e=await t.json();if(!e.futures||!Array.isArray(e.futures))throw new Error("資料格式錯誤：缺少 futures 陣列");return console.log(`[DataLoader] ✓ 本地資料載入成功：${e.total_count} 筆`),console.log(`[DataLoader] 資料日期：${e.data_date}`),console.log(`[DataLoader] 最後更新：${e.last_updated}`),e}catch(t){return console.error("[DataLoader] ✗ 本地資料載入失敗:",t),null}}function b(t,e=24){try{const n=new Date(t).getTime(),o=(new Date().getTime()-n)/(1e3*60*60),r=o<e;return console.log(`[DataLoader] 資料新鮮度檢查：${o.toFixed(1)} 小時 (${r?"有效":"已過期"})`),r}catch(n){return console.error("[DataLoader] 資料新鮮度檢查失敗:",n),!1}}function B(t){return t.map(e=>((!e.lotSize||e.lotSize===0)&&(e.lotSize=v(e.contractName,e.type)),e))}function T(t,e,n=50){var r;if(!e||e.trim()==="")return[];const a=e.toLowerCase().trim(),o=[];for(const c of t){let s=0;c.stockCode.toLowerCase()===a?s=100:c.stockCode.toLowerCase().startsWith(a)?s=80:c.stockCode.toLowerCase().includes(a)?s=60:c.contractName.toLowerCase().includes(a)?s=40:(r=c.stockName)!=null&&r.toLowerCase().includes(a)&&(s=30),s>0&&o.push({item:c,relevance:s})}return o.sort((c,s)=>s.relevance-c.relevance).slice(0,n)}function k(t,e){return t.find(n=>n.stockCode===e)}function h(t,e,n){let a=0,o=0,r=0;if(t.type==="stock"){const c=n*t.lotSize*e;a=c*(t.clearingRate??0),o=c*(t.maintenanceRate??0),r=c*(t.initialRate??0)}else t.type==="etf"&&(a=n*(t.clearingFixed??0),o=n*(t.maintenanceFixed??0),r=n*(t.initialFixed??0));return{contractCode:t.contractCode,contractName:t.contractName,stockCode:t.stockCode,lotSize:t.lotSize,price:e,lots:n,clearingMargin:Math.round(a),maintenanceMargin:Math.round(o),initialMargin:Math.round(r)}}function N(t){const e=t.reduce((o,r)=>o+r.clearingMargin,0),n=t.reduce((o,r)=>o+r.maintenanceMargin,0),a=t.reduce((o,r)=>o+r.initialMargin,0);return{totalClearing:Math.round(e),totalMaintenance:Math.round(n),totalInitial:Math.round(a),itemCount:t.length}}function i(t){return Math.round(t).toLocaleString("zh-TW")}function m(t){return`${(t*100).toFixed(2)}%`}function D(t,e){let n=null;return function(...a){const o=this;n&&clearTimeout(n),n=setTimeout(()=>{t.apply(o,a)},e)}}class z{constructor(){w(this,"container",null);this.ensureContainer()}ensureContainer(){let e=document.getElementById("toast-container");e||(e=document.createElement("div"),e.id="toast-container",e.style.cssText=`
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `,document.body.appendChild(e)),this.container=e}show(e,n="info",a=3e3){if(this.ensureContainer(),!this.container)return;const o=document.createElement("div");o.className=`toast toast-${n}`,o.textContent=e,o.style.cssText=`
      background: ${n==="success"?"#3fb950":n==="error"?"#f85149":"#58a6ff"};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `,this.container.appendChild(o),setTimeout(()=>{o.style.animation="slideOut 0.3s ease",setTimeout(()=>{o.remove()},300)},a)}}let d=[],p=null,l=[];const u=new z;async function F(){try{console.log("[App] 開始初始化應用程式..."),f("loading","正在載入保證金資料...");const t=await M();t&&b(t.last_updated)?(d=B(t.futures),f("success",`資料已載入（${t.data_date}）- ${d.length} 筆期貨`),console.log(`[App] ✓ 使用本地資料：${d.length} 筆`)):(f("warning","本地資料不可用，請執行 npm run fetch-data"),console.warn("[App] ⚠ 本地資料不可用"),u.show("請先執行 npm run fetch-data 下載保證金資料","info",5e3));const e=document.getElementById("search-input");e&&d.length>0&&(e.placeholder="搜尋股票代碼或名稱...",console.log("[App] ✓ 搜尋功能已啟用")),O()}catch(t){console.error("[App] ✗ 初始化失敗:",t),f("error","初始化失敗"),u.show("應用程式初始化失敗，請重新整理頁面","error",5e3)}}function A(){console.log("[App] 設定事件監聽器...");const t=document.getElementById("search-input");t&&(t.addEventListener("input",D(x,200)),t.addEventListener("focus",P),t.addEventListener("blur",R));const e=document.getElementById("add-to-calc-btn");e&&e.addEventListener("click",q),document.addEventListener("click",n=>{const a=n.target,o=document.querySelector(".search-wrap");o&&!o.contains(a)&&g()})}function x(t){const n=t.target.value.trim();if(console.log(`[Search] 搜尋: "${n}"`),n.length===0){g();return}const a=T(d,n,10);if(console.log(`[Search] 找到 ${a.length} 筆結果`),a.length===0){C([]);return}C(a.map(o=>o.item)),a.length===1&&setTimeout(()=>L(a[0].item),300)}function P(){const t=document.getElementById("search-input");t&&t.value.trim()&&x({target:t})}function R(){setTimeout(()=>g(),200)}function C(t){const e=document.getElementById("search-dropdown");if(e){if(t.length===0){e.innerHTML='<div class="dropdown-empty">沒有找到相關期貨</div>',e.classList.add("show");return}e.innerHTML=t.map(n=>`
    <div class="dropdown-item" data-code="${n.contractCode}">
      <div class="dropdown-item-name">${n.contractName}</div>
      <div class="dropdown-item-info">
        代碼：${n.stockCode} | 
        每口：${n.lotSize} 股 | 
        ${n.type==="stock"?`保證金：${m(n.initialRate||0)}`:`保證金：$${i(n.initialFixed||0)}`}
      </div>
    </div>
  `).join(""),e.classList.add("show"),e.querySelectorAll(".dropdown-item").forEach(n=>{n.addEventListener("click",a=>{const o=a.currentTarget.dataset.code,r=t.find(c=>c.contractCode===o);r&&(L(r),g())})})}}function g(){const t=document.getElementById("search-dropdown");t&&t.classList.remove("show")}function L(t){console.log(`[Select] 選擇: ${t.contractName}`),p=t;const e=document.getElementById("search-input");e&&(e.value=t.contractName),_(t);const n=document.querySelector(".result-placeholder"),a=document.querySelector(".result-content");n&&(n.style.display="none"),a&&(a.style.display="block")}function _(t){const e=document.getElementById("result-type-badge");e&&(t.contractName.includes("小型")?(e.textContent="小型期貨",e.className="result-type-badge small"):t.type==="etf"?(e.textContent="ETF 期貨",e.className="result-type-badge etf"):(e.textContent="一般股票期貨",e.className="result-type-badge stock"));const n=document.getElementById("result-contract-name");n&&(n.textContent=t.contractName);const a=document.getElementById("result-contract-sub");a&&(a.textContent=`代碼：${t.stockCode}`);const o=document.getElementById("result-lot-size");o&&(o.textContent=t.lotSize.toString()),t.type==="stock"?(document.getElementById("result-clearing").textContent=m(t.clearingRate||0),document.getElementById("result-maintenance").textContent=m(t.maintenanceRate||0),document.getElementById("result-initial").textContent=m(t.initialRate||0)):(document.getElementById("result-clearing").textContent=`$${i(t.clearingFixed||0)}`,document.getElementById("result-maintenance").textContent=`$${i(t.maintenanceFixed||0)}`,document.getElementById("result-initial").textContent=`$${i(t.initialFixed||0)}`)}function q(){if(!p){u.show("請先搜尋並選擇期貨","error");return}if(l.length>=10){u.show("最多只能同時計算 10 個合約","error");return}const t=h(p,0,1);l.push(t),y(),$(),u.show(`已加入：${p.contractName}`,"success")}function O(){const t=document.querySelector(".calc-table tbody");t&&(t.innerHTML=Array(10).fill(0).map((e,n)=>`
    <tr class="empty-row" data-index="${n}">
      <td>${n+1}</td>
      <td colspan="8" style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
        尚未加入合約
      </td>
    </tr>
  `).join(""))}function y(){const t=document.querySelector(".calc-table tbody");t&&(t.innerHTML=Array(10).fill(0).map((e,n)=>{const a=l[n];return a?`
      <tr data-index="${n}">
        <td>${n+1}</td>
        <td>${a.contractName}</td>
        <td>${a.stockCode}</td>
        <td>${a.lotSize}</td>
        <td>
          <input type="number" class="calc-input" value="${a.lots}" min="1" 
            onchange="window.updateLots(${n}, this.value)" />
        </td>
        <td>
          <input type="number" class="calc-input" value="${a.price}" min="0" step="0.1"
            onchange="window.updatePrice(${n}, this.value)" />
        </td>
        <td>$${i(a.clearingMargin)}</td>
        <td>$${i(a.maintenanceMargin)}</td>
        <td>$${i(a.initialMargin)}</td>
      </tr>
    `:`
        <tr class="empty-row" data-index="${n}">
          <td>${n+1}</td>
          <td colspan="8" style="text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">
            尚未加入合約
          </td>
        </tr>
      `}).join(""))}function $(){if(l.length===0){document.getElementById("sum-clearing").textContent="$0",document.getElementById("sum-maintenance").textContent="$0",document.getElementById("sum-initial").textContent="$0";return}const t=N(l);document.getElementById("sum-clearing").textContent=`$${i(t.totalClearing)}`,document.getElementById("sum-maintenance").textContent=`$${i(t.totalMaintenance)}`,document.getElementById("sum-initial").textContent=`$${i(t.totalInitial)}`}function H(t,e){const n=l[t];if(!n)return;const a=d.find(r=>r.contractCode===n.contractCode);if(!a)return;const o=h(a,n.price,parseInt(e)||1);l[t]=o,y(),$()}function j(t,e){const n=l[t];if(!n)return;const a=d.find(r=>r.contractCode===n.contractCode);if(!a)return;const o=h(a,parseFloat(e)||0,n.lots);l[t]=o,y(),$()}function f(t,e){const n=document.querySelector(".status-dot"),a=document.getElementById("status-text");if(n&&(n.className=`status-dot ${t}`),a){const o=new Date,r=`${o.getHours().toString().padStart(2,"0")}:${o.getMinutes().toString().padStart(2,"0")}`;a.textContent=`${e} (${r})`}}function E(t){console.log(`
[Test] 測試股票代碼:`,t),t.forEach(e=>{const n=k(d,e);console.log(n?`  ✓ ${e}: ${n.contractName}`:`  ✗ ${e}: 找不到`)})}window.updateLots=H;window.updatePrice=j;document.addEventListener("DOMContentLoaded",async()=>{console.log("=".repeat(60)),console.log("股票期貨保證金查詢系統 v2.0 - TypeScript 模組化版本"),console.log("=".repeat(60)),A(),await F(),E(["2330","2383","6274"]),console.log(`
✓ 應用程式初始化完成！`)});window.testStockCodes=E;
