/**
 * 冷卻機制管理
 * 防止用戶過於頻繁地更新資料
 */

const COOLDOWN_KEYS = {
  MARGIN_UPDATE: 'last_margin_update',
  PRICE_UPDATE: 'last_price_update',
};

const COOLDOWN_DURATIONS = {
  MARGIN: 60 * 1000,       // 1 分鐘
  PRICE: 60 * 1000,        // 1 分鐘
};

/**
 * 設置冷卻時間
 */
export function setCooldown(key: string, timestamp: number = Date.now()): void {
  localStorage.setItem(key, timestamp.toString());
}

/**
 * 獲取上次更新時間
 */
export function getLastUpdateTime(key: string): number | null {
  const value = localStorage.getItem(key);
  return value ? parseInt(value, 10) : null;
}

/**
 * 獲取剩餘冷卻時間（毫秒）
 */
export function getRemainingCooldown(key: string, durationMs: number): number {
  const lastUpdate = getLastUpdateTime(key);
  if (!lastUpdate) return 0;
  
  const elapsed = Date.now() - lastUpdate;
  const remaining = durationMs - elapsed;
  
  return remaining > 0 ? remaining : 0;
}

/**
 * 檢查是否在冷卻中
 */
export function isCoolingDown(key: string, durationMs: number): boolean {
  return getRemainingCooldown(key, durationMs) > 0;
}

/**
 * 格式化剩餘時間為可讀字串
 * @returns 例如："59分鐘"、"30秒"
 */
export function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  
  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return minutes > 0 ? `${hours}小時${minutes}分鐘` : `${hours}小時`;
  } else if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分鐘`;
  } else {
    return `${totalSeconds}秒`;
  }
}

/**
 * 檢查保證金更新冷卻
 */
export function checkMarginUpdateCooldown(): {
  canUpdate: boolean;
  remaining: number;
  message?: string;
} {
  const remaining = getRemainingCooldown(COOLDOWN_KEYS.MARGIN_UPDATE, COOLDOWN_DURATIONS.MARGIN);
  
  if (remaining > 0) {
    return {
      canUpdate: false,
      remaining,
      message: `請稍候 ${formatRemainingTime(remaining)} 後再更新`,
    };
  }
  
  return { canUpdate: true, remaining: 0 };
}

/**
 * 檢查股價更新冷卻
 */
export function checkPriceUpdateCooldown(): {
  canUpdate: boolean;
  remaining: number;
  message?: string;
} {
  const remaining = getRemainingCooldown(COOLDOWN_KEYS.PRICE_UPDATE, COOLDOWN_DURATIONS.PRICE);
  
  if (remaining > 0) {
    return {
      canUpdate: false,
      remaining,
      message: `請稍候 ${formatRemainingTime(remaining)} 後再更新`,
    };
  }
  
  return { canUpdate: true, remaining: 0 };
}

/**
 * 設置保證金更新時間
 */
export function setMarginUpdateTime(): void {
  setCooldown(COOLDOWN_KEYS.MARGIN_UPDATE);
}

/**
 * 設置股價更新時間
 */
export function setPriceUpdateTime(): void {
  setCooldown(COOLDOWN_KEYS.PRICE_UPDATE);
}

export { COOLDOWN_KEYS, COOLDOWN_DURATIONS };
