import { apiClient } from '@/utils/api'

export interface AITripPlanRequest {
  departure?: string
  destination: string
  start_date: string
  end_date: string
  budget?: number
  travelers_count?: number
  preferences?: Record<string, any>
  interests?: string[]
  voice_text?: string
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
  departure?: string
  destination: string
  duration_days: number
  budget?: number
  summary: string
  days: TripDay[]
  recommendations: Recommendation[]
  created_at: string
}

export interface SavePlanResponse {
  success: boolean
  message: string
  data: {
    trip: SavedTripPlan
  }
}

export interface SavedTripPlan {
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
  ai_generated: boolean
  status: string
  created_at: string
  updated_at: string
  saved_at: string
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
  async speechToText(audioData: Int16Array, audioFormat: string = 'audio/L16;rate=16000'): Promise<{ text: string; confidence: number; duration?: number; fallback?: boolean }> {
    console.log('[speechToText] 开始处理语音识别')
    try {
      // 优化音频数据处理，避免爆栈
      const audioBuffer = new Uint8Array(audioData.buffer)
      console.log('[speechToText] 音频数据大小:', audioBuffer.length, '字节')
      
      // 使用更高效的方式转换Base64，避免爆栈
      let base64Audio = ''
      const chunkSize = 1024 * 1024 // 1MB分块处理
      
      for (let i = 0; i < audioBuffer.length; i += chunkSize) {
        const chunk = audioBuffer.slice(i, i + chunkSize)
        const chunkString = Array.from(chunk).map(byte => String.fromCharCode(byte)).join('')
        base64Audio += btoa(chunkString)
      }
      
      console.log('[speechToText] Base64编码完成，大小:', base64Audio.length, '字符')
      
      const response = await apiClient.post('/ai/speech-to-text', {
        audio_data: base64Audio,
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
  },

  /**
   * 智能提取表单信息
   * 使用大模型从语音识别文本中智能提取旅行规划相关的表单信息
   */
  async extractFormInfo(text: string): Promise<{
    departure?: string
    destination?: string
    start_date?: string
    end_date?: string
    budget?: number
    travelers_count?: number
    preferences?: Record<string, any>
    interests?: string[]
    ai_service_available: boolean
  }> {
    try {
      console.log('[extractFormInfo] 开始智能表单信息提取，文本长度:', text.length)
      
      const response = await apiClient.post('/ai/extract-form-info', {
        text
      })
      
      if (response.data.success) {
        console.log('[extractFormInfo] 智能表单信息提取成功', response.data.data.extracted_info)
        return {
          ...response.data.data.extracted_info,
          ai_service_available: response.data.data.ai_service_available
        }
      } else {
        throw new Error(response.data.message || '表单信息提取失败')
      }
    } catch (error: any) {
      console.error('智能表单信息提取失败:', error)
      throw new Error(error.response?.data?.message || '智能表单信息提取服务暂时不可用')
    }
  },

  /**
   * 保存行程
   */
  async saveTripPlan(plan: TripPlan): Promise<SavedTripPlan> {
    try {
      console.log('[saveTripPlan] 开始保存行程', { planId: plan.id, destination: plan.destination })
      
      const response = await apiClient.post<SavePlanResponse>('/trips', {
        plan
      })
      
      if (response.data.success) {
        console.log('[saveTripPlan] 行程保存成功', response.data.data.trip)
        return response.data.data.trip
      } else {
        throw new Error(response.data.message || '行程保存失败')
      }
    } catch (error: any) {
      console.error('行程保存失败:', error)
      throw new Error(error.response?.data?.message || '行程保存服务暂时不可用')
    }
  }
}

export default aiService