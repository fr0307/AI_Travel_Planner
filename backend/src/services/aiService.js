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
    const { destination, start_date, end_date, budget, travelers_count, preferences, interests } = params
    
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24))
    
    return `请为以下旅行需求生成详细的行程规划：

目的地：${destination}
旅行天数：${days}天
出发日期：${start_date}
结束日期：${end_date}
${budget ? `预算：${budget}元\n` : ''}${travelers_count ? `旅行人数：${travelers_count}人\n` : ''}${interests.length > 0 ? `兴趣偏好：${interests.join('、')}\n` : ''}

请生成包含以下信息的结构化行程规划：
1. 行程标题
2. 行程摘要
3. 每日详细安排（按上午、下午、晚上分段）
4. 推荐景点和活动
5. 预算建议

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
      "morning": ["上午活动1", "上午活动2"],
      "afternoon": ["下午活动1", "下午活动2"],
      "evening": ["晚上活动1", "晚上活动2"],
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
        const ai_plan_res = {
          id: `plan_${Date.now()}`,
          title: parsed.title || `${params.destination} ${params.start_date} - ${params.end_date} 行程`,
          destination: params.destination,
          duration_days: parsed.duration_days || Math.ceil((new Date(params.end_date) - new Date(params.start_date)) / (1000 * 60 * 60 * 24)),
          budget: parsed.budget || params.budget,
          summary: parsed.summary || `为您规划的${params.destination}${params.budget ? ` ${params.budget}元预算` : ''}行程`,
          days: parsed.days || this.generateFallbackItinerary(params),
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
   * 生成备用每日行程
   */
  generateFallbackItinerary(params) {
    const days = Math.ceil((new Date(params.end_date) - new Date(params.start_date)) / (1000 * 60 * 60 * 24))
    const itinerary = []

    for (let i = 0; i < days; i++) {
      itinerary.push({
        day: i + 1,
        date: new Date(new Date(params.start_date).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        morning: [`${params.destination}著名景点参观`],
        afternoon: ['当地特色餐厅午餐', '文化体验活动'],
        evening: ['晚餐', '夜景游览'],
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
}

// 创建单例实例
export const aiService = new AIService()

export default aiService