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
                  <p v-if="planResult.budget" class="text-sm text-green-600 dark:text-green-300 mt-1">预算: {{ planResult.budget }}元</p>
                  <p class="text-sm text-green-600 dark:text-green-300 mt-1">行程天数: {{ planResult.duration_days }}天</p>
                </div>
                
                <div class="space-y-3">
                  <div v-for="day in planResult.days" :key="day.day" class="border-l-4 border-blue-500 pl-4">
                    <h5 class="font-medium text-gray-900 dark:text-white">第{{ day.day }}天 - {{ day.date }}</h5>
                    <div class="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div>上午：{{ day.morning.join('、') }}</div>
                      <div>下午：{{ day.afternoon.join('、') }}</div>
                      <div>晚上：{{ day.evening.join('、') }}</div>
                    </div>
                    <p v-if="day.notes" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ day.notes }}</p>
                  </div>
                </div>

                <div v-if="planResult.recommendations && planResult.recommendations.length > 0" class="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
                  <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-2">推荐景点</h4>
                  <div class="space-y-2">
                    <div v-for="rec in planResult.recommendations" :key="rec.name" class="text-sm text-blue-700 dark:text-blue-300">
                      <strong>{{ rec.name }}</strong> ({{ rec.type }}) - 评分: {{ rec.rating }}/5 - 价格: {{ rec.price }}元
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
import { aiService, type AITripPlanRequest, type TripPlan } from '@/services/ai'

const loading = ref(false)
const isRecording = ref(false)
const voiceText = ref('')
const planResult = ref<TripPlan | null>(null)

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

const toggleVoiceInput = async () => {
  if (isRecording.value) {
    // 停止录音
    isRecording.value = false
    return
  }
  
  // 开始录音
  isRecording.value = true
  
  try {
    // 检查浏览器是否支持录音
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('您的浏览器不支持录音功能')
    }
    
    // 获取麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // 创建音频上下文，设置采样率为16kHz以匹配科大讯飞要求
    const audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    
    // 创建录音处理器
    const processor = audioContext.createScriptProcessor(2048, 1, 1)
    
    let audioData: Int16Array[] = []
    
    processor.onaudioprocess = (event) => {
      if (!isRecording.value) return
      
      const inputData = event.inputBuffer.getChannelData(0)
      const int16Data = new Int16Array(inputData.length)
      
      // 转换为16位PCM数据
      for (let i = 0; i < inputData.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
      }
      
      audioData.push(int16Data)
    }
    
    source.connect(processor)
    processor.connect(audioContext.destination)
    
    // 录音5秒后自动停止
    setTimeout(async () => {
      if (isRecording.value) {
        isRecording.value = false
        
        // 停止录音
        stream.getTracks().forEach(track => track.stop())
        processor.disconnect()
        source.disconnect()
        audioContext.close()
        
        // 合并音频数据
        const totalLength = audioData.reduce((sum, arr) => sum + arr.length, 0)
        const mergedData = new Int16Array(totalLength)
        
        let offset = 0
        audioData.forEach(arr => {
          mergedData.set(arr, offset)
          offset += arr.length
        })
        
        // 发送到后端进行语音识别
        try {
          const result = await aiService.speechToText(mergedData)
          voiceText.value = result.text
          
          // 如果语音识别成功，自动填充表单
          if (result.text && !result.fallback) {
            autoFillFormFromSpeech(result.text)
          }
        } catch (error: any) {
          console.error('语音识别失败:', error)
          voiceText.value = '语音识别失败，请手动输入'
        }
      }
    }, 5000)
    
  } catch (error: any) {
    console.error('录音失败:', error)
    isRecording.value = false
    voiceText.value = '录音失败，请检查麦克风权限'
  }
}

const clearVoiceInput = () => {
  voiceText.value = ''
}

const autoFillFormFromSpeech = (text: string) => {
  // 简单的关键词匹配来自动填充表单
  const lowerText = text.toLowerCase()
  console.log(lowerText)
  
  // 匹配目的地
  const destinationMatch = lowerText.match(/去(\S+)/) || lowerText.match(/到(\S+)/)
  if (destinationMatch && destinationMatch[1]) {
    form.destination = destinationMatch[1]
  }
  
  // 匹配预算
  const budgetMatch = lowerText.match(/(\d+)元/) || lowerText.match(/预算(\d+)/)
  if (budgetMatch && budgetMatch[1]) {
    form.budget = budgetMatch[1]
  }
  
  // 匹配天数
  const daysMatch = lowerText.match(/(\d+)天/) || lowerText.match(/时间(\d+)/)
  if (daysMatch && daysMatch[1]) {
    const days = parseInt(daysMatch[1])
    if (form.startDate) {
      const startDate = new Date(form.startDate)
      const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)
      form.endDate = endDate.toISOString().split('T')[0]
    }
  }
  
  // 匹配兴趣偏好
  if (lowerText.includes('历史') || lowerText.includes('文化')) {
    if (!form.interests.includes('history')) {
      form.interests.push('history')
    }
  }
  if (lowerText.includes('自然') || lowerText.includes('风光')) {
    if (!form.interests.includes('nature')) {
      form.interests.push('nature')
    }
  }
  if (lowerText.includes('美食') || lowerText.includes('吃')) {
    if (!form.interests.includes('food')) {
      form.interests.push('food')
    }
  }
}

const generatePlan = async () => {
  if (!form.destination || !form.startDate || !form.endDate) {
    alert('请填写目的地和日期')
    return
  }

  loading.value = true
  
  try {
    const request: AITripPlanRequest = {
      destination: form.destination,
      start_date: form.startDate,
      end_date: form.endDate,
      budget: form.budget ? parseInt(form.budget) : undefined,
      travelers_count: form.travelers,
      interests: form.interests
    }

    const plan = await aiService.generateTripPlan(request)
    planResult.value = plan
  } catch (error: any) {
    console.error('AI行程规划失败:', error)
    alert(`AI行程规划失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const savePlan = () => {
  if (planResult.value) {
    alert('行程保存成功！')
    // 这里应该调用API保存行程
  }
}
</script>