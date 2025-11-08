import express from 'express'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { createLogger } from '../middleware/logger.js'
import { ValidationError, UnauthorizedError } from '../middleware/errorHandler.js'
import dotenv from 'dotenv'
import { aiService } from '../services/aiService.js'

// 在路由文件中直接加载环境变量
dotenv.config()

const router = express.Router()
const logger = createLogger('AIRoutes')

// 初始化Supabase客户端（如果配置了环境变量）
let supabase = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
} else {
  console.warn('⚠️  Supabase配置未设置，AI功能将使用模拟数据')
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
 * AI行程规划
 */
router.post('/plan-trip', authenticate, async (req, res, next) => {
  try {
    const {
      destination,
      start_date,
      end_date,
      budget,
      travelers_count,
      preferences = {},
      interests = [],
    } = req.body

    // 验证输入
    if (!destination || !start_date || !end_date) {
      throw new ValidationError('目的地、开始日期和结束日期都是必填项')
    }

    // 使用真实的AI服务生成行程规划
    const tripPlan = await aiService.generateTripPlan({
      destination,
      start_date,
      end_date,
      budget,
      travelers_count,
      preferences,
      interests,
    })

    logger.info('AI行程规划生成', { 
      destination, 
      userId: req.user.id,
      planId: tripPlan.id,
      aiService: aiService.isAvailable() ? 'OpenAI' : '模拟数据'
    })

    res.json({
      success: true,
      message: aiService.isAvailable() ? 'AI行程规划生成成功' : 'AI服务暂不可用，使用模拟数据',
      data: {
        plan: tripPlan,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 语音识别处理
 */
router.post('/speech-to-text', authenticate, async (req, res, next) => {
  try {
    const { audio_data, audio_format = 'audio/L16;rate=16000' } = req.body

    if (!audio_data) {
      throw new ValidationError('音频数据是必填项')
    }

    // 解码Base64音频数据
    const audioBuffer = Buffer.from(audio_data, 'base64')
    
    // 将Buffer转换为Int16Array
    const int16Array = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2)

    // 使用AI服务进行语音识别处理
    const textResult = await aiService.speechToText(int16Array, audio_format)

    logger.info('语音识别处理', { 
      userId: req.user.id,
      textLength: textResult.text.length,
      confidence: textResult.confidence,
      fallback: textResult.fallback || false
    })

    res.json({
      success: true,
      message: textResult.fallback ? '语音识别服务暂不可用，使用模拟数据' : '语音识别成功',
      data: {
        text: textResult.text,
        confidence: textResult.confidence,
        duration: textResult.duration,
        fallback: textResult.fallback || false
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 智能推荐
 */
router.post('/recommendations', authenticate, async (req, res, next) => {
  try {
    const { 
      location, 
      type = 'attractions', 
      filters = {},
      limit = 10 
    } = req.body

    if (!location) {
      throw new ValidationError('位置信息是必填项')
    }

    // 使用AI服务进行智能推荐
    const recommendations = await aiService.generateRecommendations({
      location,
      type,
      filters,
      limit,
    })

    logger.info('智能推荐生成', { 
      location, 
      type,
      userId: req.user.id,
      count: recommendations.length 
    })

    res.json({
      success: true,
      message: '推荐生成成功',
      data: {
        recommendations,
      },
    })
  } catch (error) {
    next(error)
  }
})

// 模拟函数已被aiService.js中的真实AI服务替代

export default router