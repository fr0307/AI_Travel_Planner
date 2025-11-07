import { apiClient } from '@/utils/api'

export interface AITripPlanRequest {
  destination: string
  start_date: string
  end_date: string
  budget?: number
  travelers_count?: number
  preferences?: Record<string, any>
  interests?: string[]
}

export interface AITripPlanResponse {
  success: boolean
  message: string
  data: {
    plan: TripPlan
  }
}

export interface TripPlan {
  id: string
  title: string
  destination: string
  duration_days: number
  budget?: number
  summary: string
  days: TripDay[]
  recommendations: Recommendation[]
  created_at: string
}

export interface TripDay {
  day: number
  date: string
  morning: string[]
  afternoon: string[]
  evening: string[]
  notes?: string
}

export interface Recommendation {
  name: string
  type: string
  rating: number
  price: number
}

/**
 * AI行程规划服务
 */
export const aiService = {
  /**
   * 生成AI行程规划
   */
  async generateTripPlan(request: AITripPlanRequest): Promise<TripPlan> {
    try {
      const response = await apiClient.post<AITripPlanResponse>('/ai/plan-trip', request, { timeout: 120000 })
      
      if (response.data.success) {
        return response.data.data.plan
      } else {
        throw new Error(response.data.message || 'AI行程规划生成失败')
      }
    } catch (error: any) {
      console.error('AI行程规划失败:', error)
      throw new Error(error.response?.data?.message || '前端: AI行程规划服务暂时不可用')
    }
  },

  /**
   * 语音识别处理
   */
  async speechToText(audioData: string, audioFormat: string = 'wav'): Promise<{ text: string; confidence: number }> {
    try {
      const response = await apiClient.post('/ai/speech-to-text', {
        audio_data: audioData,
        audio_format: audioFormat
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '语音识别失败')
      }
    } catch (error: any) {
      console.error('语音识别失败:', error)
      throw new Error(error.response?.data?.message || '语音识别服务暂时不可用')
    }
  },

  /**
   * 获取智能推荐
   */
  async getRecommendations(location: string, type: string = 'attractions', filters: Record<string, any> = {}, limit: number = 10): Promise<Recommendation[]> {
    try {
      const response = await apiClient.post('/ai/recommendations', {
        location,
        type,
        filters,
        limit
      })
      
      if (response.data.success) {
        return response.data.data.recommendations
      } else {
        throw new Error(response.data.message || '推荐获取失败')
      }
    } catch (error: any) {
      console.error('推荐获取失败:', error)
      throw new Error(error.response?.data?.message || '推荐服务暂时不可用')
    }
  }
}

export default aiService