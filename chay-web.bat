@echo off
chcp 65001 >nul
echo ========================================================
echo        HỆ THỐNG WEBSITE DU LỊCH - KHỞI CHẠY TỰ ĐỘNG
echo ========================================================
echo.
echo 1. Khởi động Backend API (Port 3000)...
start "Backend API - Port 3000" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak >nul

echo 2. Khởi động Giao diện Khách hàng (Frontend - Port 5173)...
start "Frontend Khách hàng" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 2 /nobreak >nul

echo 3. Khởi động Giao diện Quản trị viên (Frontend Admin - Port 5175)...
start "Frontend Admin - Port 5175" cmd /k "cd /d "%~dp0frontend-manh-admin" && npm run dev"

echo.
echo ========================================================
echo  Đã mở 3 cửa sổ dịch vụ thành công!
echo  - Khách hàng: http://localhost:5173
echo  - Quản trị:   http://localhost:5175
echo  - Backend:    http://localhost:3000
echo ========================================================
pause
