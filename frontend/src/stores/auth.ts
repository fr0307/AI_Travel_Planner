import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@supabase/supabase-js'

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

  return {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setLoading,
  }
})