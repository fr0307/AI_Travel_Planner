# AI Travel Planner API 文档

## 概述

AI Travel Planner 是一个智能旅行规划平台，提供用户认证、行程管理、AI智能规划等功能。

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token
- **数据格式**: JSON

## 认证

所有需要认证的API需要在请求头中包含 `Authorization: Bearer <token>`

### 用户注册

**POST** `/api/auth/register`

注册新用户

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}
```

**响应:**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "jwt-token"
  }
}
```

### 用户登录

**POST** `/api/auth/login`

用户登录

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "jwt-token"
  }
}
```

### 获取当前用户信息

**GET** `/api/auth/me`

获取当前登录用户信息

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "username": "username",
      "avatar": "avatar-url",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 用户登出

**POST** `/api/auth/logout`

用户登出

## 行程管理

### 获取行程列表

**GET** `/api/trips`

获取用户的所有行程

**查询参数:**
- `page` (可选): 页码，默认1
- `limit` (可选): 每页数量，默认10

**响应:**
```json
{
  "success": true,
  "data": {
    "trips": [
      {
        "id": "trip-id",
        "user_id": "user-id",
        "title": "北京文化之旅",
        "destination": "北京",
        "start_date": "2024-01-15T00:00:00Z",
        "end_date": "2024-01-18T00:00:00Z",
        "budget": 5000,
        "travelers_count": 2,
        "preferences": {},
        "status": "completed",
        "created_at": "2024-01-10T10:00:00Z",
        "updated_at": "2024-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 获取行程详情

**GET** `/api/trips/:id`

获取单个行程的详细信息

**响应:**
```json
{
  "success": true,
  "data": {
    "trip": {
      "id": "trip-id",
      "user_id": "user-id",
      "title": "北京文化之旅",
      "destination": "北京",
      "start_date": "2024-01-15T00:00:00Z",
      "end_date": "2024-01-18T00:00:00Z",
      "budget": 5000,
      "travelers_count": 2,
      "preferences": {},
      "status": "completed",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z",
      "trip_days": [
        {
          "id": "day-id",
          "trip_id": "trip-id",
          "day_number": 1,
          "date": "2024-01-15T00:00:00Z",
          "budget": 1200,
          "trip_day_items": [
            {
              "id": "item-id",
              "trip_day_id": "day-id",
              "time_period": "morning",
              "activity": "天安门广场参观",
              "description": "参观天安门广场",
              "location": "天安门广场",
              "estimated_cost": 0,
              "order_index": 1
            }
          ]
        }
      ]
    }
  }
}
```

### 创建新行程

**POST** `/api/trips`

创建新的行程

**请求体:**
```json
{
  "title": "北京文化之旅",
  "destination": "北京",
  "start_date": "2024-01-15",
  "end_date": "2024-01-18",
  "budget": 5000,
  "travelers_count": 2,
  "preferences": {
    "interests": ["history", "food"]
  }
}
```

**响应:**
```json
{
  "success": true,
  "message": "行程创建成功",
  "data": {
    "trip": {
      "id": "trip-id",
      "user_id": "user-id",
      "title": "北京文化之旅",
      "destination": "北京",
      "start_date": "2024-01-15T00:00:00Z",
      "end_date": "2024-01-18T00:00:00Z",
      "budget": 5000,
      "travelers_count": 2,
      "preferences": {
        "interests": ["history", "food"]
      },
      "status": "draft",
      "created_at": "2024-01-10T10:00:00Z",
      "updated_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

### 更新行程

**PUT** `/api/trips/:id`

更新行程信息

**请求体:**
```json
{
  "title": "更新后的标题",
  "budget": 6000,
  "status": "active"
}
```

**响应:**
```json
{
  "success": true,
  "message": "行程更新成功",
  "data": {
    "trip": {
      "id": "trip-id",
      "title": "更新后的标题",
      "budget": 6000,
      "status": "active",
      "updated_at": "2024-01-11T10:00:00Z"
    }
  }
}
```

### 删除行程

**DELETE** `/api/trips/:id`

删除行程

**响应:**
```json
{
  "success": true,
  "message": "行程删除成功"
}
```

## AI智能规划

### AI行程规划

**POST** `/api/ai/plan-trip`

使用AI生成智能行程规划

**请求体:**
```json
{
  "destination": "北京",
  "start_date": "2024-01-15",
  "end_date": "2024-01-18",
  "budget": 5000,
  "travelers_count": 2,
  "preferences": {
    "pace": "moderate",
    "accommodation": "hotel"
  },
  "interests": ["history", "food", "culture"]
}
```

**响应:**
```json
{
  "success": true,
  "message": "AI行程规划生成成功",
  "data": {
    "plan": {
      "id": "plan-id",
      "title": "北京 2024-01-15 - 2024-01-18 行程",
      "destination": "北京",
      "duration_days": 4,
      "budget": 5000,
      "summary": "为您规划的北京 5000元预算行程",
      "days": [
        {
          "day": 1,
          "date": "2024-01-15",
          "morning": ["天安门广场参观", "故宫博物院游览"],
          "afternoon": ["王府井午餐", "景山公园观景"],
          "evening": ["全聚德烤鸭晚餐", "前门大街夜景"],
          "notes": "根据您的偏好调整的具体安排"
        }
      ],
      "recommendations": [
        {
          "id": "rec-1",
          "name": "故宫博物院",
          "type": "attraction",
          "category": "history",
          "rating": 4.8,
          "description": "中国最大的古代文化艺术博物馆"
        }
      ],
      "created_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

### 语音识别

**POST** `/api/ai/speech-to-text`

将语音转换为文本

**请求体:**
```json
{
  "audio_data": "base64-encoded-audio",
  "audio_format": "wav"
}
```

**响应:**
```json
{
  "success": true,
  "message": "语音识别成功",
  "data": {
    "text": "我想要去北京旅游，预算5000元，时间3天",
    "confidence": 0.95
  }
}
```

### 智能推荐

**POST** `/api/ai/recommendations`

获取智能推荐

**请求体:**
```json
{
  "location": "北京",
  "type": "attractions",
  "filters": {
    "category": "history",
    "rating": 4.5
  },
  "limit": 10
}
```

**响应:**
```json
{
  "success": true,
  "message": "推荐生成成功",
  "data": {
    "recommendations": [
      {
        "id": "rec-1",
        "name": "故宫博物院",
        "type": "attraction",
        "category": "history",
        "rating": 4.8,
        "description": "中国最大的古代文化艺术博物馆",
        "location": "北京市东城区景山前街4号",
        "price": 60,
        "opening_hours": "08:30-17:00",
        "image_url": "https://example.com/image.jpg"
      }
    ]
  }
}
```

## 错误处理

所有API错误都遵循统一的格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": "详细错误信息（可选）"
  }
}
```

### 常见错误码

- `VALIDATION_ERROR`: 输入验证失败
- `UNAUTHORIZED`: 未授权访问
- `NOT_FOUND`: 资源不存在
- `INTERNAL_ERROR`: 服务器内部错误
- `AUTH_ERROR`: 认证错误

## 状态码

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求错误
- `401`: 未授权
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 数据模型

### 用户 (User)
```typescript
interface User {
  id: string
  email: string
  username: string
  avatar?: string
  created_at: string
}
```

### 行程 (Trip)
```typescript
interface Trip {
  id: string
  user_id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  budget?: number
  travelers_count: number
  preferences: Record<string, any>
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}
```

### 行程日 (TripDay)
```typescript
interface TripDay {
  id: string
  trip_id: string
  day_number: number
  date: string
  budget?: number
  trip_day_items: TripDayItem[]
}
```

### 行程项目 (TripDayItem)
```typescript
interface TripDayItem {
  id: string
  trip_day_id: string
  time_period: 'morning' | 'afternoon' | 'evening'
  activity: string
  description?: string
  location?: string
  estimated_cost?: number
  order_index: number
}
```

## 使用示例

### 前端API调用示例

```javascript
// 用户登录
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
  
  const data = await response.json()
  if (data.success) {
    localStorage.setItem('token', data.data.token)
  }
  return data
}

// 获取行程列表
const getTrips = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/trips', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  
  return await response.json()
}

// AI行程规划
const planTrip = async (tripData) => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/ai/plan-trip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(tripData),
  })
  
  return await response.json()
}
```

## 开发说明

### 环境变量

```bash
# 数据库配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3001
NODE_ENV=development
```

### 本地开发

1. 安装依赖
```bash
cd backend
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入实际配置
```

3. 启动开发服务器
```bash
npm run dev
```

### 测试

使用Postman或类似工具测试API接口。

## 更新日志

- **v1.0.0** (2024-01-10): 初始版本发布
  - 用户认证系统
  - 行程管理功能
  - AI智能规划功能
  - 语音识别支持