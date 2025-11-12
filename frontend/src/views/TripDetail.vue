<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 导航栏 -->
    <NavigationBar />

    <div class="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- 返回按钮 -->
        <div class="mb-6">
          <button 
            @click="goBack"
            class="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回行程列表
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600 dark:text-gray-400">加载中...</span>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 mb-8">
          <div class="flex items-center">
            <svg class="h-6 w-6 text-red-500 dark:text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="text-lg font-medium text-red-800 dark:text-red-200">加载失败</h3>
              <p class="text-red-700 dark:text-red-300">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- 行程头部信息 -->
        <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="h-16 w-16 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span class="text-white font-bold text-2xl">{{ trip.destination.charAt(0) }}</span>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ trip.title }}</h1>
                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {{ trip.destination }}
                  </span>
                  <span class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ trip.start_date }} - {{ trip.end_date }}
                  </span>
                  <span class="flex items-center">
                      <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      {{ trip.travelers_count }}人
                    </span>
                  <span class="flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ trip.budget ? `¥${trip.budget}` : '预算未设置' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <span :class="[
                'px-3 py-1 text-sm font-medium rounded-full',
                trip.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                trip.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              ]">
                {{ getStatusText(trip.status) }}
              </span>
              
              <div class="flex space-x-2">
                <button 
                  @click="shareTrip"
                  class="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                >
                  <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  分享
                </button>
              </div>
            </div>
          </div>
          
          <!-- 行程描述 -->
          <div class="mt-6">
            <p class="text-gray-600 dark:text-gray-400">{{ trip.description }}</p>
          </div>
        </div>

        <!-- 行程详情 -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- 左侧：每日行程 -->
          <div class="lg:col-span-3">
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">每日行程安排</h2>
              </div>
              
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                <div 
                  v-for="(day, dayIndex) in trip.days" 
                  :key="day.day"
                  class="p-6"
                >
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                      第{{ day.day }}天 - {{ day.date }}
                    </h3>
                    <span class="text-sm text-gray-500 dark:text-gray-400">{{ day.weather }}</span>
                  </div>
                  
                  <div class="space-y-4">
                    <!-- 上午 -->
                    <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                      <div class="flex items-center mb-2">
                        <svg class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span class="font-medium text-blue-800 dark:text-blue-200">上午</span>
                      </div>
                      <ul class="space-y-2">
                        <li 
                          v-for="(activity, index) in day.morning" 
                          :key="index"
                          class="flex items-center justify-between text-sm text-blue-700 dark:text-blue-300"
                        >
                          <div class="flex items-center">
                            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            {{ typeof activity === 'string' ? activity : activity.activity }}
                          </div>
                          <span v-if="typeof activity === 'object' && activity.budget_estimate !== undefined" 
                                :class="[
                                  'text-xs px-2 py-1 rounded cursor-pointer transition-colors',
                                  activity.ai_generated === true 
                                    ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700' 
                                    : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700'
                                ]"
                                @click="startEditBudget(dayIndex, 'morning', index, activity.budget_estimate)">
                            ¥{{ activity.budget_estimate }}
                            <span v-if="activity.ai_generated === false" class="text-xs ml-1">✓</span>
                          </span>
                        </li>
                      </ul>
                    </div>
                    
                    <!-- 下午 -->
                    <div class="bg-orange-50 dark:bg-orange-900 rounded-lg p-4">
                      <div class="flex items-center mb-2">
                        <svg class="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span class="font-medium text-orange-800 dark:text-orange-200">下午</span>
                      </div>
                      <ul class="space-y-2">
                        <li 
                          v-for="(activity, index) in day.afternoon" 
                          :key="index"
                          class="flex items-center justify-between text-sm text-orange-700 dark:text-orange-300"
                        >
                          <div class="flex items-center">
                            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            {{ typeof activity === 'string' ? activity : activity.activity }}
                          </div>
                          <span v-if="typeof activity === 'object' && activity.budget_estimate !== undefined" 
                                :class="[
                                  'text-xs px-2 py-1 rounded cursor-pointer transition-colors',
                                  activity.ai_generated === true 
                                    ? 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-700' 
                                    : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700'
                                ]"
                                @click="startEditBudget(dayIndex, 'afternoon', index, activity.budget_estimate)">
                            ¥{{ activity.budget_estimate }}
                            <span v-if="activity.ai_generated === false" class="text-xs ml-1">✓</span>
                          </span>
                        </li>
                      </ul>
                    </div>
                    
                    <!-- 晚上 -->
                    <div class="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
                      <div class="flex items-center mb-2">
                        <svg class="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span class="font-medium text-purple-800 dark:text-purple-200">晚上</span>
                      </div>
                      <ul class="space-y-2">
                        <li 
                          v-for="(activity, index) in day.evening" 
                          :key="index"
                          class="flex items-center justify-between text-sm text-purple-700 dark:text-purple-300"
                        >
                          <div class="flex items-center">
                            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            {{ typeof activity === 'string' ? activity : activity.activity }}
                          </div>
                          <span v-if="typeof activity === 'object' && activity.budget_estimate !== undefined" 
                                :class="[
                                  'text-xs px-2 py-1 rounded cursor-pointer transition-colors',
                                  activity.ai_generated === true 
                                    ? 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-700' 
                                    : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700'
                                ]"
                                @click="startEditBudget(dayIndex, 'evening', index, activity.budget_estimate)">
                            ¥{{ activity.budget_estimate }}
                            <span v-if="activity.ai_generated === false" class="text-xs ml-1">✓</span>
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <!-- 当日预算 -->
                  <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-600 dark:text-gray-400">当日预算：</span>
                      <span class="font-medium text-gray-900 dark:text-white">¥{{ day.budget }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：行程信息 -->
          <div class="lg:col-span-1">
            <div class="space-y-6">
              <!-- 总预算 -->
              <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">预算统计</h3>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">总预算</span>
                    <span 
                      class="font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded"
                      @click="editTotalBudget"
                    >¥{{ trip.budget }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">已分配</span>
                    <span class="font-medium text-gray-900 dark:text-white">¥{{ allocatedBudget }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600 dark:text-gray-400">剩余</span>
                    <span class="font-medium text-green-600 dark:text-green-400">¥{{ remainingBudget }}</span>
                  </div>
                </div>
                
                <!-- 预算说明 -->
                <div class="budget-legend mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                  <div class="flex items-center space-x-4">
                    <span class="flex items-center">
                      <span class="w-3 h-3 bg-blue-100 dark:bg-blue-800 border border-blue-200 dark:border-blue-700 rounded mr-2"></span>
                      AI生成预算
                    </span>
                    <span class="flex items-center">
                      <span class="w-3 h-3 bg-green-100 dark:bg-green-800 border border-green-200 dark:border-green-700 rounded mr-2"></span>
                      用户修改预算
                    </span>
                  </div>
                </div>
              </div>

              <!-- 交通信息 -->
              <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">交通信息</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center">
                    <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span class="text-gray-600 dark:text-gray-400">出发地：{{ trip.origin }}</span>
                  </div>
                  <div class="flex items-center">
                    <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span class="text-gray-600 dark:text-gray-400">目的地：{{ trip.destination }}</span>
                  </div>
                  <div class="flex items-center">
                    <svg class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-gray-600 dark:text-gray-400">行程天数：{{ trip.days_count }}天</span>
                  </div>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">操作</h3>
                <div class="space-y-2">
                  <button 
                    @click="viewMap"
                    class="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    查看地图
                  </button>
                  <button 
                    @click="printTrip"
                    class="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    打印行程
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 预算编辑模态框 -->
  <n-modal
    v-model:show="isEditingBudget"
    preset="dialog"
    title="编辑预算"
    positive-text="保存"
    negative-text="取消"
    @positive-click="saveEditBudget"
    @negative-click="cancelEditBudget"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          预算金额
        </label>
        <n-input
          v-model:value="editingBudgetValue"
          type="number"
          placeholder="请输入预算金额"
          @keyup.enter="saveEditBudget"
        />
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        原预算金额：¥{{ editingBudget.originalValue }}
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, NModal, NButton, NInput } from 'naive-ui'
import NavigationBar from '@/components/NavigationBar.vue'
import TripService, { type Trip } from '@/services/tripService'

const router = useRouter()
const route = useRoute()
const message = useMessage()

const trip = ref({
  id: '',
  title: '',
  destination: '',
  origin: '',
  start_date: '',
  end_date: '',
  days_count: 0,
  travelers_count: 1,
  budget: 0,
  status: 'draft',
  description: '',
  days: []
})

const loading = ref(true)
const error = ref('')

// 预算编辑相关状态
const editingBudget = ref({
  dayIndex: -1,
  timePeriod: '',
  activityIndex: -1,
  originalValue: 0
})

const editingBudgetValue = ref('')

// 计算是否正在编辑预算
const isEditingBudget = computed(() => {
  return editingBudget.value.dayIndex >= 0 && 
         editingBudget.value.timePeriod !== '' && 
         editingBudget.value.activityIndex >= 0
})

const allocatedBudget = computed(() => {
  return trip.value.days.reduce((sum, day) => sum + day.budget, 0)
})

const remainingBudget = computed(() => {
  return trip.value.budget - allocatedBudget.value
})

onMounted(async () => {
  const tripId = route.params.id as string
  
  if (!tripId) {
    error.value = '行程ID不能为空'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = ''
    
    // 从后端API获取行程详情
    const tripData = await TripService.getTripDetail(tripId)
    
    // 将数据库格式转换为前端显示格式
    const formattedTrip = TripService.formatTripForDisplay(tripData)
    trip.value = formattedTrip
    
    console.log('行程详情加载成功:', tripData)
  } catch (err) {
    console.error('加载行程详情失败:', err)
    error.value = '加载行程详情失败，请稍后重试'
  } finally {
    loading.value = false
  }
})

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'planned': '计划中',
    'active': '进行中',
    'completed': '已完成'
  }
  return statusMap[status] || status
}

const goBack = () => {
  router.push('/dashboard')
}

const editTrip = () => {
  router.push(`/planner?edit=${trip.value.id}`)
}

const shareTrip = () => {
  // 模拟分享功能
  const shareUrl = `${window.location.origin}/trip/${trip.value.id}`
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert('行程链接已复制到剪贴板！')
  })
}

// 编辑总预算
const editTotalBudget = () => {
  const newBudget = prompt('请输入新的总预算金额：', trip.value.budget.toString())
  if (newBudget && !isNaN(parseFloat(newBudget))) {
    trip.value.budget = parseFloat(newBudget)
    message.success('总预算更新成功')
  }
}

// 开始编辑预算
const startEditBudget = (dayIndex: number, timePeriod: string, activityIndex: number, currentValue: number) => {
  editingBudget.value = {
    dayIndex,
    timePeriod,
    activityIndex,
    originalValue: currentValue
  }
  editingBudgetValue.value = currentValue.toString()
}

// 取消编辑预算
const cancelEditBudget = () => {
  editingBudget.value = {
    dayIndex: -1,
    timePeriod: '',
    activityIndex: -1,
    originalValue: 0
  }
  editingBudgetValue.value = ''
}

// 保存预算修改
const saveEditBudget = async () => {
  if (!editingBudgetValue.value || isNaN(parseFloat(editingBudgetValue.value))) {
    message.error('请输入有效的预算金额')
    return
  }

  const newValue = parseFloat(editingBudgetValue.value)
  
  try {
    // 调用后端API更新预算
    await updateBudget(
      trip.value.id,
      editingBudget.value.dayIndex,
      editingBudget.value.timePeriod,
      editingBudget.value.activityIndex,
      newValue
    )
    
    // 更新前端数据
    const day = trip.value.days[editingBudget.value.dayIndex]
    const activities = day[editingBudget.value.timePeriod as keyof typeof day] as Array<{activity: string, location?: string, budget_estimate: number, ai_generated: boolean}>
    activities[editingBudget.value.activityIndex].budget_estimate = newValue
    activities[editingBudget.value.activityIndex].ai_generated = false // 标记为用户修改
    
    // 重新计算当日预算
    day.budget = day.morning.reduce((sum, item) => sum + item.budget_estimate, 0) +
                 day.afternoon.reduce((sum, item) => sum + item.budget_estimate, 0) +
                 day.evening.reduce((sum, item) => sum + item.budget_estimate, 0)
    
    message.success('预算更新成功')
    cancelEditBudget()
  } catch (error) {
    console.error('更新预算失败:', error)
    message.error('预算更新失败')
  }
}

// 更新预算的API调用
const updateBudget = async (tripId: string, dayIndex: number, timePeriod: string, activityIndex: number, newValue: number) => {
  try {
    // 获取对应的行程项目ID
    const day = trip.value.days[dayIndex]
    const activities = day[timePeriod as keyof typeof day] as Array<{activity: string, location?: string, budget_estimate: number}>
    
    // 在实际应用中，这里需要从后端获取行程项目的真实ID
    // 由于当前数据结构中没有保存项目ID，我们需要先获取行程详情来找到对应的项目ID
    const tripDetail = await TripService.getTripDetail(tripId)
    
    // 查找对应的行程项目ID
    const tripDay = tripDetail.trip_days[dayIndex]
    if (!tripDay) {
      throw new Error('找不到对应的行程天数')
    }
    
    // 根据时间周期和索引查找对应的项目
    let targetItemId = null
    let itemIndex = 0
    
    // 根据时间周期确定起始索引
    if (timePeriod === 'morning') {
      itemIndex = activityIndex
    } else if (timePeriod === 'afternoon') {
      itemIndex = (day.morning?.length || 0) + activityIndex
    } else if (timePeriod === 'evening') {
      itemIndex = (day.morning?.length || 0) + (day.afternoon?.length || 0) + activityIndex
    }
    
    // 查找对应的行程项目
    if (tripDay.trip_day_items && tripDay.trip_day_items.length > itemIndex) {
      targetItemId = tripDay.trip_day_items[itemIndex].id
    }
    
    if (!targetItemId) {
      throw new Error('找不到对应的行程项目')
    }
    
    // 调用后端API更新预算
    const response = await fetch(`/api/trips/${tripId}/day-items/${targetItemId}/budget`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ budget: newValue })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '更新预算失败')
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('更新预算API调用失败:', error)
    throw error
  }
}

const exportTrip = () => {
  alert('导出PDF功能开发中...')
}

const printTrip = () => {
  window.print()
}

const viewMap = () => {
  router.push(`/trip/${trip.value.id}/map`)
}
</script>