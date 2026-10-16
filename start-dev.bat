@echo off
chcp 65001 >nul
title 引力博客 - 启动开发服务器
echo ========================================================
echo               正在启动「引力」博客开发服务器
echo ========================================================
echo.
echo 访问地址: http://localhost:8080
echo.
call npx pnpm docs:dev
pause
