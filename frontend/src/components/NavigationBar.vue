<template>
  <nav class="bg-white dark:bg-gray-800 shadow-lg transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <router-link to="/" class="flex-shrink-0 flex items-center">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">AI</span>
            </div>
            <span class="ml-2 text-xl font-bold text-gray-900 dark:text-white">旅行规划器</span>
          </router-link>
        </div>

        <!-- 导航链接 -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link 
            to="/" 
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-blue-600 dark:text-blue-400"
          >
            首页
          </router-link>
          <router-link 
            to="/planner" 
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-blue-600 dark:text-blue-400"
          >
            行程规划
          </router-link>
          <router-link 
            to="/dashboard" 
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            active-class="text-blue-600 dark:text-blue-400"
          >
            我的行程
          </router-link>
        </div>

        <!-- 右侧功能区 -->
        <div class="flex items-center space-x-4">
          <!-- 主题切换 -->
          <button 
            @click="toggleTheme"
            class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="切换主题"
          >
            <span v-if="isDark" class="text-lg">☀️</span>
            <span v-else class="text-lg">🌙</span>
          </button>

          <!-- 用户菜单 -->
          <div class="relative" v-if="authStore.isAuthenticated">
            <button 
              @click="toggleUserMenu"
              class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div class="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span class="text-white font-medium text-sm">{{ userInitial }}</span>
              </div>
            </button>

            <!-- 下拉菜单 -->
            <div 
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
            >
              <div class="py-1">
                <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b dark:border-gray-700">
                  {{ authStore.user?.username }}
                </div>
                <router-link 
                  to="/profile" 
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="showUserMenu = false"
                >
                  个人资料
                </router-link>
                <button 
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>

          <!-- 登录/注册按钮 -->
          <div v-else class="flex space-x-2">
            <router-link 
              to="/login" 
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              登录
            </router-link>
            <router-link 
              to="/register" 
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              注册
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const router = useRouter()

const showUserMenu = ref(false)
const isDark = computed(() => themeStore.isDark)

const userInitial = computed(() => {
  return authStore.user?.username?.charAt(0).toUpperCase() || 'U'
})

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    showUserMenu.value = false
    router.push('/')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

// 点击外部关闭菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>