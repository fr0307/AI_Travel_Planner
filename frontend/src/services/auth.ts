import { apiClient } from '@/utils/api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
}

export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      
      if (response.data.success && response.data.user) {
        // 存储token到localStorage
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token)
        }
        return response.data.user
      } else {
        throw new Error(response.data.message || '登录失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('登录网络错误，请稍后重试')
    }
  },

  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await apiClient.post('/auth/register', userData)
      
      if (response.data.success && response.data.user) {
        return response.data.user
      } else {
        throw new Error(response.data.message || '注册失败')
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('网络错误，请稍后重试')
    }
  },

  async logout(): Promise<void> {
    try {
      // 清除本地存储的token
      localStorage.removeItem('auth_token')
      
      // 调用后端登出接口（如果有的话）
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
      // 即使登出失败，也要清除本地token
      localStorage.removeItem('auth_token')
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        return null
      }
      
      const response = await apiClient.get('/auth/me')
      
      if (response.data.success && response.data.user) {
        return response.data.user
      }
      return null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  },
}