@echo off
echo 正在安装前端项目依赖...
cd /d "%~dp0"

if not exist "node_modules" (
    echo 安装依赖包...
    npm install
    if errorlevel 1 (
        echo 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo 依赖安装成功！
) else (
    echo 依赖已存在，跳过安装
)

echo 前端项目依赖安装完成！
pause