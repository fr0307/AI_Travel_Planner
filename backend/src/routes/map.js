import express from 'express'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { createLogger } from '../middleware/logger.js'
import { ValidationError, UnauthorizedError } from '../middleware/errorHandler.js'
import dotenv from 'dotenv'

// 在路由文件中直接加载环境变量
dotenv.config()

const router = express.Router()
const logger = createLogger('MapRoutes')

// 高德地图API并发限制配置 - 严格控制在2.5次/秒以内
const AMAP_RATE_LIMIT = {
  maxRequests: 5, // 每2秒最大请求数（2.5次/秒）
  windowMs: 2000, // 时间窗口（毫秒）- 使用2秒窗口确保精确控制
  minInterval: 400 // 最小请求间隔（毫秒）- 确保请求间隔至少400ms
}

// 请求队列和速率限制状态
let requestQueue = []
let requestCount = 0
let lastResetTime = Date.now()
let lastRequestTime = 0 // 记录上一次请求的时间
let isProcessing = false // 标记是否正在处理请求

/**
 * 处理请求队列
 */
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) {
    return
  }
  
  isProcessing = true
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift()
    
    try {
      // 检查速率限制
      const rateLimit = checkRateLimit()
      if (!rateLimit.allowed) {
        // 如果被限流，将请求重新放回队列前端
        requestQueue.unshift(request)
        
        // 等待限流时间加上随机抖动
        const jitter = Math.random() * 50
        await new Promise(resolve => setTimeout(resolve, rateLimit.waitTime + jitter))
        continue
      }
      
      // 处理请求
      await request.process()
      
      // 确保最小请求间隔
      if (AMAP_RATE_LIMIT.minInterval > 0) {
        await new Promise(resolve => setTimeout(resolve, AMAP_RATE_LIMIT.minInterval))
      }
      
    } catch (error) {
      logger.error('处理队列请求失败', { error: error.message })
      request.reject(error)
    }
  }
  
  isProcessing = false
}

/**
 * 添加请求到队列
 */
function enqueueRequest(processFn) {
  return new Promise((resolve, reject) => {
    const request = {
      process: async () => {
        try {
          const result = await processFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
      reject
    }
    
    requestQueue.push(request)
    processQueue()
  })
}

/**
 * 检查是否超过速率限制
 */
function checkRateLimit() {
  const now = Date.now()
  
  // 如果超过时间窗口，重置计数器
  if (now - lastResetTime >= AMAP_RATE_LIMIT.windowMs) {
    requestCount = 0
    lastResetTime = now
  }
  
  // 检查最小请求间隔
  if (lastRequestTime > 0 && (now - lastRequestTime) < AMAP_RATE_LIMIT.minInterval) {
    const waitTime = AMAP_RATE_LIMIT.minInterval - (now - lastRequestTime)
    logger.info('请求间隔过短，强制等待', { waitTime })
    return { allowed: false, waitTime, reason: 'interval' }
  }
  
  // 检查是否超过限制
  if (requestCount >= AMAP_RATE_LIMIT.maxRequests) {
    const waitTime = AMAP_RATE_LIMIT.windowMs - (now - lastResetTime)
    return { allowed: false, waitTime, reason: 'rate' }
  }
  
  requestCount++
  lastRequestTime = now
  return { allowed: true, waitTime: 0 }
}

/**
 * 处理地理编码请求队列
 */
async function processGeocodeRequest(address, city, apiKey, userId) {
  return enqueueRequest(async () => {
    // 记录请求开始时间用于性能监控
    const requestStartTime = Date.now()
    
    try {
      // 构建高德地图地理编码API请求URL
      const searchParams = new URLSearchParams({
        key: apiKey,
        address: address,
        city: city || '',
        output: 'JSON'
      })

      const url = `https://restapi.amap.com/v3/geocode/geo?${searchParams}`
      
      // 添加请求超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      const response = await fetch(url, { 
        signal: controller.signal 
      })
      clearTimeout(timeoutId)
      
      const data = await response.json()
      
      // 记录请求耗时
      const requestDuration = Date.now() - requestStartTime
      logger.info('高德地图API请求完成', { 
        address, 
        duration: requestDuration,
        userId 
      })

      if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        const geocode = data.geocodes[0]
        const coordinates = geocode.location.split(',').map(coord => parseFloat(coord))
        
        logger.info('地理编码成功', { 
          address,
          coordinates,
          userId
        })

        return {
          success: true,
          data: {
            location: address,
            coordinates: coordinates,
            formattedAddress: geocode.formatted_address,
            fallback: false
          }
        }
      } else {
        logger.warn('地理编码失败', { 
          address,
          error: data.info,
          userId
        })

        // 返回模拟数据作为降级方案
        const mockCoordinates = {
          '北京故宫': [116.3974, 39.9093],
          '天安门广场': [116.3975, 39.9075],
          '颐和园': [116.2731, 39.9998],
          '长城': [116.0242, 40.3625],
          '上海外滩': [121.4903, 31.2222],
          '东方明珠': [121.4997, 31.2397],
          '杭州西湖': [120.1551, 30.2741],
          '广州塔': [113.3245, 23.1064]
        }

        const mockCoord = mockCoordinates[address] || [116.3974, 39.9093]
        
        return {
          success: true,
          data: {
            location: address,
            coordinates: mockCoord,
            formattedAddress: address,
            fallback: true
          }
        }
      }
    } catch (error) {
      logger.error('地理编码处理失败', { 
        error: error.message,
        userId
      })
      
      // 即使处理失败也返回模拟数据作为降级方案
      const mockCoordinates = {
        '北京故宫': [116.3974, 39.9093],
        '天安门广场': [116.3975, 39.9075],
        '颐和园': [116.2731, 39.9998],
        '长城': [116.0242, 40.3625],
        '上海外滩': [121.4903, 31.2222],
        '东方明珠': [121.4997, 31.2397],
        '杭州西湖': [120.1551, 30.2741],
        '广州塔': [113.3245, 23.1064]
      }

      const mockCoord = mockCoordinates[address] || [116.3974, 39.9093]
      
      return {
        success: true,
        data: {
          location: address,
          coordinates: mockCoord,
          formattedAddress: address,
          fallback: true
        }
      }
    }
  })
}

// 初始化Supabase客户端（如果配置了环境变量）
let supabase = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
} else {
  console.warn('⚠️  Supabase配置未设置，地图功能将使用模拟数据')
}

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      throw new UnauthorizedError('请提供认证token')
    }

    // 如果没有配置Supabase，使用JWT验证
    if (!supabase) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = {
          id: decoded.userId,
          email: decoded.email
        }
        next()
        return
      } catch (jwtError) {
        throw new UnauthorizedError('无效的token')
      }
    }

    // 验证token并获取用户信息
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new UnauthorizedError('无效的token')
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

/**
 * 获取高德地图API配置
 */
router.get('/config', authenticate, async (req, res, next) => {
  try {
    const apiKey = process.env.AMAP_API_KEY
    
    if (!apiKey || apiKey === 'your_amap_api_key_here') {
      logger.warn('高德地图API Key未配置或为默认值')
      return res.json({
        success: true,
        message: '高德地图API Key未配置，请检查后端环境变量',
        data: {
          apiKey: null,
          isConfigured: false
        }
      })
    }

    logger.info('获取高德地图配置', { 
      userId: req.user.id,
      apiKeyConfigured: true
    })

    res.json({
      success: true,
      message: '高德地图配置获取成功',
      data: {
        apiKey: apiKey,
        isConfigured: true
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取地点坐标（通过高德地图地理编码API）
 */
router.post('/geocode', authenticate, async (req, res, next) => {
  try {
    const { address, city } = req.body

    if (!address) {
      throw new ValidationError('地址信息是必填项')
    }

    const apiKey = process.env.AMAP_API_KEY
    
    if (!apiKey || apiKey === 'your_amap_api_key_here') {
      logger.warn('高德地图API Key未配置，使用模拟坐标数据')
      
      // 模拟坐标数据作为降级方案
      const mockCoordinates = {
        '北京故宫': [116.3974, 39.9093],
        '天安门广场': [116.3975, 39.9075],
        '颐和园': [116.2731, 39.9998],
        '长城': [116.0242, 40.3625],
        '上海外滩': [121.4903, 31.2222],
        '东方明珠': [121.4997, 31.2397],
        '杭州西湖': [120.1551, 30.2741],
        '广州塔': [113.3245, 23.1064]
      }

      const mockCoord = mockCoordinates[address] || [116.3974, 39.9093] // 默认北京坐标
      
      return res.json({
        success: true,
        message: '高德地图API Key未配置，使用模拟坐标',
        data: {
          location: address,
          coordinates: mockCoord,
          formattedAddress: address,
          fallback: true
        }
      })
    }

    // 使用并发限制机制处理地理编码请求
    const result = await processGeocodeRequest(address, city, apiKey, req.user.id)
    
    res.json({
      success: result.success,
      message: result.data.fallback ? '地理编码失败，使用模拟坐标' : '地理编码成功',
      data: result.data
    })
    
  } catch (error) {
    logger.error('地理编码处理失败', { 
      error: error.message,
      userId: req.user.id
    })
    
    // 即使处理失败也返回模拟数据作为降级方案
    const mockCoordinates = {
      '北京故宫': [116.3974, 39.9093],
      '天安门广场': [116.3975, 39.9075],
      '颐和园': [116.2731, 39.9998],
      '长城': [116.0242, 40.3625],
      '上海外滩': [121.4903, 31.2222],
      '东方明珠': [121.4997, 31.2397],
      '杭州西湖': [120.1551, 30.2741],
      '广州塔': [113.3245, 23.1064]
    }

    const mockCoord = mockCoordinates[address] || [116.3974, 39.9093]
    
    res.json({
      success: true,
      message: '地理编码处理失败，使用模拟坐标',
      data: {
        location: address,
        coordinates: mockCoord,
        formattedAddress: address,
        fallback: true
      }
    })
  }
})

export default router