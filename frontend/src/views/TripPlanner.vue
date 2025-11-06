<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 导航栏 -->
    <NavigationBar />

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- 页面标题 -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">AI智能行程规划</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            让AI为您规划完美的旅行路线
          </p>
        </div>

        <!-- 规划表单 -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- 左侧：输入表单 -->
          <div class="lg:col-span-2">
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <form @submit.prevent="generatePlan">
                <!-- 目的地 -->
                <div class="mb-6">
                  <label for="destination" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    目的地
                  </label>
                  <input
                    id="destination"
                    v-model="form.destination"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="例如：北京、上海、杭州"
                  />
                </div>

                <!-- 日期范围 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label for="startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      开始日期
                    </label>
                    <input
                      id="startDate"
                      v-model="form.startDate"
                      type="date"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label for="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      结束日期
                    </label>
                    <input
                      id="endDate"
                      v-model="form.endDate"
                      type="date"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <!-- 预算和人数 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label for="budget" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      预算（元）
                    </label>
                    <input
                      id="budget"
                      v-model="form.budget"
                      type="number"
                      min="0"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="可选"
                    />
                  </div>
                  <div>
                    <label for="travelers" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      出行人数
                    </label>
                    <input
                      id="travelers"
                      v-model="form.travelers"
                      type="number"
                      min="1"
                      value="1"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <!-- 兴趣偏好 -->
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    兴趣偏好（可多选）
                  </label>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <label v-for="interest in interests" :key="interest.value" class="flex items-center">
                      <input
                        v-model="form.interests"
                        type="checkbox"
                        :value="interest.value"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">{{ interest.label }}</span>
                    </label>
                  </div>
                </div>

                <!-- 语音输入 -->
                <div class="mb-6">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    语音输入（可选）
                  </label>
                  <div class="flex space-x-2">
                    <button
                      type="button"
                      @click="toggleVoiceInput"
                      :class="[
                        'flex-1 px-4 py-2 rounded-md border transition-colors',
                        isRecording 
                          ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-200'
                          : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      ]"
                    >
                      {{ isRecording ? '停止录音' : '开始语音输入' }}
                    </button>
                    <button
                      type="button"
                      @click="clearVoiceInput"
                      class="px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      清除
                    </button>
                  </div>
                  <div v-if="voiceText" class="mt-2 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
                    <p class="text-sm text-blue-800 dark:text-blue-200">{{ voiceText }}</p>
                  </div>
                </div>

                <!-- 生成按钮 -->
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ loading ? 'AI规划中...' : '生成智能行程' }}
                </button>
              </form>
            </div>
          </div>

          <!-- 右侧：预览和结果 -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">行程预览</h3>
              
              <div v-if="loading" class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">AI正在为您规划行程...</p>
              </div>

              <div v-else-if="planResult" class="space-y-4">
                <div class="bg-green-50 dark:bg-green-900 p-4 rounded-md">
                  <h4 class="font-medium text-green-800 dark:text-green-200">{{ planResult.title }}</h4>
                  <p class="text-sm text-green-600 dark:text-green-300 mt-1">{{ planResult.summary }}</p>
                </div>
                
                <div class="space-y-3">
                  <div v-for="day in planResult.days" :key="day.day" class="border-l-4 border-blue-500 pl-4">
                    <h5 class="font-medium text-gray-900 dark:text-white">第{{ day.day }}天 - {{ day.date }}</h5>
                    <div class="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div>上午：{{ day.morning.join('、') }}</div>
                      <div>下午：{{ day.afternoon.join('、') }}</div>
                      <div>晚上：{{ day.evening.join('、') }}</div>
                    </div>
                  </div>
                </div>

                <button
                  @click="savePlan"
                  class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  保存行程
                </button>
              </div>

              <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p class="mt-2 text-sm">填写左侧表单，让AI为您规划完美行程</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import NavigationBar from '@/components/NavigationBar.vue'

const loading = ref(false)
const isRecording = ref(false)
const voiceText = ref('')
const planResult = ref<any>(null)

const interests = [
  { value: 'history', label: '历史文化' },
  { value: 'nature', label: '自然风光' },
  { value: 'food', label: '美食体验' },
  { value: 'shopping', label: '购物娱乐' },
  { value: 'adventure', label: '冒险运动' },
  { value: 'relaxation', label: '休闲放松' },
  { value: 'photography', label: '摄影打卡' },
  { value: 'family', label: '亲子活动' },
]

const form = reactive({
  destination: '',
  startDate: '',
  endDate: '',
  budget: '',
  travelers: 1,
  interests: [] as string[],
})

const toggleVoiceInput = () => {
  isRecording.value = !isRecording.value
  
  if (isRecording.value) {
    // 模拟语音识别结果
    setTimeout(() => {
      voiceText.value = '我想要去北京旅游，预算5000元，时间3天，喜欢历史文化和美食'
      isRecording.value = false
    }, 2000)
  }
}

const clearVoiceInput = () => {
  voiceText.value = ''
}

const generatePlan = async () => {
  if (!form.destination || !form.startDate || !form.endDate) {
    alert('请填写目的地和日期')
    return
  }

  loading.value = true
  
  // 模拟AI规划过程
  setTimeout(() => {
    planResult.value = {
      title: `${form.destination} ${form.startDate} - ${form.endDate} 行程`,
      summary: `为您规划的${form.destination}${form.budget ? ` ${form.budget}元预算` : ''}行程`,
      days: [
        {
          day: 1,
          date: form.startDate,
          morning: ['天安门广场参观', '故宫博物院游览'],
          afternoon: ['王府井午餐', '景山公园观景'],
          evening: ['全聚德烤鸭晚餐', '前门大街夜景']
        },
        {
          day: 2,
          date: new Date(new Date(form.startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          morning: ['八达岭长城游览'],
          afternoon: ['长城脚下农家乐午餐', '明十三陵参观'],
          evening: ['返回市区', '三里屯晚餐']
        },
        {
          day: 3,
          date: new Date(new Date(form.startDate).getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
          morning: ['颐和园游览'],
          afternoon: ['圆明园参观', '中关村科技体验'],
          evening: ['特色餐厅告别晚餐', '准备返程']
        }
      ]
    }
    loading.value = false
  }, 3000)
}

const savePlan = () => {
  if (planResult.value) {
    alert('行程保存成功！')
    // 这里应该调用API保存行程
  }
}
</script>