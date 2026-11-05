@echo off
title Capstone Launcher
echo ==================================================
echo   Menjalankan Aplikasi Capstone
echo ==================================================
echo.
echo Pastikan Laragon (MySQL) sudah dalam status "Start All".
echo.

echo [1/2] Menjalankan Backend (Port 5000)...
start "Capstone - Backend" cmd /k "cd /d %~dp0Backend && npm start"

echo [2/2] Menjalankan Frontend (Port 3000)...
start "Capstone - Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ==================================================
echo Aplikasi berhasil dijalankan!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo ==================================================
echo Anda dapat menutup jendela launcher ini.
ping 127.0.0.1 -n 5 > nul
