<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 导航栏 -->
    <NavigationBar />

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- 页面标题 -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">我的行程</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            管理您的旅行计划和历史行程
          </p>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">总行程数</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.totalTrips }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">进行中</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.activeTrips }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">总天数</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.totalDays }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">我的行程列表</h2>
          <router-link 
            to="/planner" 
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            新建行程
          </router-link>
        </div>

        <!-- 行程列表 -->
        <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div v-if="loading" class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">加载中...</p>
          </div>

          <div v-else-if="trips.length === 0" class="p-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">暂无行程</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">开始创建您的第一个旅行计划吧！</p>
            <div class="mt-6">
              <router-link 
                to="/planner" 
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                创建新行程
              </router-link>
            </div>
          </div>

          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div 
              v-for="trip in trips" 
              :key="trip.id"
              class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              @click="viewTrip(trip.id)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span class="text-white font-semibold text-lg">{{ trip.destination.charAt(0) }}</span>
                    </div>
                  </div>
                  <div>
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">{{ trip.title }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ trip.startDate }} - {{ trip.endDate }} • {{ trip.days }}天 • {{ trip.travelers }}人
                    </p>
                  </div>
                </div>
                
                <div class="flex items-center space-x-4">
                  <span :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    trip.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    trip.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  ]">
                    {{ getStatusText(trip.status) }}
                  </span>
                  
                  <div class="flex space-x-2">
                    <button 
                      @click.stop="editTrip(trip.id)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      @click.stop="deleteTrip(trip.id)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="mt-4 flex items-center justify-between">
                <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ trip.destination }}
                  </span>
                  <span class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ trip.budget ? `¥${trip.budget}` : '预算未设置' }}
                  </span>
                </div>
                
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  创建于 {{ formatDate(trip.createdAt) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="trips.length > 0" class="mt-6 flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            显示第 1 到 {{ trips.length }} 条，共 {{ trips.length }} 条记录
          </div>
          <div class="flex space-x-2">
            <button 
              :disabled="currentPage === 1"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button 
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavigationBar from '@/components/NavigationBar.vue'

const router = useRouter()
const loading = ref(true)
const currentPage = ref(1)

const stats = ref({
  totalTrips: 0,
  activeTrips: 0,
  totalDays: 0
})

const trips = ref([
  {
    id: '1',
    title: '北京文化之旅',
    destination: '北京',
    startDate: '2024-01-15',
    endDate: '2024-01-18',
    days: 4,
    travelers: 2,
    budget: 5000,
    status: 'completed',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '2',
    title: '上海美食探索',
    destination: '上海',
    startDate: '2024-02-20',
    endDate: '2024-02-23',
    days: 4,
    travelers: 1,
    budget: 3000,
    status: 'active',
    createdAt: '2024-02-15T14:30:00Z'
  },
  {
    id: '3',
    title: '杭州西湖休闲游',
    destination: '杭州',
    startDate: '2024-03-10',
    endDate: '2024-03-12',
    days: 3,
    travelers: 3,
    budget: 2000,
    status: 'planned',
    createdAt: '2024-03-01T09:15:00Z'
  }
])

onMounted(() => {
  loadDashboardData()
})

const loadDashboardData = () => {
  // 模拟加载数据
  setTimeout(() => {
    stats.value = {
      totalTrips: trips.value.length,
      activeTrips: trips.value.filter(trip => trip.status === 'active').length,
      totalDays: trips.value.reduce((sum, trip) => sum + trip.days, 0)
    }
    loading.value = false
  }, 1000)
}

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'planned': '计划中',
    'active': '进行中',
    'completed': '已完成'
  }
  return statusMap[status] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const viewTrip = (tripId: string) => {
  router.push(`/trip/${tripId}`)
}

const editTrip = (tripId: string) => {
  router.push(`/planner?edit=${tripId}`)
}

const deleteTrip = (tripId: string) => {
  if (confirm('确定要删除这个行程吗？')) {
    // 模拟删除操作
    trips.value = trips.value.filter(trip => trip.id !== tripId)
    loadDashboardData() // 重新加载统计数据
  }
}
</script>