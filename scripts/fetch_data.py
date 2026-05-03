#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
台灣期交所股票期貨保證金資料下載與解析腳本
從官方 CSV 下載資料並轉換為 JSON 格式
"""

import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import time

# 常數定義
TAIFEX_BASE_URL = "https://www.taifex.com.tw/cht/3/futuresDataDown"
CSV_URLS = {
    "stock_futures_list": "https://www.taifex.com.tw/file/taifex/Dailydownload/DailydownloadCSV/StockFuturesList.csv",
    "stock_margin": "https://www.taifex.com.tw/file/taifex/Dailydownload/DailydownloadCSV/StockFuturesMargin.csv",
    "etf_margin": "https://www.taifex.com.tw/file/taifex/Dailydownload/DailydownloadCSV/ETFFuturesMargin.csv",
}

# 檔案路徑
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_FILE = DATA_DIR / "margin_data.json"

# 建立資料目錄
DATA_DIR.mkdir(exist_ok=True)


def log(message, level="INFO"):
    """輸出日誌訊息"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def download_csv(url, retries=3, delay=2):
    """
    下載 CSV 檔案
    
    Args:
        url: CSV 檔案網址
        retries: 重試次數
        delay: 重試延遲秒數
    
    Returns:
        str: CSV 檔案內容
    """
    for attempt in range(1, retries + 1):
        try:
            log(f"下載 CSV: {url} (嘗試 {attempt}/{retries})")
            
            # 設定 User-Agent 避免被封鎖
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            req = Request(url, headers=headers)
            
            with urlopen(req, timeout=15) as response:
                # 期交所 CSV 通常是 Big5 編碼
                content = response.read().decode('big5', errors='ignore')
                log(f"✓ 下載成功：{len(content)} 字元")
                return content
                
        except HTTPError as e:
            log(f"✗ HTTP 錯誤 {e.code}: {e.reason}", "ERROR")
            if attempt < retries:
                log(f"等待 {delay} 秒後重試...", "WARN")
                time.sleep(delay)
        except URLError as e:
            log(f"✗ 網路錯誤: {e.reason}", "ERROR")
            if attempt < retries:
                log(f"等待 {delay} 秒後重試...", "WARN")
                time.sleep(delay)
        except Exception as e:
            log(f"✗ 未預期錯誤: {str(e)}", "ERROR")
            if attempt < retries:
                time.sleep(delay)
    
    raise Exception(f"下載失敗：{url}")


def parse_csv_content(content):
    """
    解析 CSV 內容
    
    Args:
        content: CSV 字串內容
    
    Returns:
        list: 解析後的資料列表（每列為字典）
    """
    lines = content.strip().split('\n')
    if not lines:
        return []
    
    # 使用 csv.DictReader 解析
    reader = csv.DictReader(lines)
    data = []
    
    for row in reader:
        # 過濾空列
        if any(row.values()):
            data.append(dict(row))
    
    return data


def detect_contract_size(contract_name):
    """
    根據合約名稱自動判斷合約規格
    
    Args:
        contract_name: 合約名稱
    
    Returns:
        int: 每口股數 (100 或 2000)
    """
    if not contract_name:
        return 2000
    return 100 if "小型" in contract_name else 2000


def build_margin_data():
    """
    建立完整的保證金資料結構
    
    Returns:
        dict: 完整的資料字典
    """
    log("=" * 60)
    log("開始下載期交所資料")
    log("=" * 60)
    
    # 下載三個 CSV 檔案
    log("\n[步驟 1/4] 下載股票期貨清單...")
    stock_futures_list_csv = download_csv(CSV_URLS["stock_futures_list"])
    
    log("\n[步驟 2/4] 下載股票期貨保證金...")
    stock_margin_csv = download_csv(CSV_URLS["stock_margin"])
    
    log("\n[步驟 3/4] 下載 ETF 期貨保證金...")
    etf_margin_csv = download_csv(CSV_URLS["etf_margin"])
    
    # 解析 CSV
    log("\n[步驟 4/4] 解析 CSV 資料...")
    stock_futures_list = parse_csv_content(stock_futures_list_csv)
    stock_margin_data = parse_csv_content(stock_margin_csv)
    etf_margin_data = parse_csv_content(etf_margin_csv)
    
    log(f"✓ 股票期貨清單：{len(stock_futures_list)} 筆")
    log(f"✓ 股票期貨保證金：{len(stock_margin_data)} 筆")
    log(f"✓ ETF 期貨保證金：{len(etf_margin_data)} 筆")
    
    # 建立保證金映射表
    margin_map = {}
    data_date = ""
    
    # 處理股票期貨保證金（比例制）
    for item in stock_margin_data:
        try:
            stock_code = item.get('標的證券代號', '').strip()
            if not stock_code:
                continue
            
            contract_name = item.get('契約名稱', '').strip()
            
            margin_map[stock_code] = {
                'type': 'stock',
                'contractCode': item.get('契約代號', '').strip(),
                'contractName': contract_name,
                'stockCode': stock_code,
                'groupLevel': item.get('保證金級距', '').strip(),
                'clearingRate': float(item.get('結算保證金適用比例', '0').strip() or '0'),
                'maintenanceRate': float(item.get('維持保證金適用比例', '0').strip() or '0'),
                'initialRate': float(item.get('原始保證金適用比例', '0').strip() or '0'),
                'lotSize': detect_contract_size(contract_name),
                'date': item.get('資料日期', '').strip()
            }
            
            # 記錄資料日期
            if not data_date and margin_map[stock_code]['date']:
                data_date = margin_map[stock_code]['date']
                
        except (ValueError, KeyError) as e:
            log(f"✗ 解析股票期貨資料錯誤: {e}", "WARN")
            continue
    
    # 處理 ETF 期貨保證金（固定金額制）
    for item in etf_margin_data:
        try:
            stock_code = item.get('標的證券代號', '').strip()
            if not stock_code:
                continue
            
            contract_name = item.get('契約名稱', '').strip()
            
            # 移除千分位符號並轉換為數值
            clearing_str = item.get('結算保證金', '0').strip().replace(',', '')
            maintenance_str = item.get('維持保證金', '0').strip().replace(',', '')
            initial_str = item.get('原始保證金', '0').strip().replace(',', '')
            
            margin_map[stock_code] = {
                'type': 'etf',
                'contractCode': item.get('契約代號', '').strip(),
                'contractName': contract_name,
                'stockCode': stock_code,
                'groupLevel': '',
                'clearingFixed': float(clearing_str or '0'),
                'maintenanceFixed': float(maintenance_str or '0'),
                'initialFixed': float(initial_str or '0'),
                'lotSize': 1000,  # ETF 期貨每口 1000 單位
                'date': item.get('資料日期', '').strip()
            }
            
            if not data_date and margin_map[stock_code]['date']:
                data_date = margin_map[stock_code]['date']
                
        except (ValueError, KeyError) as e:
            log(f"✗ 解析 ETF 期貨資料錯誤: {e}", "WARN")
            continue
    
    # 建立完整的期貨清單（包含保證金資訊）
    futures_list = []
    
    for item in stock_futures_list:
        try:
            stock_code = item.get('標的證券代號', '').strip()
            contract_code = item.get('期貨契約代號', '').strip()
            
            if not stock_code and not contract_code:
                continue
            
            # 從保證金資料中匹配
            margin_info = margin_map.get(stock_code) or margin_map.get(contract_code)
            
            future_item = {
                'contract': contract_code,
                'stockCode': stock_code,
                'stockName': item.get('標的證券簡稱', '').strip(),
                'underlying': item.get('標的證券名稱', '').strip(),
                'securityType': item.get('標的證券種類', '').strip(),
                '_hasMargin': bool(margin_info)
            }
            
            # 合併保證金資訊
            if margin_info:
                future_item.update(margin_info)
            
            futures_list.append(future_item)
            
        except Exception as e:
            log(f"✗ 建立期貨清單錯誤: {e}", "WARN")
            continue
    
    # 組裝最終輸出
    output_data = {
        'last_updated': datetime.now().isoformat(),
        'data_date': data_date,
        'total_count': len(futures_list),
        'futures': futures_list
    }
    
    log(f"\n✓ 資料處理完成：共 {len(futures_list)} 筆期貨資料")
    log(f"✓ 資料日期：{data_date}")
    
    return output_data


def save_json(data, output_path):
    """
    儲存 JSON 檔案
    
    Args:
        data: 要儲存的資料
        output_path: 輸出檔案路徑
    """
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        file_size = os.path.getsize(output_path)
        log(f"✓ JSON 已儲存：{output_path}")
        log(f"✓ 檔案大小：{file_size:,} bytes")
        
    except Exception as e:
        log(f"✗ 儲存 JSON 失敗: {e}", "ERROR")
        raise


def main():
    """主程式"""
    try:
        start_time = time.time()
        
        # 建立資料
        margin_data = build_margin_data()
        
        # 儲存 JSON
        log("\n" + "=" * 60)
        log("儲存資料")
        log("=" * 60)
        save_json(margin_data, OUTPUT_FILE)
        
        elapsed_time = time.time() - start_time
        log("\n" + "=" * 60)
        log(f"✓ 執行完成！耗時：{elapsed_time:.2f} 秒")
        log("=" * 60)
        
        return 0
        
    except Exception as e:
        log(f"\n✗ 執行失敗: {str(e)}", "ERROR")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
