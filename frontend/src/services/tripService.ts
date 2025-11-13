import { apiClient } from '@/utils/api'

// 行程接口定义
export interface TripDayItem {
  id: string
  trip_day_id: string
  item_type: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity' | 'other'
  title: string
  description?: string
  location?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  cost?: number
  notes?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface TripDay {
  id: string
  trip_id: string
  day_number: number
  date: string
  summary?: string
  notes?: string
  ai_generated: boolean
  created_at: string
  updated_at: string
  trip_day_items: TripDayItem[]
}

export interface Trip {
  id: string
  user_id: string
  title: string
  departure?: string
  destination: string
  start_date: string
  end_date: string
  budget?: number
  travelers_count: number
  preferences: Record<string, any>
  status: 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
  ai_generated: boolean
  created_at: string
  updated_at: string
  trip_days: TripDay[]
}

// API响应接口
export interface TripResponse {
  success: boolean
  data: {
    trip: Trip
  }
}

// 预算更新接口
export interface UpdateBudgetRequest {
  budget: number
}

export interface UpdateBudgetResponse {
  success: boolean
  data: {
    message: string
    updatedItem: TripDayItem
  }
}

// 行程服务类
export class TripService {
  /**
   * 获取行程详情
   */
  static async getTripDetail(tripId: string): Promise<Trip> {
    try {
      const response = await apiClient.get<TripResponse>(`/trips/${tripId}`)
      
      if (!response.data.success) {
        throw new Error('获取行程详情失败')
      }
      
      return response.data.data.trip
    } catch (error) {
      console.error('获取行程详情失败:', error)
      throw error
    }
  }

  /**
   * 将数据库格式的行程数据转换为前端显示格式
   */
  static formatTripForDisplay(trip: Trip): any {
      // 计算行程天数
      const startDate = new Date(trip.start_date)
      const endDate = new Date(trip.end_date)
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // 转换行程天数数据
      const formattedDays = trip.trip_days?.map(tripDay => {
        // 按时间分组行程项目
        const morningItems: Array<{activity: string, location?: string, budget_estimate: number, ai_generated: boolean}> = []
        const afternoonItems: Array<{activity: string, location?: string, budget_estimate: number, ai_generated: boolean}> = []
        const eveningItems: Array<{activity: string, location?: string, budget_estimate: number, ai_generated: boolean}> = []

        tripDay.trip_day_items?.forEach(item => {
          // 创建活动对象，包含activity、location、budget_estimate和ai_generated信息
          const activityObj = {
            activity: item.title,
            location: item.location,
            budget_estimate: item.cost || 0,
            ai_generated: item.ai_generate_cost || false // 添加AI生成标记
          }

          // 优先根据description中的时间信息分类
          if (item.description) {
            const desc = item.description.toLowerCase()
            if (desc.includes('上午') || desc.includes('早上') || desc.includes('早晨')) {
              morningItems.push(activityObj)
              return
            } else if (desc.includes('下午')) {
              afternoonItems.push(activityObj)
              return
            } else if (desc.includes('晚上') || desc.includes('傍晚') || desc.includes('夜间')) {
              eveningItems.push(activityObj)
              return
            }
          }
          
          // 如果没有description中的时间信息，再根据start_time分类
          const time = item.start_time
          if (time) {
            const hour = parseInt(time.split(':')[0])
            if (hour >= 5 && hour < 12) {
              morningItems.push(activityObj)
            } else if (hour >= 12 && hour < 18) {
              afternoonItems.push(activityObj)
            } else {
              eveningItems.push(activityObj)
            }
          } else {
            // 如果都没有，默认放到上午
            morningItems.push(activityObj)
          }
        })

      return {
        day: tripDay.day_number,
        date: tripDay.date,
        weather: '', // 天气信息需要从其他API获取
        budget: tripDay.trip_day_items?.reduce((sum, item) => sum + (item.cost || 0), 0) || 0,
        morning: morningItems,
        afternoon: afternoonItems,
        evening: eveningItems
      }
    }) || []

    return {
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      origin: trip.departure || '未知',
      start_date: trip.start_date,
      end_date: trip.end_date,
      days_count: durationDays,
      travelers_count: trip.travelers_count,
      budget: trip.budget || 0,
      status: trip.status,
      description: trip.preferences?.description || `从${trip.departure || '未知'}到${trip.destination}的${durationDays}天旅行`,
      days: formattedDays
    }
  }

  /**
   * 更新行程项目预算
   */
  static async updateBudget(tripId: string, dayItemId: string, budget: number): Promise<void> {
    try {
      const response = await apiClient.put<UpdateBudgetResponse>(
        `/trips/${tripId}/day-items/${dayItemId}/budget`,
        { budget }
      )
      
      if (!response.data.success) {
        throw new Error('更新预算失败')
      }
    } catch (error) {
      console.error('更新预算失败:', error)
      throw error
    }
  }

  /**
   * 根据时间周期和索引查找对应的行程项目ID
   * 此方法需要与formatTripForDisplay的分组逻辑完全一致
   */
  static findDayItemId(
    trip: Trip,
    dayIndex: number,
    timePeriod: string,
    activityIndex: number
  ): string | null {
    const tripDay = trip.trip_days?.[dayIndex]
    if (!tripDay || !tripDay.trip_day_items) {
      console.warn('找不到对应的行程天数或行程项目为空')
      return null
    }

    console.log('查找项目ID参数:', { dayIndex, timePeriod, activityIndex })
    console.log('行程项目数量:', tripDay.trip_day_items.length)
    console.log('所有项目详情:', tripDay.trip_day_items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      start_time: item.start_time
    })))
    
    // 模拟formatTripForDisplay的分组逻辑，但保持原始顺序
    // 首先为每个项目分配时间组，同时记录原始索引
    const timeGroupAssignments: Array<{item: TripDayItem, group: string, originalIndex: number}> = []
    
    tripDay.trip_day_items.forEach((item, originalIndex) => {
      let group = 'morning' // 默认分组
      
      // 优先根据description中的时间信息分类
      if (item.description) {
        const desc = item.description.toLowerCase()
        if (desc.includes('上午') || desc.includes('早上') || desc.includes('早晨')) {
          group = 'morning'
        } else if (desc.includes('下午')) {
          group = 'afternoon'
        } else if (desc.includes('晚上') || desc.includes('傍晚') || desc.includes('夜间')) {
          group = 'evening'
        }
      }
      
      // 如果没有description中的时间信息，再根据start_time分类
      if (group === 'morning') { // 如果还没有确定分组
        const time = item.start_time
        if (time) {
          const hour = parseInt(time.split(':')[0])
          if (hour >= 5 && hour < 12) {
            group = 'morning'
          } else if (hour >= 12 && hour < 18) {
            group = 'afternoon'
          } else {
            group = 'evening'
          }
        }
      }
      
      timeGroupAssignments.push({item, group, originalIndex})
    })
    
    // 按原始索引排序，确保顺序一致
    timeGroupAssignments.sort((a, b) => a.originalIndex - b.originalIndex)
    
    // 按分组重新构建数组，保持原始顺序
    const morningItems: TripDayItem[] = []
    const afternoonItems: TripDayItem[] = []
    const eveningItems: TripDayItem[] = []
    
    timeGroupAssignments.forEach(assignment => {
      if (assignment.group === 'morning') {
        morningItems.push(assignment.item)
      } else if (assignment.group === 'afternoon') {
        afternoonItems.push(assignment.item)
      } else if (assignment.group === 'evening') {
        eveningItems.push(assignment.item)
      }
    })

    // 根据时间周期选择对应的项目数组
    let targetItems: TripDayItem[] = []
    if (timePeriod === 'morning') {
      targetItems = morningItems
    } else if (timePeriod === 'afternoon') {
      targetItems = afternoonItems
    } else if (timePeriod === 'evening') {
      targetItems = eveningItems
    }

    console.log(`前端分组后的${timePeriod}项目数量:`, targetItems.length)
    console.log(`前端分组后的${timePeriod}项目详情:`, targetItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      start_time: item.start_time
    })))
    
    // 检查索引是否有效
    if (activityIndex >= 0 && activityIndex < targetItems.length) {
      const itemId = targetItems[activityIndex].id
      console.log('找到项目ID:', itemId)
      return itemId
    }

    console.warn('索引超出范围，无法找到对应的项目ID')
    console.warn('有效索引范围: 0 -', targetItems.length - 1)
    console.warn('当前索引:', activityIndex)
    return null
  }
}

export default TripService