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
TAIFEX_BASE_URL = "https://www.taifex.com.tw/cht/5/stockMarginingDown"
# 新的 TAIFEX 資料來源 (2026-05 更新)
# 注意：TAIFEX 已將所有資料合併到單一 CSV 檔案
CSV_URL = "https://www.taifex.com.tw/cht/5/stockMarginingDown"

# 舊的 URLs (已棄用 - 2026-05-05)
# CSV_URLS = {
#     "stock_futures_list": "https://www.taifex.com.tw/file/taifex/Dailydownload/DailydownloadCSV/StockFuturesList.csv",
#     "stock_margin": "https://www.taifex.com.tw/file/taifex/Dailydownload/DailydownloadCSV/StockFuturesMargin.csv",
#     "etf_margin": "https://www.taifex.com.tw/file/taifex/Dailydownload/DailydownloadCSV/ETFFuturesMargin.csv",
# }

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
    建立完整的保證金資料結構（2026-05 新版）
    從單一 CSV 檔案讀取所有資料
    
    Returns:
        dict: 完整的資料字典
    """
    log("=" * 60)
    log("開始下載期交所資料（新版 API）")
    log("=" * 60)
    
    # 下載單一 CSV 檔案
    log("\n[步驟 1/3] 下載保證金資料...")
    csv_content = download_csv(CSV_URL)
    
    # 解析 CSV（需要手動處理分段）
    log("\n[步驟 2/3] 解析 CSV 資料...")
    lines = csv_content.strip().split('\n')
    
    futures_list = []
    data_date = ""
    current_section = None
    csv_header = None
    stock_futures_count = 0
    etf_futures_count = 0
    
    for line in lines:
        # 跳過空行
        if not line.strip():
            continue
        
        # 識別區塊標題
        if line.startswith('一、股票期貨契約保證金一覽表'):
            log("✓ 找到股票期貨保證金區塊")
            continue
        elif line.startswith('(一) 標的證券為股票之股票期貨契約'):
            current_section = 'stock_futures'
            csv_header = None
            continue
        elif line.startswith('(二) 標的證券為受益憑證之股票期貨契約'):
            current_section = 'etf_futures'
            csv_header = None
            continue
        elif line.startswith('二、股票選擇權契約保證金一覽表'):
            log("✓ 跳過選擇權區塊")
            current_section = None
            continue
        elif line.startswith('更新日期:'):
            # 提取資料日期
            date_str = line.split(':')[1].strip()
            if not data_date:
                data_date = date_str.replace('/', '')
            continue
        elif line.startswith('序號,'):
            # CSV 標題行
            csv_header = line.split(',')
            continue
        
        # 處理資料行
        if current_section and csv_header:
            try:
                fields = line.split(',')
                if len(fields) < 5:
                    continue
                
                # 建立字典
                row = {csv_header[i]: fields[i].strip() if i < len(fields) else '' 
                       for i in range(len(csv_header))}
                
                if current_section == 'stock_futures':
                    # 處理股票期貨（比例制）
                    stock_code = row.get('股票期貨標的證券代號', '').strip()
                    if not stock_code:
                        continue
                    
                    contract_name = row.get('股票期貨中文簡稱', '').strip()
                    
                    # 解析保證金比例（移除 % 符號）
                    def parse_rate(value):
                        try:
                            return float(value.replace('%', '').strip() or '0')
                        except:
                            return 0.0
                    
                    future_item = {
                        'type': 'stock',
                        'contract': row.get('股票期貨英文代碼', '').strip(),
                        'contractCode': row.get('股票期貨英文代碼', '').strip(),
                        'contractName': contract_name,
                        'stockCode': stock_code,
                        'stockName': contract_name,
                        'underlying': row.get('股票期貨標的證券', '').strip().replace('"', ''),
                        'groupLevel': row.get('保證金所屬級距', '').strip(),
                        'clearingRate': parse_rate(row.get('結算保證金適用比例', '0')),
                        'maintenanceRate': parse_rate(row.get('維持保證金適用比例', '0')),
                        'initialRate': parse_rate(row.get('原始保證金適用比例', '0')),
                        'lotSize': detect_contract_size(contract_name),
                        'date': data_date,
                        '_hasMargin': True
                    }
                    
                    futures_list.append(future_item)
                    stock_futures_count += 1
                    
                elif current_section == 'etf_futures':
                    # 處理 ETF 期貨（固定金額制）
                    stock_code = row.get('股票期貨標的證券代號', '').strip()
                    if not stock_code:
                        continue
                    
                    contract_name = row.get('股票期貨中文簡稱', '').strip()
                    
                    # 解析保證金金額（移除千分位）
                    def parse_amount(value):
                        try:
                            return float(value.replace(',', '').strip() or '0')
                        except:
                            return 0.0
                    
                    future_item = {
                        'type': 'etf',
                        'contract': row.get('股票期貨英文代碼', '').strip(),
                        'contractCode': row.get('股票期貨英文代碼', '').strip(),
                        'contractName': contract_name,
                        'stockCode': stock_code,
                        'stockName': contract_name,
                        'underlying': row.get('股票期貨標的證券', '').strip(),
                        'groupLevel': '',
                        'clearingFixed': parse_amount(row.get('結算保證金', '0')),
                        'maintenanceFixed': parse_amount(row.get('維持保證金', '0')),
                        'initialFixed': parse_amount(row.get('原始保證金', '0')),
                        'lotSize': 1000,  # ETF 期貨每口 1000 單位
                        'date': data_date,
                        '_hasMargin': True
                    }
                    
                    futures_list.append(future_item)
                    etf_futures_count += 1
                    
            except Exception as e:
                log(f"✗ 解析資料行錯誤: {e}", "WARN")
                continue
    
    log(f"✓ 股票期貨：{stock_futures_count} 筆")
    log(f"✓ ETF 期貨：{etf_futures_count} 筆")
    
    # 組裝最終輸出
    output_data = {
        'last_updated': datetime.now().isoformat(),
        'data_date': data_date,
        'total_count': len(futures_list),
        'futures': futures_list
    }
    
    log(f"\n[步驟 3/3] 資料處理完成：共 {len(futures_list)} 筆期貨資料")
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
