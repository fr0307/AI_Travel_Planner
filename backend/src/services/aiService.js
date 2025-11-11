import axios from 'axios'
import { createLogger } from '../middleware/logger.js'
import dotenv from 'dotenv'
import speechService from './speechService.js'

// 在路由文件中直接加载环境变量
dotenv.config()

const logger = createLogger('AIService')

/**
 * AI服务类 - 集成OpenAI API
 */
class AIService {
  constructor() {
    this.apiKey = process.env.AI_TRAVELER_OPENAI_API_KEY
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions'
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * 检查API是否可用
   */
  isAvailable() {
    return !!this.apiKey
  }

  /**
   * 生成AI行程规划
   */
  async generateTripPlan(params) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API密钥未配置，无法使用AI服务')
    }

    try {
      const prompt = this.buildTripPlanPrompt(params)
      
      const response = await this.client.post('', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行规划专家，擅长为用户制定详细、实用的旅行计划。请根据用户需求生成结构化的旅行规划。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      const aiResponse = response.data.choices[0].message.content
      return this.parseTripPlanResponse(aiResponse, params)
      
    } catch (error) {
      logger.error('OpenAI API调用失败:', error.response?.data || error.message)
      throw new Error('AI服务暂时不可用，请稍后重试')
    }
  }

  /**
   * 构建行程规划提示词
   */
  buildTripPlanPrompt(params) {
    const { destination, start_date, end_date, budget, travelers_count, preferences, interests, voice_text } = params
    
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24))
    
    let prompt = `请为以下旅行需求生成详细的行程规划：

目的地：${destination}
旅行天数：${days}天
出发日期：${start_date}
结束日期：${end_date}
${budget ? `预算：${budget}元\n` : ''}${travelers_count ? `旅行人数：${travelers_count}人\n` : ''}${interests.length > 0 ? `兴趣偏好：${interests.join('、')}\n` : ''}

`

    // 如果有语音识别结果，将其作为用户其他要求的参考
    if (voice_text) {
      prompt += `用户语音输入内容："${voice_text}"

重要提示：语音识别结果仅供参考，可能包含用户的额外要求或偏好描述。
但请注意，当语音识别结果与上述表单信息冲突时，请严格以表单信息为准。
表单信息是用户最终确认的准确数据。

`
    }

    prompt += `请生成包含以下信息的结构化行程规划：
1. 行程标题
2. 行程摘要
3. 每日详细安排（按上午、下午、晚上分段）
4. 推荐景点和活动
5. 预算建议

重要要求: 
1.对于每个活动，请同时提供活动地点（location）信息。
2.对于每个活动，请提供预算估计（budget_estimate），以元为单位。
3.每个时间段的活动数量不限定为两条, 可根据预计所需时间增减活动数量。
4.需要确保午餐、晚餐被包含在活动中
5.晚上最后一条活动必须是返回酒店，需要给出具体酒店名称

请以JSON格式返回，结构如下：
{
  "title": "行程标题",
  "summary": "行程摘要",
  "duration_days": 天数,
  "budget": 预算,
  "days": [
    {
      "day": 1,
      "date": "日期",
      "morning": [
        {
          "activity": "上午活动1",
          "location": "活动地点1",
          "budget_estimate": 预算金额
        },
        {
          "activity": "上午活动2", 
          "location": "活动地点2",
          "budget_estimate": 预算金额
        }
      ],
      "afternoon": [
        {
          "activity": "下午活动1",
          "location": "活动地点3",
          "budget_estimate": 预算金额
        },
        {
          "activity": "下午活动2",
          "location": "活动地点4",
          "budget_estimate": 预算金额
        }
      ],
      "evening": [
        {
          "activity": "晚上活动1",
          "location": "活动地点5",
          "budget_estimate": 预算金额
        },
        {
          "activity": "晚上活动2",
          "location": "活动地点6",
          "budget_estimate": 预算金额
        }
      ],
      "notes": "注意事项"
    }
  ],
  "recommendations": [
    {
      "name": "景点名称",
      "type": "景点类型",
      "rating": 评分,
      "price": 价格
    }
  ]
}`

    return prompt
  }

  /**
   * 解析AI返回的行程规划
   */
  parseTripPlanResponse(aiResponse, params) {
    try {
      // 尝试从AI响应中提取JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log("json match")
        const parsed = JSON.parse(jsonMatch[0])
        
        // 处理days数据，兼容新旧格式
        let processedDays = parsed.days || this.generateFallbackItinerary(params)
        
        // 如果days存在且是数组，处理每个day的活动数据
        if (Array.isArray(processedDays)) {
          processedDays = processedDays.map(day => {
            // 处理morning活动
            if (Array.isArray(day.morning)) {
              day.morning = day.morning.map(item => {
                if (typeof item === 'string') {
                  // 旧格式：字符串，自动提取location
                  return {
                    activity: item,
                    location: this.extractLocationFromActivity(item),
                    budget_estimate: 0 // 默认预算为0
                  }
                }
                // 新格式：对象，确保有budget_estimate字段
                return {
                  activity: item.activity || item,
                  location: item.location || this.extractLocationFromActivity(item.activity || item),
                  budget_estimate: item.budget_estimate || 0
                }
              })
            }
            
            // 处理afternoon活动
            if (Array.isArray(day.afternoon)) {
              day.afternoon = day.afternoon.map(item => {
                if (typeof item === 'string') {
                  // 旧格式：字符串，自动提取location
                  return {
                    activity: item,
                    location: this.extractLocationFromActivity(item),
                    budget_estimate: 0 // 默认预算为0
                  }
                }
                // 新格式：对象，确保有budget_estimate字段
                return {
                  activity: item.activity || item,
                  location: item.location || this.extractLocationFromActivity(item.activity || item),
                  budget_estimate: item.budget_estimate || 0
                }
              })
            }
            
            // 处理evening活动
            if (Array.isArray(day.evening)) {
              day.evening = day.evening.map(item => {
                if (typeof item === 'string') {
                  // 旧格式：字符串，自动提取location
                  return {
                    activity: item,
                    location: this.extractLocationFromActivity(item),
                    budget_estimate: 0 // 默认预算为0
                  }
                }
                // 新格式：对象，确保有budget_estimate字段
                return {
                  activity: item.activity || item,
                  location: item.location || this.extractLocationFromActivity(item.activity || item),
                  budget_estimate: item.budget_estimate || 0
                }
              })
            }
            
            return day
          })
        }
        
        const ai_plan_res = {
          id: `plan_${Date.now()}`,
          title: parsed.title || `${params.destination} ${params.start_date} - ${params.end_date} 行程`,
          departure: params.departure,
          destination: params.destination,
          duration_days: parsed.duration_days || Math.ceil((new Date(params.end_date) - new Date(params.start_date)) / (1000 * 60 * 60 * 24)),
          budget: parsed.budget || params.budget,
          summary: parsed.summary || `为您规划的${params.destination}${params.budget ? ` ${params.budget}元预算` : ''}行程`,
          days: processedDays,
          recommendations: parsed.recommendations || this.generateFallbackRecommendations(params),
          created_at: new Date().toISOString(),
        }

        return ai_plan_res
      }
    } catch (error) {
      logger.warn('AI响应解析失败，使用备用方案:', error)
    }

    // 如果解析失败，使用备用方案
    return this.generateFallbackPlan(params)
  }

  /**
   * 生成备用行程规划
   */
  generateFallbackPlan(params) {
    return {
      id: `plan_${Date.now()}`,
      title: `${params.destination} ${params.start_date} - ${params.end_date} 行程`,
      destination: params.destination,
      duration_days: Math.ceil((new Date(params.end_date) - new Date(params.start_date)) / (1000 * 60 * 60 * 24)),
      budget: params.budget,
      summary: `为您规划的${params.destination}${params.budget ? ` ${params.budget}元预算` : ''}行程`,
      days: this.generateFallbackItinerary(params),
      recommendations: this.generateFallbackRecommendations(params),
      created_at: new Date().toISOString(),
    }
  }

  /**
   * 从活动描述中提取地点信息
   */
  extractLocationFromActivity(activity) {
    // 简单的规则提取地点信息
    const locationPatterns = [
      /在(.+?)进行/,
      /到(.+?)参观/,
      /前往(.+?)(?:游玩|游览|参观)/,
      /在(.+?)(?:用餐|吃饭|就餐)/,
      /(.+?)景区/,
      /(.+?)景点/,
      /(.+?)公园/,
      /(.+?)博物馆/,
      /(.+?)餐厅/,
      /(.+?)酒店/,
    ]
    
    for (const pattern of locationPatterns) {
      const match = activity.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    // 如果无法提取，返回默认地点
    return '待定地点'
  }

  /**
   * 生成备用每日行程
   */
  generateFallbackItinerary(params) {
    const days = Math.ceil((new Date(params.end_date) - new Date(params.start_date)) / (1000 * 60 * 60 * 24))
    const itinerary = []

    for (let i = 0; i < days; i++) {
      itinerary.push({
        day: i + 1,
        date: new Date(new Date(params.start_date).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        morning: [
          {
            activity: `${params.destination}著名景点参观`,
            location: `${params.destination}主要景区`,
            budget_estimate: 50 // 默认景点门票预算
          }
        ],
        afternoon: [
          {
            activity: '当地特色餐厅午餐',
            location: `${params.destination}特色餐厅`,
            budget_estimate: 80 // 默认午餐预算
          },
          {
            activity: '文化体验活动',
            location: `${params.destination}文化中心`,
            budget_estimate: 60 // 默认文化体验预算
          }
        ],
        evening: [
          {
            activity: '晚餐',
            location: `${params.destination}餐厅`,
            budget_estimate: 100 // 默认晚餐预算
          },
          {
            activity: '夜景游览',
            location: `${params.destination}夜景观赏点`,
            budget_estimate: 30 // 默认夜景游览预算
          }
        ],
        notes: '根据您的偏好调整的具体安排',
      })
    }

    return itinerary
  }

  /**
   * 生成备用推荐
   */
  generateFallbackRecommendations(params) {
    const baseRecommendations = {
      attractions: [
        { name: '著名景点1', type: '历史古迹', rating: 4.8, price: 60 },
        { name: '著名景点2', type: '自然风光', rating: 4.9, price: 45 },
        { name: '城市地标', type: '城市地标', rating: 4.7, price: 0 },
        { name: '公园园林', type: '公园园林', rating: 4.6, price: 30 },
        { name: '购物街区', type: '购物街区', rating: 4.5, price: 0 },
      ]
    }

    return baseRecommendations.attractions
  }

  /**
   * 语音识别处理 - 使用科大讯飞服务
   */
  async speechToText(audioData, format = 'audio/L16;rate=16000') {
    try {
      // 检查科大讯飞配置是否可用
      if (!process.env.IFLYTEK_APP_ID || !process.env.IFLYTEK_API_KEY || !process.env.IFLYTEK_API_SECRET) {
        logger.warn('科大讯飞配置不完整，使用模拟语音识别')
        return this.fallbackSpeechToText()
      }
      
      // 使用科大讯飞语音识别服务
      const result = await speechService.processAudioData(audioData)
      
      logger.info(`语音识别成功: ${result.text.substring(0, 50)}...`)
      return result
      
    } catch (error) {
      logger.error('科大讯飞语音识别失败，使用模拟数据:', error)
      return this.fallbackSpeechToText()
    }
  }
  
  /**
   * 备用语音识别（模拟实现）
   */
  fallbackSpeechToText() {
    return {
      text: '我想要规划一个去北京的旅行，预算5000元，时间3天',
      confidence: 0.95,
      duration: 3.2,
      fallback: true
    }
  }

  /**
   * 智能推荐（模拟实现）
   */
  async generateRecommendations(params) {
    // 这里可以集成真实的地图和推荐服务
    // 目前返回模拟数据
    const baseRecommendations = {
      attractions: [
        { name: '著名景点1', type: '历史古迹', rating: 4.8, price: 60 },
        { name: '著名景点2', type: '自然风光', rating: 4.9, price: 45 },
        { name: '城市地标', type: '城市地标', rating: 4.7, price: 0 },
        { name: '公园园林', type: '公园园林', rating: 4.6, price: 30 },
        { name: '购物街区', type: '购物街区', rating: 4.5, price: 0 },
      ]
    }

    return baseRecommendations[params.type] || baseRecommendations.attractions
  }

  /**
   * 智能提取表单信息
   * 使用大模型从语音识别文本中智能提取旅行规划相关的表单信息
   */
  async extractFormInfoFromSpeech(text) {
    if (!this.isAvailable()) {
      logger.warn('OpenAI API不可用，使用基于规则的简单提取')
      return this.simpleFormExtraction(text)
    }

    try {
      // 获取当前时间信息
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1 // 月份从0开始，需要+1
      const currentDay = now.getDate()

      const prompt = `你是一个专业的旅行规划助手。请从用户的语音输入中智能提取旅行规划相关的表单信息。

当前时间：${currentYear}年${currentMonth}月${currentDay}日
用户语音输入："${text}"

请严格按照以下JSON格式返回识别结果，只返回JSON，不要有其他内容：
{
  "destination": "目的地名称，如：北京、上海、杭州",
  "budget": "预算金额（纯数字），如：5000",
  "duration_days": "旅行天数（纯数字），如：3",
  "travelers_count": "出行人数（纯数字），如：2",
  "interests": ["兴趣标签数组，如：["history", "nature", "food"]"],
  "start_date": "开始日期（YYYY-MM-DD格式），如：2024-01-15",
  "end_date": "结束日期（YYYY-MM-DD格式），如：2024-01-18"
}

提取规则：
1. 只提取明确提到的信息，没有提到的字段保持为空字符串或空数组
2. 目的地：提取明确提到的城市或景点名称
3. 预算：提取数字+货币单位（如5000元、3000块）
4. 天数：提取数字+天/日（如3天、5日）
5. 人数：提取数字+人（如2人、一家三口）
6. 兴趣：根据关键词匹配（历史/文化→history，自然/风光→nature，美食/吃→food）
7. 日期：提取明确的日期信息，如果没有则保持为空
8. 对于日期信息，如果用户只提到月份或日期，请结合当前时间自动补全年份

重要提示：
1. 对于日期信息，如果用户只提供月份和日期，请默认使用当前年份
2. 如果用户只提供月份，请使用当前年份和当前日期
3. 如果用户只提供日期，请使用当前年份和当前月份
4. 确保所有日期都符合YYYY-MM-DD格式

请确保返回的是有效的JSON格式。`

      const response = await this.client.post('', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的旅行规划助手，擅长从自然语言中提取结构化信息。请严格按照指定的JSON格式返回结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // 低温度确保一致性
        max_tokens: 500
      })

      const aiResponse = response.data.choices[0].message.content
      
      // 尝试从响应中提取JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const extractedInfo = JSON.parse(jsonMatch[0])
        
        // 验证和清理数据
        return this.validateFormInfo(extractedInfo)
      }
      
      // 如果无法解析JSON，使用简单规则提取
      return this.simpleFormExtraction(text)
      
    } catch (error) {
      logger.error('大模型表单信息提取失败，使用简单规则:', error)
      return this.simpleFormExtraction(text)
    }
  }

  /**
   * 基于规则的简单表单信息提取（降级方案）
   */
  simpleFormExtraction(text) {
    const lowerText = text.toLowerCase()
    const result = {
      destination: '',
      budget: '',
      duration_days: '',
      travelers_count: '',
      interests: [],
      start_date: '',
      end_date: ''
    }

    // 获取当前时间信息
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const currentDay = now.getDate()

    // 匹配目的地
    const destinationMatch = lowerText.match(/去(\S+)/) || lowerText.match(/到(\S+)/) || lowerText.match(/想去(\S+)/)
    if (destinationMatch && destinationMatch[1]) {
      result.destination = destinationMatch[1].trim()
    }

    // 匹配预算
    const budgetMatch = lowerText.match(/(\d+)[元块]/) || lowerText.match(/预算(\d+)/)
    if (budgetMatch && budgetMatch[1]) {
      result.budget = budgetMatch[1]
    }

    // 匹配天数
    const daysMatch = lowerText.match(/(\d+)[天日]/) || lowerText.match(/时间(\d+)/)
    if (daysMatch && daysMatch[1]) {
      result.duration_days = daysMatch[1]
      // 使用当前日期作为开始日期
      const startDate = new Date()
      const endDate = new Date(startDate.getTime() + parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000)
      result.start_date = startDate.toISOString().split('T')[0]
      result.end_date = endDate.toISOString().split('T')[0]
    }

    // 匹配具体日期（月份和日期）
    const monthDayMatch = lowerText.match(/(\d+)月(\d+)日/) || lowerText.match(/(\d+)\.(\d+)/)
    if (monthDayMatch && monthDayMatch[1] && monthDayMatch[2]) {
      const month = parseInt(monthDayMatch[1])
      const day = parseInt(monthDayMatch[2])
      // 使用当前年份
      result.start_date = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    }

    // 匹配月份
    const monthMatch = lowerText.match(/(\d+)月/)
    if (monthMatch && monthMatch[1]) {
      const month = parseInt(monthMatch[1])
      // 使用当前年份和当前日期
      result.start_date = `${currentYear}-${month.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}`
    }

    // 匹配人数
    const travelersMatch = lowerText.match(/(\d+)人/) || lowerText.match(/(\d+)个/)
    if (travelersMatch && travelersMatch[1]) {
      result.travelers_count = travelersMatch[1]
    }

    // 匹配兴趣偏好
    if (lowerText.includes('历史') || lowerText.includes('文化')) {
      result.interests.push('history')
    }
    if (lowerText.includes('自然') || lowerText.includes('风光')) {
      result.interests.push('nature')
    }
    if (lowerText.includes('美食') || lowerText.includes('吃')) {
      result.interests.push('food')
    }

    return result
  }

  /**
   * 验证和清理表单信息
   */
  validateFormInfo(formInfo) {
    const validated = { ...formInfo }

    // 清理字符串字段
    if (validated.destination && typeof validated.destination === 'string') {
      validated.destination = validated.destination.trim()
    }

    // 确保数字字段是字符串格式
    if (validated.budget && typeof validated.budget === 'number') {
      validated.budget = validated.budget.toString()
    }
    if (validated.duration_days && typeof validated.duration_days === 'number') {
      validated.duration_days = validated.duration_days.toString()
    }
    if (validated.travelers_count && typeof validated.travelers_count === 'number') {
      validated.travelers_count = validated.travelers_count.toString()
    }

    // 确保interests是数组
    if (!Array.isArray(validated.interests)) {
      validated.interests = []
    }

    // 过滤无效的兴趣标签
    const validInterests = ['history', 'nature', 'food', 'shopping', 'adventure']
    validated.interests = validated.interests.filter(interest => 
      validInterests.includes(interest)
    )

    return validated
  }
}

// 创建单例实例
export const aiService = new AIService()

export default aiService