@echo off
chcp 65001 >nul
title 引力博客 - 构建静态网站
echo ========================================================
echo               正在构建「引力」博客静态网站
echo ========================================================
echo.
call npx pnpm docs:build
echo.
echo 构建完成！输出目录位于: docs/.vuepress/dist
echo.
pause
