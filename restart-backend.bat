@echo off
title Restart Aplikasi Capstone
echo ==================================================
echo   Me-restart Backend & Frontend Capstone
echo ==================================================
echo.
echo [1/3] Menutup semua proses Node.js lama yang masih berjalan...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Menjalankan Backend baru di Port 5000...
start "Capstone - Backend" cmd /k "cd /d %~dp0Backend && npm start"
timeout /t 2 /nobreak >nul

echo [3/3] Menjalankan Frontend di Port 3000...
start "Capstone - Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ==================================================
echo Aplikasi berhasil di-restart dengan kode terbaru!
echo Tunggu 5-10 detik lalu refresh halaman browser Anda.
echo ==================================================
timeout /t 4
