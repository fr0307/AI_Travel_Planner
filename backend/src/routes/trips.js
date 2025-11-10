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
 * 创建新行程（支持AI生成的行程保存）
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    // 支持两种格式：直接传入行程数据或通过plan字段传入AI生成的行程
    const { plan, ...directData } = req.body
    
    // 如果通过plan字段传入，使用AI生成的行程数据
    const tripData = plan ? {
      user_id: req.user.id,
      title: plan.title,
      departure: plan.departure || null,
      destination: plan.destination,
      start_date: plan.start_date || new Date().toISOString().split('T')[0],
      end_date: plan.end_date || (plan.duration_days ? 
        new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0]),
      budget: plan.budget || null,
      travelers_count: plan.travelers_count || 1,
      preferences: plan.preferences || {},
      ai_generated: true,
      status: 'planned',
      created_at: plan.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } : {
      user_id: req.user.id,
      title: directData.title,
      departure: directData.departure || null,
      destination: directData.destination,
      start_date: new Date(directData.start_date).toISOString(),
      end_date: new Date(directData.end_date).toISOString(),
      budget: directData.budget || null,
      travelers_count: directData.travelers_count || 1,
      preferences: directData.preferences || {},
      ai_generated: false,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 验证输入
    if (!tripData.title || !tripData.destination) {
      throw new ValidationError('标题和目的地是必填项')
    }

    // 如果配置了Supabase，保存到数据库
    if (supabase) {
      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select()

      if (error) {
        logger.error('保存行程到数据库失败', { error: error.message, userId: req.user.id })
        throw new Error('保存行程失败，请稍后重试')
      }

      logger.info('行程保存成功', { 
        userId: req.user.id,
        tripId: data[0].id,
        destination: tripData.destination,
        departure: tripData.departure,
        aiGenerated: !!plan
      })

      res.status(201).json({
        success: true,
        message: plan ? '行程保存成功' : '行程创建成功',
        data: {
          trip: {
            ...tripData,
            id: data[0].id,
            user_id: req.user.id,
            saved_at: data[0].created_at
          }
        },
      })
    } else {
      // 如果没有配置数据库，返回成功但仅记录日志
      logger.info('行程保存成功（模拟模式）', { 
        userId: req.user.id,
        tripId: plan?.id || 'simulated',
        destination: tripData.destination,
        departure: tripData.departure,
        aiGenerated: !!plan
      })

      res.status(201).json({
        success: true,
        message: plan ? '行程保存成功（模拟模式）' : '行程创建成功（模拟模式）',
        data: {
          trip: {
            ...tripData,
            id: plan?.id || 'simulated',
            user_id: req.user.id,
            saved_at: new Date().toISOString()
          }
        },
      })
    }
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