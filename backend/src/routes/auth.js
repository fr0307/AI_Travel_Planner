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
    const { username, password } = req.body

    // 验证输入
    if (!username || !password) {
      throw new ValidationError('用户名和密码都是必填项')
    }

    if (password.length < 6) {
      throw new ValidationError('密码长度至少6位')
    }

    if (username.length < 3) {
      throw new ValidationError('用户名长度至少3位')
    }

    // 如果没有配置Supabase，使用模拟数据
    if (!supabase) {
      // 模拟用户ID生成
      const userId = 'user_' + Date.now()
      
      // 生成JWT token
      const token = jwt.sign(
        { userId, username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      )

      logger.info('用户注册成功（模拟模式）', { username })

      res.status(201).json({
        success: true,
        message: '注册成功（开发模式）',
        data: {
          user: {
            id: userId,
            username,
          },
          token: token
        }
      })
      return
    }

    // 使用Supabase创建用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username}@example.com`, // 使用虚拟邮箱
      password,
    })

    if (authError) {
      throw new AppError(`注册失败: ${authError.message}`)
    }

    // 在users表中创建用户记录
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (userError) {
      throw new AppError(`创建用户记录失败: ${userError.message}`)
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: authData.user.id, username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    logger.info('用户注册成功', { username })

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userData,
        token: token
      }
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
    const { username, password } = req.body

    // 验证输入
    if (!username || !password) {
      throw new ValidationError('用户名和密码都是必填项')
    }

    // 如果没有配置Supabase，使用模拟数据
    if (!supabase) {
      // 模拟用户验证（开发模式下接受任何密码）
      const userId = 'dev_' + username.replace(/[^a-zA-Z0-9]/g, '_')
      
      // 生成JWT token
      const token = jwt.sign(
        { userId, username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      )

      logger.info('用户登录成功（模拟模式）', { username })

      res.json({
        success: true,
        message: '登录成功（开发模式）',
        data: {
          user: {
            id: userId,
            username,
          },
          token,
        },
      })
      return
    }

    // 用户认证 - 使用虚拟邮箱登录
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${username}@example.com`,
      password,
    })

    if (authError) {
      throw new AppError(`登录失败: ${authError.message}`)
    }

    // 获取用户资料
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      throw new AppError(`获取用户信息失败: ${userError.message}`)
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: authData.user.id, username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    logger.info('用户登录成功', { username })

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
        username: decoded.username || 'dev_user',
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
      .select('id, username, avatar, created_at')
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