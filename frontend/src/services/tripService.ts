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
}

export default TripService