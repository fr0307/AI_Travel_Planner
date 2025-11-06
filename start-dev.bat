@echo off
title AI旅行规划器 - 开发环境

echo ========================================
echo    AI旅行规划器 - 开发环境启动脚本
echo ========================================
echo.

echo 1. 检查依赖安装...

REM 检查前端依赖
if not exist "frontend\node_modules" (
    echo 前端依赖未安装，请先运行 frontend\install.bat
    pause
    exit /b 1
)

REM 检查后端依赖
if not exist "backend\node_modules" (
    echo 后端依赖未安装，请先运行 backend\install.bat
    pause
    exit /b 1
)

echo 依赖检查通过！
echo.

echo 2. 启动后端服务器...
start "后端服务器" cmd /k "cd backend && npm run dev"

echo 等待后端服务器启动...
timeout /t 3 /nobreak > nul

echo 3. 启动前端开发服务器...
start "前端开发服务器" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   开发环境启动完成！
echo ========================================
echo.
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo.
echo 按任意键关闭此窗口...
pause > nul