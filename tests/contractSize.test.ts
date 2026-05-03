/**
 * 合約規格識別測試
 * 測試 identifyContractSize 函數
 */

import { identifyContractSize, isSmallContract, contractSizeTests } from '../src/logic/contractSize';

describe('identifyContractSize', () => {
  // 使用預定義的測試案例
  contractSizeTests.forEach(({ input, type, expected }) => {
    test(`should return ${expected} for "${input}" (type: ${type})`, () => {
      expect(identifyContractSize(input, type)).toBe(expected);
    });
  });
  
  // 額外的邊界測試
  test('should handle whitespace', () => {
    expect(identifyContractSize('  小型台積電期貨  ', 'stock')).toBe(100);
  });
  
  test('should be case sensitive for Chinese characters', () => {
    expect(identifyContractSize('小型期貨', 'stock')).toBe(100);
  });
});

describe('isSmallContract', () => {
  test('should return true for contracts containing "小型"', () => {
    expect(isSmallContract('台積電小型期貨')).toBe(true);
    expect(isSmallContract('小型聯發科期貨')).toBe(true);
  });
  
  test('should return false for standard contracts', () => {
    expect(isSmallContract('台積電期貨')).toBe(false);
    expect(isSmallContract('鴻海期貨')).toBe(false);
  });
  
  test('should handle null and undefined', () => {
    expect(isSmallContract(null)).toBe(false);
    expect(isSmallContract(undefined)).toBe(false);
  });
});
