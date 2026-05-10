/**
 * 保證金計算測試
 */

import { calculateMargin, calculateSummary, validateCalculationParams, formatMarginAmount } from '../src/logic/marginCalculator';
import { MarginItem, CalculationResult } from '../src/logic/types';

describe('calculateMargin', () => {
  test('should calculate stock futures margin correctly', () => {
    const item: MarginItem = {
      contractCode: 'TXF',
      contractName: '台積電期貨',
      stockCode: '2330',
      type: 'stock',
      lotSize: 2000,
      clearingRate: 13.5,
      maintenanceRate: 13.5,
      initialRate: 15.75,
    };
    
    const result = calculateMargin(item, 600, 1);
    
    expect(result.clearingMargin).toBe(162000); // 1 * 2000 * 600 * 0.135
    expect(result.maintenanceMargin).toBe(162000);
    expect(result.initialMargin).toBe(189000); // 1 * 2000 * 600 * 0.1575
    expect(result.lots).toBe(1);
    expect(result.price).toBe(600);
  });
  
  test('should calculate small contract margin correctly', () => {
    const item: MarginItem = {
      contractCode: 'STX',
      contractName: '台積電小型期貨',
      stockCode: '2330',
      type: 'stock',
      lotSize: 100,
      clearingRate: 13.5,
      maintenanceRate: 13.5,
      initialRate: 15.75,
    };
    
    const result = calculateMargin(item, 600, 10);
    
    expect(result.clearingMargin).toBe(81000); // 10 * 100 * 600 * 0.135
    expect(result.maintenanceMargin).toBe(81000);
    expect(result.initialMargin).toBe(94500); // 10 * 100 * 600 * 0.1575
  });
  
  test('should calculate ETF futures margin correctly', () => {
    const item: MarginItem = {
      contractCode: 'T5F',
      contractName: '元大台灣50 ETF期貨',
      stockCode: '0050',
      type: 'etf',
      lotSize: 1000,
      clearingFixed: 50000,
      maintenanceFixed: 50000,
      initialFixed: 58000,
    };
    
    const result = calculateMargin(item, 0, 2); // ETF 不需要股價
    
    expect(result.clearingMargin).toBe(100000); // 2 * 50000
    expect(result.maintenanceMargin).toBe(100000);
    expect(result.initialMargin).toBe(116000); // 2 * 58000
  });
  
  test('should round to integer', () => {
    const item: MarginItem = {
      contractCode: 'TEST',
      contractName: '測試期貨',
      stockCode: '0000',
      type: 'stock',
      lotSize: 2000,
      clearingRate: 13.333,
      maintenanceRate: 13.333,
      initialRate: 15.555,
    };
    
    const result = calculateMargin(item, 100, 1);
    
    // 2000 * 100 * 0.13333 = 26666
    expect(result.clearingMargin).toBe(26666);
    expect(result.maintenanceMargin).toBe(26666);
    // 2000 * 100 * 0.15555 = 31110
    expect(result.initialMargin).toBe(31110);
  });
});

describe('calculateSummary', () => {
  test('should sum multiple calculation results', () => {
    const results: CalculationResult[] = [
      {
        contractCode: 'TXF1',
        contractName: '台積電期貨',
        stockCode: '2330',
        lotSize: 2000,
        price: 600,
        lots: 1,
        clearingMargin: 162000,
        maintenanceMargin: 162000,
        initialMargin: 189000,
      },
      {
        contractCode: 'MTX',
        contractName: '聯發科期貨',
        stockCode: '2454',
        lotSize: 2000,
        price: 1000,
        lots: 1,
        clearingMargin: 270000,
        maintenanceMargin: 270000,
        initialMargin: 315000,
      },
    ];
    
    const summary = calculateSummary(results);
    
    expect(summary.totalClearing).toBe(432000);
    expect(summary.totalMaintenance).toBe(432000);
    expect(summary.totalInitial).toBe(504000);
    expect(summary.itemCount).toBe(2);
  });
  
  test('should handle empty results', () => {
    const summary = calculateSummary([]);
    
    expect(summary.totalClearing).toBe(0);
    expect(summary.totalMaintenance).toBe(0);
    expect(summary.totalInitial).toBe(0);
    expect(summary.itemCount).toBe(0);
  });
});

describe('validateCalculationParams', () => {
  test('should validate correct parameters', () => {
    const result = validateCalculationParams(600, 1);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
  
  test('should reject zero or negative price', () => {
    expect(validateCalculationParams(0, 1).valid).toBe(false);
    expect(validateCalculationParams(-100, 1).valid).toBe(false);
  });
  
  test('should reject zero or negative lots', () => {
    expect(validateCalculationParams(600, 0).valid).toBe(false);
    expect(validateCalculationParams(600, -1).valid).toBe(false);
  });
  
  test('should reject non-finite numbers', () => {
    expect(validateCalculationParams(Infinity, 1).valid).toBe(false);
    expect(validateCalculationParams(600, NaN).valid).toBe(false);
  });
});

describe('formatMarginAmount', () => {
  test('should format numbers with thousand separators', () => {
    expect(formatMarginAmount(162000)).toBe('162,000');
    expect(formatMarginAmount(1234567)).toBe('1,234,567');
  });
  
  test('should round decimals', () => {
    expect(formatMarginAmount(162000.7)).toBe('162,001');
    expect(formatMarginAmount(162000.4)).toBe('162,000');
  });
});
