<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 导航栏 -->
    <NavigationBar />

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
            返回行程详情
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

        <!-- 地图页面内容 -->
        <div v-else class="space-y-6">
          <!-- 页面标题 -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ trip.title }} - 行程地图</h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">{{ trip.destination }} | {{ trip.start_date }} - {{ trip.end_date }}</p>
              </div>
              
              <!-- 日期选择器 -->
              <div class="flex items-center space-x-4">
                <button 
                  @click="previousDay"
                  :disabled="currentDayIndex === 0"
                  class="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <select 
                  v-model="currentDayIndex" 
                  @change="updateMap"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option 
                    v-for="(day, index) in trip.days" 
                    :key="day.day" 
                    :value="index"
                  >
                    第{{ day.day }}天 - {{ day.date }}
                  </option>
                </select>
                
                <button 
                  @click="nextDay"
                  :disabled="currentDayIndex === trip.days.length - 1"
                  class="p-2 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- 地图容器 -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- 左侧：地图 -->
            <div class="lg:col-span-3">
              <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div id="map-container" class="w-full h-96"></div>
              </div>
            </div>

            <!-- 右侧：地点列表 -->
            <div class="lg:col-span-1">
              <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  第{{ currentDay.day }}天行程地点
                </h3>
                
                <div class="space-y-3">
                  <div 
                    v-for="(location, index) in currentDayLocations" 
                    :key="index"
                    class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    @click="focusOnLocation(location)"
                  >
                    <div class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold mr-3">
                      {{ index + 1 }}
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ location.name }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ location.timePeriod }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 行程详情卡片 -->
          <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              第{{ currentDay.day }}天行程详情
            </h3>
            
            <div class="space-y-4">
              <!-- 上午 -->
              <div v-if="currentDay.morning && currentDay.morning.length > 0" class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <svg class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span class="font-medium text-blue-800 dark:text-blue-200">上午</span>
                </div>
                <ul class="space-y-2">
                  <li 
                    v-for="(activity, index) in currentDay.morning" 
                    :key="index"
                    class="flex items-center text-sm text-blue-700 dark:text-blue-300"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ formatActivity(activity) }}
                  </li>
                </ul>
              </div>
              
              <!-- 下午 -->
              <div v-if="currentDay.afternoon && currentDay.afternoon.length > 0" class="bg-orange-50 dark:bg-orange-900 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <svg class="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span class="font-medium text-orange-800 dark:text-orange-200">下午</span>
                </div>
                <ul class="space-y-2">
                  <li 
                    v-for="(activity, index) in currentDay.afternoon" 
                    :key="index"
                    class="flex items-center text-sm text-orange-700 dark:text-orange-300"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ formatActivity(activity) }}
                  </li>
                </ul>
              </div>
              
              <!-- 晚上 -->
              <div v-if="currentDay.evening && currentDay.evening.length > 0" class="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <svg class="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span class="font-medium text-purple-800 dark:text-purple-200">晚上</span>
                </div>
                <ul class="space-y-2">
                  <li 
                    v-for="(activity, index) in currentDay.evening" 
                    :key="index"
                    class="flex items-center text-sm text-purple-700 dark:text-purple-300"
                  >
                    <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ formatActivity(activity) }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavigationBar from '@/components/NavigationBar.vue'
import TripService, { type Trip } from '@/services/tripService'

const router = useRouter()
const route = useRoute()

const trip = ref({
  id: '',
  title: '',
  destination: '',
  origin: '',
  start_date: '',
  end_date: '',
  days_count: 0,
  days: []
})

const loading = ref(true)
const error = ref('')
const currentDayIndex = ref(0)
let map: any = null
let markers: any[] = []
let polyline: any = null

// 计算属性
const currentDay = computed(() => {
  console.log(trip.value.days)
  return trip.value.days[currentDayIndex.value] || {}
})

const currentDayLocations = computed(() => {
  const locations: Array<{name: string, timePeriod: string}> = []
  
  // 如果是第一天以外的情况，添加前一天的最后一个地点
  if (currentDayIndex.value > 0) {
    const previousDay = trip.value.days[currentDayIndex.value - 1]
    if (previousDay && previousDay.evening && previousDay.evening.length > 0) {
      const lastActivity = previousDay.evening[previousDay.evening.length - 1]
      const activityText = typeof lastActivity === 'string' ? lastActivity : lastActivity.location
      // const locationName = extractLocationName(activityText)
      const locationName = activityText
      if (locationName) {
        locations.push({
          name: locationName,
          timePeriod: '前一天晚上'
        })
      }
    }
  }
  
  // 添加当天的所有地点
  const timePeriods = [
    { period: 'morning', label: '上午' },
    { period: 'afternoon', label: '下午' },
    { period: 'evening', label: '晚上' }
  ]
  
  for (const { period, label } of timePeriods) {
    if (currentDay.value && currentDay.value[period]) {
      for (const activity of currentDay.value[period]) {
        // 处理新的活动对象格式或旧的字符串格式
        const activityText = typeof activity === 'string' ? activity : activity.location
        // const locationName = extractLocationName(activityText)
        const locationName = activityText
        if (locationName) {
          locations.push({
            name: locationName,
            timePeriod: label
          })
        }
      }
    }
  }
  
  return locations
})

// 生命周期
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
    
    // 先设置loading为false，让地图容器渲染
    loading.value = false
    
    // 等待DOM完全渲染后再初始化地图
    await nextTick()
    
    // 初始化地图
    await initMap()
    
    console.log('行程地图页面加载成功:', tripData)
  } catch (err) {
    console.error('加载行程详情失败:', err)
    error.value = '加载行程详情失败，请稍后重试'
    loading.value = false
  }
})

onUnmounted(() => {
  // 清理地图资源
  if (map) {
    map.destroy()
  }
})

// 方法
const goBack = () => {
  router.push(`/trip/${trip.value.id}`)
}

const previousDay = () => {
  if (currentDayIndex.value > 0) {
    currentDayIndex.value--
    updateMap()
  }
}

const nextDay = () => {
  if (currentDayIndex.value < trip.value.days.length - 1) {
    currentDayIndex.value++
    updateMap()
  }
}

const initMap = async () => {
  // 动态加载高德地图API
  await loadAMapScript()
  
  // 确保地图容器元素存在
  const mapContainer = document.getElementById('map-container')
  if (!mapContainer) {
    console.error('地图容器元素未找到')
    throw new Error('Map container div not exist')
  }
  
  // 初始化地图
  map = new (window as any).AMap.Map('map-container', {
    zoom: 13,
    center: [116.397428, 39.90923], // 默认北京中心
    viewMode: '3D'
  })
  
  // 初始更新地图
  updateMap()
}

const loadAMapScript = async () => {
  return new Promise(async (resolve, reject) => {
    if ((window as any).AMap) {
      resolve(true)
      return
    }
    
    try {
      // 从后端API获取高德地图配置
      const response = await fetch('/api/map/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.data.isConfigured) {
        const apiKey = result.data.apiKey
        const script = document.createElement('script')
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geocoder,AMap.Polyline`
        script.onload = () => resolve(true)
        script.onerror = () => reject(new Error('高德地图API加载失败'))
        document.head.appendChild(script)
      } else {
        // 如果后端没有配置API Key，使用模拟地图功能
        console.warn('高德地图API Key未配置，使用模拟地图功能')
        // 模拟加载成功，但地图功能会受限
        setTimeout(() => resolve(true), 100)
      }
    } catch (error) {
      console.error('获取高德地图配置失败:', error)
      // 降级方案：使用模拟地图功能
      setTimeout(() => resolve(true), 100)
    }
  })
}

const updateMap = async () => {
  if (!map) return
  
  // 清除现有标记和路线
  clearMap()
  
  // 获取所有地点的坐标
  const coordinates: [number, number][] = []
  
  for (const location of currentDayLocations.value) {
    const coords = await getCoordinates(
      `${trip.value?.destination ?? ''} ${location.name ?? ''}`
    );
    if (coords) {
      coordinates.push(coords)
      
      // 添加标记
      const marker = new (window as any).AMap.Marker({
        position: coords,
        title: location.name,
        content: `
          <div class="bg-white p-2 rounded shadow-md">
            <div class="font-bold text-sm">${location.name}</div>
            <div class="text-xs text-gray-600">${location.timePeriod}</div>
          </div>
        `
      })
      
      map.add(marker)
      markers.push(marker)
    }
  }
  
  // 如果有多个坐标点，绘制路线
  if (coordinates.length > 1) {
    polyline = new (window as any).AMap.Polyline({
      path: coordinates,
      strokeColor: '#1890ff',
      strokeWeight: 6,
      strokeOpacity: 0.8
    })
    
    map.add(polyline)
  }
  
  // 调整地图视野
  if (coordinates.length > 0) {
    map.setFitView()
  }
}

const clearMap = () => {
  if (markers.length > 0) {
    map.remove(markers)
    markers = []
  }
  
  if (polyline) {
    map.remove(polyline)
    polyline = null
  }
}

const focusOnLocation = (location: any) => {
  if (location.coordinates && map) {
    map.setCenter(location.coordinates)
    map.setZoom(15)
  }
}

const extractLocationName = (activity: any): string => {
  if (typeof activity === 'string') {
    // 从字符串中提取地点信息
    const locationMatch = activity.match(/（([^）]+)）/)
    return locationMatch ? locationMatch[1] : activity
  } else if (typeof activity === 'object' && activity.location) {
    return activity.location
  }
  return activity.activity || activity
}

const formatActivity = (activity: any): string => {
  if (typeof activity === 'string') {
    return activity
  } else if (typeof activity === 'object') {
    return activity.location ? `${activity.activity}（${activity.location}）` : activity.activity
  }
  return activity
}

const getCoordinates = async (locationName: string): Promise<[number, number] | null> => {
  try {
    // 调用后端地理编码API
    const response = await fetch('/api/map/geocode', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: locationName
      })
    })
    
    const result = await response.json()
    
    if (result.success && result.data.coordinates) {
      return result.data.coordinates
    } else {
      // 如果API调用失败，使用模拟数据作为降级方案
      console.warn('地理编码API调用失败，使用模拟坐标:', result.message)
      
      // 模拟一些常见地点的坐标
      const mockCoordinates: { [key: string]: [number, number] } = {
        '北京故宫': [116.3974, 39.9093],
        '天安门广场': [116.3975, 39.9075],
        '颐和园': [116.2731, 39.9998],
        '长城': [116.0242, 40.3625],
        '上海外滩': [121.4903, 31.2222],
        '东方明珠': [121.4997, 31.2397],
        '杭州西湖': [120.1551, 30.2741],
        '广州塔': [113.3245, 23.1064]
      }
      
      // 如果找到模拟坐标，返回模拟数据
      if (mockCoordinates[locationName]) {
        return mockCoordinates[locationName]
      }
      
      // 默认返回北京坐标
      return [116.3974, 39.9093]
    }
  } catch (error) {
    console.error('获取坐标失败:', error)
    
    // 错误处理：使用模拟数据作为降级方案
    const mockCoordinates: { [key: string]: [number, number] } = {
      '北京故宫': [116.3974, 39.9093],
      '天安门广场': [116.3975, 39.9075],
      '颐和园': [116.2731, 39.9998],
      '长城': [116.0242, 40.3625],
      '上海外滩': [121.4903, 31.2222],
      '东方明珠': [121.4997, 31.2397],
      '杭州西湖': [120.1551, 30.2741],
      '广州塔': [113.3245, 23.1064]
    }
    
    // 如果找到模拟坐标，返回模拟数据
    if (mockCoordinates[locationName]) {
      return mockCoordinates[locationName]
    }
    
    // 默认返回北京坐标
    return [116.3974, 39.9093]
  }
}
</script>

<style scoped>
#map-container {
  min-height: 400px;
}
</style>