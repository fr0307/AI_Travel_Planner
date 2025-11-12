#!/bin/bash

# AI旅行规划器 - 统一启动脚本
# 处理环境变量注入、数据库初始化和服务启动

echo "🚀 启动AI旅行规划器..."

# 检查必需的环境变量
if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "your_supabase_project_url" ]; then
    echo "❌ 错误: 必须设置SUPABASE_URL环境变量"
    echo "请使用: docker run -e SUPABASE_URL=your_supabase_url ..."
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ "$SUPABASE_SERVICE_ROLE_KEY" = "your_supabase_service_role_key" ]; then
    echo "❌ 错误: 必须设置SUPABASE_SERVICE_ROLE_KEY环境变量"
    echo "请使用: docker run -e SUPABASE_SERVICE_ROLE_KEY=your_service_key ..."
    exit 1
fi

# 创建前端环境变量配置文件
echo "📝 生成前端环境配置..."
cat > /app/frontend/dist/env-config.js << EOL
window._env_ = {
  APP_TITLE: "${VITE_APP_TITLE:-AI旅行规划器}",
  API_BASE_URL: "/api",
  AMAP_API_KEY: "${AMAP_API_KEY:-your_amap_api_key}",
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY:-your_supabase_anon_key}"
};
EOL

# 创建后端环境变量配置文件
echo "📝 生成后端环境配置..."
cat > /app/backend/.env << EOL
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-your_supabase_anon_key}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
IFLYTEK_APP_ID=${IFLYTEK_APP_ID:-your_iflytek_app_id}
IFLYTEK_API_KEY=${IFLYTEK_API_KEY:-your_iflytek_api_key}
IFLYTEK_API_SECRET=${IFLYTEK_API_SECRET:-your_iflytek_api_secret}
AMAP_API_KEY=${AMAP_API_KEY:-your_amap_api_key}
AI_TRAVELER_OPENAI_API_KEY=${AI_TRAVELER_OPENAI_API_KEY:-your_openai_api_key}
OPENAI_BASE_URL=${OPENAI_BASE_URL:-https://api.openai.com/v1}
OPENAI_MODEL=${OPENAI_MODEL:-gpt-3.5-turbo}
JWT_SECRET=${JWT_SECRET:-your_jwt_secret_key_here}
JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-7d}
LOG_LEVEL=${LOG_LEVEL:-info}
EOL

# 数据库初始化检查
echo "🗄️  检查数据库初始化..."

# 提取数据库连接信息
DB_URL=$(echo "$SUPABASE_URL" | sed 's|postgres://||')
DB_USER=$(echo "$DB_URL" | cut -d':' -f1)
DB_PASS=$(echo "$DB_URL" | cut -d'@' -f1 | cut -d':' -f2)
DB_HOST=$(echo "$DB_URL" | cut -d'@' -f2 | cut -d':' -f1)
DB_PORT=$(echo "$DB_URL" | cut -d'@' -f2 | cut -d':' -f2 | cut -d'/' -f1)
DB_NAME=$(echo "$DB_URL" | cut -d'/' -f2)

# 检查数据库连接和表是否存在
echo "🔍 检查数据库连接..."
if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ 数据库连接成功"
    
    # 检查用户表是否存在
    if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');" | grep -q "t"; then
        echo "✅ 数据库表已存在，跳过初始化"
    else
        echo "📊 初始化数据库表结构..."
        
        # 执行数据库初始化脚本
        if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /app/database/supabase_init.sql; then
            echo "✅ 数据库初始化成功"
        else
            echo "⚠️  数据库初始化失败，但继续启动..."
        fi
    fi
else
    echo "⚠️  数据库连接失败，跳过初始化（请检查Supabase配置）"
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
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ 后端API服务启动成功"
else
    echo "❌ 后端API服务启动失败"
    exit 1
fi

# 启动Nginx作为统一入口
echo "🌐 启动Nginx代理服务器..."
nginx -c /app/docker/nginx.conf &
NGINX_PID=$!

# 等待Nginx启动
sleep 5

# 检查Nginx服务状态
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Nginx服务启动成功"
else
    echo "❌ Nginx服务启动失败"
    exit 1
fi

echo ""
echo "🎉 AI旅行规划器启动完成！"
echo "🌐 访问地址: http://localhost"
echo "🔧 API地址: http://localhost/api"
echo ""
echo "💡 使用说明:"
echo "- 访问 http://localhost 使用应用"
echo "- 确保Supabase项目已正确配置"
echo "- 如需修改配置，重启容器并设置新的环境变量"
echo ""

# 等待进程退出
wait $NGINX_PID $BACKEND_PID