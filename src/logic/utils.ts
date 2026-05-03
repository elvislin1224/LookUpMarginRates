/**
 * 通用工具函數
 */

/**
 * 格式化數字（加入千分位逗號）
 */
export function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('zh-TW');
}

/**
 * 格式化百分比
 */
export function formatPercentage(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * 防抖函數
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Toast 通知系統
 */
export class ToastManager {
  private container: HTMLElement | null = null;
  
  constructor() {
    this.ensureContainer();
  }
  
  private ensureContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }
    this.container = container;
  }
  
  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    this.ensureContainer();
    if (!this.container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      background: ${type === 'success' ? '#3fb950' : type === 'error' ? '#f85149' : '#58a6ff'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
}

/**
 * 載入狀態管理
 */
export class LoadingManager {
  private overlay: HTMLElement | null = null;
  
  show(message = '載入中...') {
    if (this.overlay) return;
    
    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-overlay';
    this.overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      ">
        <div style="
          background: #161b22;
          padding: 30px 40px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        ">
          <div style="
            width: 40px;
            height: 40px;
            border: 4px solid #30363d;
            border-top-color: #58a6ff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
          "></div>
          <div style="color: #e6edf3; font-size: 16px;">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
  }
  
  hide() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

/**
 * 本地存儲管理
 */
export class StorageManager {
  private prefix = 'margin_app_';
  
  set(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('儲存資料失敗:', error);
    }
  }
  
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('讀取資料失敗:', error);
      return null;
    }
  }
  
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}
