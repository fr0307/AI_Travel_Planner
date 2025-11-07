import { apiClient } from '@/utils/api'

export interface Trip {
  id: string
  user_id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  budget: number | null
  travelers_count: number
  preferences: Record<string, any>
  status: string
  ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface TripListResponse {
  success: boolean
  data: {
    trips: Trip[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface TripResponse {
  success: boolean
  data: {
    trip: Trip
  }
}

export const tripsService = {
  async getTrips(page = 1, limit = 10): Promise<TripListResponse> {
    try {
      const response = await apiClient.get('/trips', {
        params: { page, limit }
      })
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.message || '获取行程列表失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('网络错误，请稍后重试')
    }
  },

  async getTrip(id: string): Promise<TripResponse> {
    try {
      const response = await apiClient.get(`/trips/${id}`)
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.message || '获取行程详情失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('网络错误，请稍后重试')
    }
  },

  async createTrip(tripData: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TripResponse> {
    try {
      const response = await apiClient.post('/trips', tripData)
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.message || '创建行程失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('网络错误，请稍后重试')
    }
  },

  async updateTrip(id: string, updateData: Partial<Trip>): Promise<TripResponse> {
    try {
      const response = await apiClient.put(`/trips/${id}`, updateData)
      
      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.message || '更新行程失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('网络错误，请稍后重试')
    }
  },

  async deleteTrip(id: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/trips/${id}`)
      
      if (!response.data.success) {
        throw new Error(response.data.message || '删除行程失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('网络错误，请稍后重试')
    }
  }
}