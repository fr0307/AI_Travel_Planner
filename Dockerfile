# AI旅行规划器 - 统一多阶段构建Dockerfile
# 构建命令: docker build -t ai-travel-planner .
# 运行命令: docker run -d -p 80:80 ai-travel-planner

# 阶段1: 前端构建
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# 复制前端package文件
COPY frontend/package*.json ./

# 安装前端依赖（包括开发依赖用于构建）
RUN npm ci

# 复制前端源代码
COPY frontend/ .

# 构建前端应用（使用默认环境变量）
ARG VITE_APP_TITLE="AI旅行规划器"
ARG VITE_API_BASE_URL="/api"
ARG VITE_AMAP_API_KEY="dummy_amap_key"

RUN npm run build

# 阶段2: 后端构建
FROM node:18-alpine AS backend-build

WORKDIR /app/backend

# 复制后端package文件
COPY backend/package*.json ./

# 安装后端依赖（包括开发依赖用于构建）
RUN npm ci

# 复制后端源代码
COPY backend/ .

# 构建后端应用
RUN npm run build

# 复制后端.env文件到镜像中
COPY backend/.env ./

# 阶段3: 运行时
FROM node:18-alpine AS runtime

# 配置国内Alpine镜像源（腾讯云）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.cloud.tencent.com/g' /etc/apk/repositories

# 安装必要的工具
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash

WORKDIR /app

# 复制后端源代码和依赖文件
COPY --from=backend-build /app/backend ./backend/

# 安装后端生产依赖
WORKDIR /app/backend
RUN npm ci --only=production

# 复制前端静态文件到nginx目录
WORKDIR /app
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# 复制前端.env文件到镜像中
COPY frontend/.env ./frontend/

# 复制数据库初始化脚本
COPY docker/supabase_init.sql /app/database/supabase_init.sql

# 复制启动脚本
COPY docker/start.sh ./start.sh
RUN chmod +x ./start.sh

# 设置基本环境变量
ENV NODE_ENV=production
ENV PORT=3001

# API密钥相关环境变量（可在运行时通过-e注入）
ENV IFLYTEK_APP_ID=your_iflytek_app_id
ENV IFLYTEK_API_KEY=your_iflytek_api_key
ENV IFLYTEK_API_SECRET=your_iflytek_api_secret
ENV AMAP_API_KEY=your_amap_api_key
ENV AI_TRAVELER_OPENAI_API_KEY=your_openai_api_key
ENV OPENAI_BASE_URL=https://api.openai.com/v1
ENV OPENAI_MODEL=gpt-3.5-turbo

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# 启动应用
CMD ["/app/start.sh"]