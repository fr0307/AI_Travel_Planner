import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authService, type User } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  const setUser = (userData: User | null) => {
    user.value = userData
    isAuthenticated.value = !!userData
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setLoading(true)
      const userData = await authService.login(credentials)
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: { email: string; username: string; password: string }) => {
    try {
      setLoading(true)
      const newUser = await authService.register(userData)
      return newUser
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setLoading,
    login,
    register,
    logout,
  }
})