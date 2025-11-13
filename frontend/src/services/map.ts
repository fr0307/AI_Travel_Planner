import { apiClient } from '@/utils/api'

// 地图配置接口
export interface MapConfig {
  isConfigured: boolean
  apiKey?: string
  provider: 'amap' | 'google' | 'baidu'
}

// 地理编码接口
export interface GeocodeRequest {
  address: string
}

export interface GeocodeResponse {
  success: boolean
  data: {
    lat: number
    lng: number
    formattedAddress: string
  }
}

// 地图配置响应接口
export interface MapConfigResponse {
  success: boolean
  data: MapConfig
}

// 地图服务类
export class MapService {
  /**
   * 获取地图配置信息
   */
  static async getMapConfig(): Promise<MapConfig> {
    try {
      const response = await apiClient.get<MapConfigResponse>('/map/config')
      
      if (!response.data.success) {
        throw new Error('获取地图配置失败')
      }
      
      return response.data.data
    } catch (error) {
      console.error('获取地图配置失败:', error)
      throw error
    }
  }

  /**
   * 地理编码 - 将地址转换为坐标
   */
  static async geocode(address: string): Promise<{ lat: number; lng: number; formattedAddress: string }> {
    try {
      const response = await apiClient.post<GeocodeResponse>('/map/geocode', {
        address
      })
      
      if (!response.data.success) {
        throw new Error('地理编码失败')
      }
      
      return response.data.data
    } catch (error) {
      console.error('地理编码失败:', error)
      throw error
    }
  }

  /**
   * 批量地理编码
   */
  static async batchGeocode(addresses: string[]): Promise<Array<{ lat: number; lng: number; formattedAddress: string }>> {
    try {
      const promises = addresses.map(address => this.geocode(address))
      return await Promise.all(promises)
    } catch (error) {
      console.error('批量地理编码失败:', error)
      throw error
    }
  }
}

export default MapService