@echo off
echo ============================================
echo 台灣期交所保證金資料下載腳本
echo ============================================
echo.

REM 嘗試使用 py 命令
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 py 命令執行...
    py scripts\fetch_data.py
    goto :end
)

REM 嘗試使用 python3
python3 --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 python3 命令執行...
    python3 scripts\fetch_data.py
    goto :end
)

REM 嘗試使用 python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 python 命令執行...
    python scripts\fetch_data.py
    goto :end
)

echo.
echo [錯誤] 找不到 Python！
echo 請確認已安裝 Python 3.6 或更新版本。
echo 下載連結：https://www.python.org/downloads/
echo.
pause
exit /b 1

:end
echo.
echo ============================================
echo 執行完成！
echo ============================================
pause
