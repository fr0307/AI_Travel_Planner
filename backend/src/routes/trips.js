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

      const savedTrip = data[0]

      // 如果通过plan字段传入且包含days数据，保存每天的行程安排
      if (plan && plan.days && plan.days.length > 0) {
        try {
          // 保存行程天数数据
          const tripDaysData = plan.days.map(day => ({
            trip_id: savedTrip.id,
            day_number: day.day,
            date: day.date,
            summary: day.summary || '',
            notes: day.notes || '',
            ai_generated: true, // 标记为AI生成的行程天数
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))

          const { data: savedDays, error: daysError } = await supabase
            .from('trip_days')
            .insert(tripDaysData)
            .select()

          if (daysError) {
            logger.error('保存行程天数数据失败', { error: daysError.message, tripId: savedTrip.id })
            // 不抛出错误，继续返回行程基本信息
          } else {
            // 保存每天的行程项目
            const dayItemsData = []
            
            for (const day of plan.days) {
              const savedDay = savedDays.find(d => d.day_number === day.day)
              
              // 处理上午活动
              if (savedDay && day.morning) {
                day.morning.forEach((item, index) => {
                  const activity = typeof item === 'object' ? item.activity : item
                  const location = typeof item === 'object' ? item.location : extractLocationFromActivity(activity)
                  const budgetEstimate = typeof item === 'object' ? item.budget_estimate : 0
                  
                  dayItemsData.push({
                    trip_day_id: savedDay.id,
                    item_type: 'activity',
                    title: activity,
                    description: `上午活动：${activity}`,
                    location: location,
                    cost: budgetEstimate,
                    ai_generate_cost: true, // 标记为AI生成的费用
                    order_index: index,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                })
              }
              
              // 处理下午活动
              if (savedDay && day.afternoon) {
                day.afternoon.forEach((item, index) => {
                  const activity = typeof item === 'object' ? item.activity : item
                  const location = typeof item === 'object' ? item.location : extractLocationFromActivity(activity)
                  const budgetEstimate = typeof item === 'object' ? item.budget_estimate : 0
                  
                  dayItemsData.push({
                    trip_day_id: savedDay.id,
                    item_type: 'activity',
                    title: activity,
                    description: `下午活动：${activity}`,
                    location: location,
                    cost: budgetEstimate,
                    ai_generate_cost: true, // 标记为AI生成的费用
                    order_index: index + 10,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                })
              }
              
              // 处理晚上活动
              if (savedDay && day.evening) {
                day.evening.forEach((item, index) => {
                  const activity = typeof item === 'object' ? item.activity : item
                  const location = typeof item === 'object' ? item.location : extractLocationFromActivity(activity)
                  const budgetEstimate = typeof item === 'object' ? item.budget_estimate : 0
                  
                  dayItemsData.push({
                    trip_day_id: savedDay.id,
                    item_type: 'activity',
                    title: activity,
                    description: `晚上活动：${activity}`,
                    location: location,
                    cost: budgetEstimate,
                    ai_generate_cost: true, // 标记为AI生成的费用
                    order_index: index + 20,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                })
              }
            }

            if (dayItemsData.length > 0) {
              const { error: itemsError } = await supabase
                .from('trip_day_items')
                .insert(dayItemsData)

              if (itemsError) {
                logger.error('保存行程项目数据失败', { error: itemsError.message, tripId: savedTrip.id })
              } else {
                logger.info('行程天数数据保存成功', { 
                  tripId: savedTrip.id, 
                  daysCount: savedDays.length,
                  itemsCount: dayItemsData.length 
                })
              }
            }
          }
        } catch (daysError) {
          logger.error('处理行程天数数据时出错', { 
            error: daysError.message, 
            tripId: savedTrip.id,
            userId: req.user.id 
          })
          // 不抛出错误，继续返回行程基本信息
        }
      }

      logger.info('行程保存成功', { 
        userId: req.user.id,
        tripId: savedTrip.id,
        destination: tripData.destination,
        departure: tripData.departure,
        aiGenerated: !!plan,
        hasDaysData: !!(plan && plan.days)
      })

      res.status(201).json({
        success: true,
        message: plan ? '行程保存成功' : '行程创建成功',
        data: {
          trip: {
            ...tripData,
            id: savedTrip.id,
            user_id: req.user.id,
            saved_at: savedTrip.created_at
          }
        },
      })
    } else {
      // 如果没有配置数据库，返回成功但仅记录日志
      const simulatedTripId = plan?.id || 'simulated'
      
      // 模拟保存行程天数数据
      if (plan && plan.days && plan.days.length > 0) {
        logger.info('模拟保存行程天数数据', { 
          tripId: simulatedTripId,
          daysCount: plan.days.length,
          itemsCount: plan.days.reduce((sum, day) => 
            sum + (day.morning?.length || 0) + (day.afternoon?.length || 0) + (day.evening?.length || 0), 0)
        })
      }

      logger.info('行程保存成功（模拟模式）', { 
        userId: req.user.id,
        tripId: simulatedTripId,
        destination: tripData.destination,
        departure: tripData.departure,
        aiGenerated: !!plan,
        hasDaysData: !!(plan && plan.days)
      })

      res.status(201).json({
        success: true,
        message: plan ? '行程保存成功（模拟模式）' : '行程创建成功（模拟模式）',
        data: {
          trip: {
            ...tripData,
            id: simulatedTripId,
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
 * 从活动描述中提取地点信息
 */
function extractLocationFromActivity(activity) {
  // 简单的规则提取地点信息
  const locationPatterns = [
    /在(.+?)进行/,
    /到(.+?)参观/,
    /前往(.+?)(?:游玩|游览|参观)/,
    /在(.+?)(?:用餐|吃饭|就餐)/,
    /(.+?)景区/,
    /(.+?)景点/,
    /(.+?)公园/,
    /(.+?)博物馆/,
    /(.+?)餐厅/,
    /(.+?)酒店/,
  ]
  
  for (const pattern of locationPatterns) {
    const match = activity.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  // 如果无法提取，返回默认地点
  return '待定地点'
}

/**
 * 更新行程
 */

/**
 * 更新行程项目预算
 */
router.put('/:tripId/day-items/:itemId/budget', authenticate, async (req, res, next) => {
  try {
    const { tripId, itemId } = req.params
    const { budget } = req.body

    // 验证预算金额
    if (budget === undefined || budget === null || isNaN(parseFloat(budget))) {
      throw new ValidationError('预算金额必须为有效数字')
    }

    // 检查行程是否存在且属于当前用户
    const { data: existingTrip, error: tripError } = await supabase
      .from('trips')
      .select('id')
      .eq('id', tripId)
      .eq('user_id', req.user.id)
      .single()

    if (tripError) {
      throw new NotFoundError('行程不存在')
    }

    // 检查行程项目是否存在
    const { data: existingItem, error: itemError } = await supabase
      .from('trip_day_items')
      .select('id, trip_day_id')
      .eq('id', itemId)
      .single()

    if (itemError) {
      throw new NotFoundError('行程项目不存在')
    }

    // 验证行程项目属于该行程
    const { data: tripDay, error: dayError } = await supabase
      .from('trip_days')
      .select('trip_id')
      .eq('id', existingItem.trip_day_id)
      .eq('trip_id', tripId)
      .single()

    if (dayError) {
      throw new ValidationError('行程项目不属于该行程')
    }

    // 更新预算金额，并将ai_generate_cost设为false（用户手动修改）
    const { data: updatedItem, error: updateError } = await supabase
      .from('trip_day_items')
      .update({
        cost: parseFloat(budget),
        ai_generate_cost: false, // 用户手动修改，标记为非AI生成
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`更新预算失败: ${updateError.message}`)
    }

    logger.info('更新行程项目预算', { 
      tripId: tripId,
      itemId: itemId,
      userId: req.user.id,
      newBudget: budget,
      aiGenerateCost: false
    })

    res.json({
      success: true,
      message: '预算更新成功',
      data: {
        item: updatedItem
      }
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