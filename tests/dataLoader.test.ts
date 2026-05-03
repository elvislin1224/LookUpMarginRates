/**
 * 資料載入測試
 */

import { searchFutures, findByStockCode, normalizeMarginData, isDataFresh } from '../src/logic/dataLoader';
import { MarginItem } from '../src/logic/types';

describe('searchFutures', () => {
  const mockData: MarginItem[] = [
    {
      contractCode: 'TXF',
      contractName: '台積電期貨',
      stockCode: '2330',
      stockName: '台積電',
      type: 'stock',
      lotSize: 2000,
      clearingRate: 0.135,
      maintenanceRate: 0.135,
      initialRate: 0.1575,
    },
    {
      contractCode: 'STX',
      contractName: '台積電小型期貨',
      stockCode: '2330',
      stockName: '台積電',
      type: 'stock',
      lotSize: 100,
      clearingRate: 0.135,
      maintenanceRate: 0.135,
      initialRate: 0.1575,
    },
    {
      contractCode: 'MTX',
      contractName: '聯發科期貨',
      stockCode: '2454',
      stockName: '聯發科',
      type: 'stock',
      lotSize: 2000,
      clearingRate: 0.135,
      maintenanceRate: 0.135,
      initialRate: 0.1575,
    },
  ];
  
  test('should find by exact stock code', () => {
    const results = searchFutures(mockData, '2330');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].relevance).toBe(100);
    expect(results[0].item.stockCode).toBe('2330');
  });
  
  test('should find by partial stock code', () => {
    const results = searchFutures(mockData, '23');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.stockCode).toBe('2330');
  });
  
  test('should find by contract name', () => {
    const results = searchFutures(mockData, '聯發科');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.contractName).toContain('聯發科');
  });
  
  test('should return empty array for empty query', () => {
    expect(searchFutures(mockData, '').length).toBe(0);
    expect(searchFutures(mockData, '   ').length).toBe(0);
  });
  
  test('should limit results', () => {
    const results = searchFutures(mockData, '2', 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });
});

describe('findByStockCode', () => {
  const mockData: MarginItem[] = [
    {
      contractCode: 'TXF',
      contractName: '台積電期貨',
      stockCode: '2330',
      type: 'stock',
      lotSize: 2000,
    },
  ];
  
  test('should find item by stock code', () => {
    const item = findByStockCode(mockData, '2330');
    expect(item).toBeDefined();
    expect(item?.stockCode).toBe('2330');
  });
  
  test('should return undefined for non-existent code', () => {
    const item = findByStockCode(mockData, '9999');
    expect(item).toBeUndefined();
  });
});

describe('normalizeMarginData', () => {
  test('should auto-detect lotSize for missing values', () => {
    const items: MarginItem[] = [
      {
        contractCode: 'TXF',
        contractName: '台積電期貨',
        stockCode: '2330',
        type: 'stock',
        lotSize: 0, // 缺失
      },
      {
        contractCode: 'STX',
        contractName: '台積電小型期貨',
        stockCode: '2330',
        type: 'stock',
        lotSize: 0, // 缺失
      },
    ];
    
    const normalized = normalizeMarginData(items);
    
    expect(normalized[0].lotSize).toBe(2000);
    expect(normalized[1].lotSize).toBe(100);
  });
  
  test('should preserve existing lotSize', () => {
    const items: MarginItem[] = [
      {
        contractCode: 'TXF',
        contractName: '台積電期貨',
        stockCode: '2330',
        type: 'stock',
        lotSize: 2000,
      },
    ];
    
    const normalized = normalizeMarginData(items);
    expect(normalized[0].lotSize).toBe(2000);
  });
});

describe('isDataFresh', () => {
  test('should return true for fresh data (within 24 hours)', () => {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    expect(isDataFresh(twelveHoursAgo.toISOString(), 24)).toBe(true);
  });
  
  test('should return false for stale data (over 24 hours)', () => {
    const now = new Date();
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(isDataFresh(twentyFiveHoursAgo.toISOString(), 24)).toBe(false);
  });
  
  test('should handle custom max age', () => {
    const now = new Date();
    const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
    expect(isDataFresh(tenHoursAgo.toISOString(), 8)).toBe(false);
    expect(isDataFresh(tenHoursAgo.toISOString(), 12)).toBe(true);
  });
});
