#!/bin/bash

# AI旅行规划器 - 统一启动脚本
# 简化版本：直接使用后端.env文件配置，移除数据库初始化

echo "🚀 启动AI旅行规划器..."

# 检查后端.env文件是否存在
echo "📝 检查后端配置文件..."
if [ ! -f "/app/backend/.env" ]; then
    echo "❌ 错误: 后端配置文件 /app/backend/.env 不存在"
    echo "请确保在构建镜像时已包含正确的后端.env文件"
    exit 1
fi

# 创建后端环境变量配置文件（包含从环境变量注入的API密钥）
echo "📝 生成后端运行时配置..."
cat > /app/backend/.env.runtime << EOL
# 从后端.env文件读取基础配置
$(cat /app/backend/.env)

# 从环境变量注入的API密钥配置
IFLYTEK_APP_ID=${IFLYTEK_APP_ID:-$(grep "^IFLYTEK_APP_ID=" /app/backend/.env | cut -d'=' -f2)}
IFLYTEK_API_KEY=${IFLYTEK_API_KEY:-$(grep "^IFLYTEK_API_KEY=" /app/backend/.env | cut -d'=' -f2)}
IFLYTEK_API_SECRET=${IFLYTEK_API_SECRET:-$(grep "^IFLYTEK_API_SECRET=" /app/backend/.env | cut -d'=' -f2)}
AMAP_API_KEY=${AMAP_API_KEY:-$(grep "^AMAP_API_KEY=" /app/backend/.env | cut -d'=' -f2)}
AI_TRAVELER_OPENAI_API_KEY=${AI_TRAVELER_OPENAI_API_KEY:-$(grep "^AI_TRAVELER_OPENAI_API_KEY=" /app/backend/.env | cut -d'=' -f2)}
OPENAI_BASE_URL=${OPENAI_BASE_URL:-$(grep "^OPENAI_BASE_URL=" /app/backend/.env | cut -d'=' -f2)}
OPENAI_MODEL=${OPENAI_MODEL:-$(grep "^OPENAI_MODEL=" /app/backend/.env | cut -d'=' -f2)}
EOL

# 使用运行时配置文件
cp /app/backend/.env.runtime /app/backend/.env

echo "✅ 后端配置生成完成"
echo "📊 数据库初始化由Supabase项目自动处理，跳过容器内初始化"

# 从前端.env文件读取配置并生成前端环境变量配置文件
echo "📝 生成前端环境配置..."
if [ -f "/app/frontend/.env" ]; then
    # 读取前端.env文件中的配置（使用默认值处理缺失的配置项）
    VITE_APP_TITLE=$(grep "^VITE_APP_TITLE=" /app/frontend/.env | cut -d'=' -f2)
    VITE_API_BASE_URL=$(grep "^VITE_API_BASE_URL=" /app/frontend/.env | cut -d'=' -f2)
    VITE_AMAP_API_KEY=$(grep "^VITE_AMAP_API_KEY=" /app/frontend/.env | cut -d'=' -f2)
    
    # 设置默认值（在Docker容器中，前端服务在3000端口，后端API在3001端口）
    VITE_APP_TITLE=${VITE_APP_TITLE:-AI旅行规划器}
    VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:3001/api}
    VITE_AMAP_API_KEY=${VITE_AMAP_API_KEY:-your_amap_api_key}
    
    cat > /app/frontend/dist/env-config.js << EOL
window._env_ = {
  APP_TITLE: "${VITE_APP_TITLE}",
  API_BASE_URL: "${VITE_API_BASE_URL}",
  AMAP_API_KEY: "${VITE_AMAP_API_KEY}",
  SUPABASE_URL: "https://szljdzjtpkhfhdwqhzqt.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bGpkemp0cGtoZmhkd3FoenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MDkxNzMsImV4cCI6MjA3Nzk4NTE3M30.da4mEKdWjbB_UmFclSKzfVyK6Q-pDxrpk7EJYJdMH4M"
};
EOL
    echo "✅ 前端环境配置生成成功"
else
    echo "⚠️  前端.env文件不存在，使用默认配置"
    cat > /app/frontend/dist/env-config.js << EOL
window._env_ = {
  APP_TITLE: "AI旅行规划器",
  API_BASE_URL: "http://localhost:3001/api",
  AMAP_API_KEY: "your_amap_api_key",
  SUPABASE_URL: "https://szljdzjtpkhfhdwqhzqt.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bGpkemp0cGtoZmhkd3FoenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MDkxNzMsImV4cCI6MjA3Nzk4NTE3M30.da4mEKdWjbB_UmFclSKzfVyK6Q-pDxrpk7EJYJdMH4M"
};
EOL
fi

# 启动后端API服务器
echo "🔧 启动后端API服务器..."
cd /app/backend
npm start &
BACKEND_PID=$!

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 10

# 检查后端服务状态
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 后端API服务启动成功"
else
    echo "❌ 后端API服务启动失败"
    exit 1
fi

# 启动前端静态文件服务（在3000端口）
echo "🌐 启动前端静态文件服务..."
cd /app/frontend/dist

# 使用Python3的HTTP服务器（如果可用）
if command -v python3 > /dev/null 2>&1; then
    python3 -m http.server 3000 --bind 0.0.0.0 &
    FRONTEND_PID=$!
    echo "✅ 前端服务启动成功（Python3 HTTP服务器）"
elif command -v python > /dev/null 2>&1; then
    python -m SimpleHTTPServer 3000 &
    FRONTEND_PID=$!
    echo "✅ 前端服务启动成功（Python HTTP服务器）"
else
    # 如果没有Python，使用Node.js的http-server
    if command -v npx > /dev/null 2>&1; then
        npx http-server -p 3000 -a 0.0.0.0 &
        FRONTEND_PID=$!
        echo "✅ 前端服务启动成功（Node.js http-server）"
    else
        echo "❌ 无法启动前端服务：未找到可用的HTTP服务器"
        echo "💡 请确保容器中安装了Python或Node.js的http-server"
        exit 1
    fi
fi

# 等待前端服务启动
echo "⏳ 等待前端服务启动..."
sleep 3

echo ""
echo "🎉 AI旅行规划器启动完成！"
echo "🌐 前端访问地址: http://localhost:3000"
echo "🔧 后端API地址: http://localhost:3001/api"
echo ""
echo "💡 使用说明:"
echo "- 访问 http://localhost:3000 使用应用"
echo "- 前端服务监听3000端口，后端API监听3001端口"
echo "- Supabase配置使用后端.env文件设置"
echo "- API密钥可通过环境变量注入（IFLYTEK_*, AMAP_API_KEY, AI_TRAVELER_*）"
echo ""

# 等待进程退出
wait $BACKEND_PID $FRONTEND_PID