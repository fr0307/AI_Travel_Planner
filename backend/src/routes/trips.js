import express from 'express'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { createLogger } from '../middleware/logger.js'
import { ValidationError, UnauthorizedError, NotFoundError } from '../middleware/errorHandler.js'
import dotenv from 'dotenv'

// 在路由文件中直接加载环境变量
dotenv.config()

const router = express.Router()
const logger = createLogger('TripRoutes')

// 初始化Supabase客户端（如果配置了环境变量）
let supabase = null
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
} else {
  console.warn('⚠️  Supabase配置未设置，行程功能将使用模拟数据')
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
 * 获取用户的所有行程
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const { data: trips, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`获取行程列表失败: ${error.message}`)
    }

    // 获取总数
    const { count } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)

    res.json({
      success: true,
      data: {
        trips: trips || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 获取单个行程详情
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        trip_days (
          *,
          trip_day_items (*)
        )
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('行程不存在')
      }
      throw new Error(`获取行程详情失败: ${error.message}`)
    }

    res.json({
      success: true,
      data: {
        trip,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 创建新行程
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      title,
      destination,
      start_date,
      end_date,
      budget,
      travelers_count,
      preferences,
    } = req.body

    // 验证输入
    if (!title || !destination || !start_date || !end_date) {
      throw new ValidationError('标题、目的地、开始日期和结束日期都是必填项')
    }

    const tripData = {
      user_id: req.user.id,
      title,
      destination,
      start_date: new Date(start_date).toISOString(),
      end_date: new Date(end_date).toISOString(),
      budget: budget || null,
      travelers_count: travelers_count || 1,
      preferences: preferences || {},
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .insert([tripData])
      .select()
      .single()

    if (error) {
      throw new Error(`创建行程失败: ${error.message}`)
    }

    logger.info('创建新行程', { tripId: trip.id, userId: req.user.id })

    res.status(201).json({
      success: true,
      message: '行程创建成功',
      data: {
        trip,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 更新行程
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = { ...req.body, updated_at: new Date().toISOString() }

    // 检查行程是否存在且属于当前用户
    const { data: existingTrip, error: checkError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (checkError) {
      throw new NotFoundError('行程不存在')
    }

    const { data: trip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`更新行程失败: ${error.message}`)
    }

    logger.info('更新行程', { tripId: id, userId: req.user.id })

    res.json({
      success: true,
      message: '行程更新成功',
      data: {
        trip,
      },
    })
  } catch (error) {
    next(error)
  }
})

/**
 * 删除行程
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params

    // 检查行程是否存在且属于当前用户
    const { data: existingTrip, error: checkError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (checkError) {
      throw new NotFoundError('行程不存在')
    }

    // 删除行程相关的所有数据（需要设置级联删除）
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`删除行程失败: ${error.message}`)
    }

    logger.info('删除行程', { tripId: id, userId: req.user.id })

    res.json({
      success: true,
      message: '行程删除成功',
    })
  } catch (error) {
    next(error)
  }
})

export default router