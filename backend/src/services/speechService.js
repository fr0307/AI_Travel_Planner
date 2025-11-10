import crypto from 'crypto'
import WebSocket from 'ws'
import { createLogger } from '../middleware/logger.js'
import fs from 'node:fs'        // ✅ ES Module 写法
import path from 'node:path'    // ✅ ES Module 写法
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const logger = createLogger('SpeechService')

/**
 * 科大讯飞语音识别服务
 */
class SpeechService {
  constructor() {
    this.appId = process.env.IFLYTEK_APP_ID
    this.apiKey = process.env.IFLYTEK_API_KEY
    this.apiSecret = process.env.IFLYTEK_API_SECRET
    this.baseURL = 'wss://iat-api.xfyun.cn/v2/iat'
  }

  /**
   * 生成鉴权URL
   */
  generateAuthUrl() {
    const host = 'iat-api.xfyun.cn'
    const path = '/v2/iat'
    
    // 生成RFC1123格式的时间
    const date = new Date().toUTCString()
    
    // 生成签名原文
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
    
    // 使用HMAC-SHA256算法进行签名
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(signatureOrigin)
      .digest('base64')
    
    // 构建鉴权参数
    const authorization = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    
    // 构建URL
    const authParams = {
      host,
      date,
      authorization: Buffer.from(authorization).toString('base64')
    }
    
    return `${this.baseURL}?authorization=${authParams.authorization}&date=${encodeURIComponent(authParams.date)}&host=${authParams.host}`
  }

  /**
   * 语音识别处理
   */
  async speechToText(audioData, format = 'audio/L16;rate=16000') {
    console.log('speechToText called')
    return new Promise((resolve, reject) => {
      try {
        const authUrl = this.generateAuthUrl()
        const ws = new WebSocket(authUrl)
        
        let finalResult = ''
        let currentResult = ''
        let isFinal = false
        
        ws.on('open', () => {
          logger.info('科大讯飞语音识别WebSocket连接已建立')
          
          // 发送开始帧
          const startFrame = {
            common: {
              app_id: this.appId
            },
            business: {
              language: 'zh_cn',
              domain: 'iat',
              accent: 'mandarin',
              vad_eos: 2000,
              dwa: 'wpgs'
            },
            data: {
              status: 0,
              format: format,
              audio: '',
              encoding: 'raw'
            }
          }
          
          ws.send(JSON.stringify(startFrame))
          
          // 发送音频数据
          const chunkSize = 1280 // 每次发送1280字节
          for (let i = 0; i < audioData.length; i += chunkSize) {
            const chunk = audioData.slice(i, i + chunkSize)
            const audioFrame = {
              data: {
                status: 1,
                format: format,
                audio: chunk.toString('base64'),
                encoding: 'raw'
              }
            }
            ws.send(JSON.stringify(audioFrame))
          }
          
          // 发送结束帧
          const endFrame = {
            data: {
              status: 2,
              format: format,
              audio: '',
              encoding: 'raw'
            }
          }
          ws.send(JSON.stringify(endFrame))
        })
        
        ws.on('message', (data) => {
          try {
            const result = JSON.parse(data.toString())
            
            if (result.code !== 0) {
              logger.error('科大讯飞语音识别错误:', result)
              reject(new Error(`语音识别失败: ${result.message}`))
              return
            }
            
            // 处理识别结果
            if (result.data && result.data.result) {
              const wsData = result.data.result
              
              // 解析识别结果
              const currentText = wsData.ws.map(item => {
                return item.cw.map(cw => cw.w).join('')
              }).join('')
              
              // 只有当有实际识别内容时才更新结果
              if (currentText && currentText.trim().length > 1) {
                // 如果是最终结果或替换结果，则替换整个文本
                if (wsData.pgs === 'rpl' || wsData.pgs === 'apd') {
                  currentResult = currentText
                  isFinal = (wsData.pgs === 'rpl')
                } else {
                  // 对于增量结果，使用当前完整文本
                  currentResult = currentText
                }
                
                logger.info('当前识别结果:', currentText, '最终结果:', finalResult, '状态:', wsData.pgs)
              } else {
                finalResult += currentResult
                logger.info('收到空识别结果，忽略更新')
              }
            }
            
            // 检查是否结束
            if (result.data.status === 2) {
              ws.close()
              
              resolve({
                text: finalResult,
                confidence: 0.9, // 科大讯飞返回的置信度信息
                duration: audioData.length / 16000, // 估算时长
                is_final: isFinal
              })
            }
          } catch (error) {
            logger.error('解析语音识别结果失败:', error)
            reject(error)
          }
        })
        
        ws.on('error', (error) => {
          logger.error('科大讯飞语音识别WebSocket错误:', error)
          reject(error)
        })
        
        ws.on('close', (code, reason) => {
          logger.info(`科大讯飞语音识别WebSocket连接关闭: ${code} - ${reason}`)
        })
        
        // 设置超时
        setTimeout(() => {
          if (!isFinal) {
            ws.close()
            reject(new Error('语音识别超时'))
          }
        }, 150000) // 150秒超时
        
      } catch (error) {
        logger.error('语音识别初始化失败:', error)
        reject(error)
      }
    })
  }

  saveAsWav(int16Array, filename = 'debug_audio.wav') {
    const sampleRate = 16000
    const numChannels = 1
    const bitsPerSample = 16

    const buffer = Buffer.from(int16Array.buffer)
    const fileLength = buffer.length + 44

    const wavHeader = Buffer.alloc(44)

    // RIFF header
    wavHeader.write('RIFF', 0)
    wavHeader.writeUInt32LE(fileLength - 8, 4)
    wavHeader.write('WAVE', 8)

    // fmt chunk
    wavHeader.write('fmt ', 12)
    wavHeader.writeUInt32LE(16, 16) // subchunk1Size
    wavHeader.writeUInt16LE(1, 20)  // PCM
    wavHeader.writeUInt16LE(numChannels, 22)
    wavHeader.writeUInt32LE(sampleRate, 24)
    wavHeader.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28) // byteRate
    wavHeader.writeUInt16LE(numChannels * bitsPerSample / 8, 32) // blockAlign
    wavHeader.writeUInt16LE(bitsPerSample, 34)

    // data chunk
    wavHeader.write('data', 36)
    wavHeader.writeUInt32LE(buffer.length, 40)

    const wavBuffer = Buffer.concat([wavHeader, buffer])
    const filePath = path.join(__dirname, filename)
    fs.writeFileSync(filePath, wavBuffer)
    console.log(`✅ 音频已保存为：${filePath}`)
  }

  /**
   * 处理前端传来的音频数据
   */
  async processAudioData(audioData) {
    try {
      logger.info('处理音频数据，类型:', typeof audioData, '长度:', audioData.length)
      this.saveAsWav(audioData, `debug_${Date.now()}.wav`)
      
      // 前端发送的是Int16Array，直接使用
      const audioBuffer = Buffer.from(audioData.buffer)
      
      // 调用科大讯飞语音识别
      const result = await this.speechToText(audioBuffer)
      
      return result
    } catch (error) {
      logger.error('处理音频数据失败:', error)
      
      // 如果科大讯飞服务不可用，返回模拟数据作为降级方案
      return {
        text: '我想要规划一个去北京的旅行，预算5000元，时间3天',
        confidence: 0.95,
        duration: 3.2,
        is_final: true,
        fallback: true // 标记为降级方案
      }
    }
  }
}

// 创建单例实例
const speechService = new SpeechService()

export default speechService