import express from 'express'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { createLogger } from '../middleware/logger.js'
import { ValidationError, UnauthorizedError, AppError } from '../middleware/errorHandler.js'
import dotenv from 'dotenv'

// 在路由文件中直接加载环境变量
dotenv.config()

const router = express.Router()
const logger = createLogger('AuthRoutes')

// 初始化Supabase客户端（如果配置了环境变量）
let supabase = null

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
} else {
  console.warn('⚠️  Supabase配置未设置，认证功能将使用模拟数据')
}

/**
 * 用户注册
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, username } = req.body

    // 验证输入
    if (!email || !password || !username) {
      throw new ValidationError('邮箱、密码和用户名都是必填项')
    }

    if (password.length < 6) {
      throw new ValidationError('密码长度至少6位')
    }

    // 如果没有配置Supabase，使用模拟数据
    if (!supabase) {
      // 模拟用户ID生成
      const userId = 'dev_' + Date.now()
      
      // 生成JWT token
      const token = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      )

      logger.info('用户注册成功（模拟模式）', { email, username })

      res.status(201).json({
        success: true,
        message: '注册成功（开发模式）',
        data: {
          user: {
            id: userId,
            email,
            username,
          },
          token,
        },
      })
      return
    }

    // 检查用户是否已存在
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new ValidationError('该邮箱已被注册')
    }

    // 创建用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      throw new AppError(`注册失败: ${authError.message}`)
    }

    // 创建用户资料
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          username,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (profileError) {
      throw new AppError(`创建用户资料失败: ${profileError.message}`)
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: authData.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    logger.info('用户注册成功', { email, username })

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: authData.user.id,
          email,
          username,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 用户登录
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    // 验证输入
    if (!email || !password) {
      throw new ValidationError('邮箱和密码都是必填项')
    }

    // 如果没有配置Supabase，使用模拟数据
    if (!supabase) {
      // 模拟用户验证（开发模式下接受任何密码）
      const userId = 'dev_' + email.replace(/[^a-zA-Z0-9]/g, '_')
      
      // 生成JWT token
      const token = jwt.sign(
        { userId, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      )

      logger.info('用户登录成功（模拟模式）', { email })

      res.json({
        success: true,
        message: '登录成功（开发模式）',
        data: {
          user: {
            id: userId,
            email,
            username: email.split('@')[0],
          },
          token,
        },
      })
      return
    }

    // 用户认证
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      throw new AppError(`登录失败: ${authError.message}`)
    }

    // 获取用户资料
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      throw new AppError(`获取用户信息失败: ${userError.message}`)
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: authData.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    logger.info('用户登录成功', { email })

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userData,
        token,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取当前用户信息
 */
router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      throw new UnauthorizedError('请提供认证token')
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 如果没有配置Supabase，使用模拟数据
    if (!supabase) {
      const userData = {
        id: decoded.userId,
        email: decoded.email || 'dev@example.com',
        username: decoded.email ? decoded.email.split('@')[0] : 'dev_user',
        avatar: null,
        created_at: new Date().toISOString(),
      }

      res.json({
        success: true,
        data: {
          user: userData,
        },
      })
      return
    }

    // 获取用户资料
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, username, avatar, created_at')
      .eq('id', decoded.userId)
      .single()

    if (userError || !userData) {
      throw new UnauthorizedError('用户不存在或token无效')
    }

    res.json({
      success: true,
      data: {
        user: userData,
      },
    })
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('无效的token'))
    } else {
      next(error)
    }
  }
})

/**
 * 用户登出
 */
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (token) {
      // 这里可以添加token黑名单逻辑
      logger.info('用户登出', { token: token.substring(0, 10) + '...' })
    }

    res.json({
      success: true,
      message: '登出成功',
    })
  } catch (error) {
    next(error)
  }
})

export default router