@echo off
chcp 65001 >nul
title 织网博客 - 本地预览
echo ========================================================
echo               正在启动「织网」博客本地预览
echo ========================================================
echo.
echo 预览服务器地址: http://localhost:8080
echo 提示: 请确保已执行过 build.bat 进行构建
echo.
call npx pnpm docs:preview
pause
