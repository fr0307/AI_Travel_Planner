/**
 * 请求日志中间件
 */

export const loggerMiddleware = (req, res, next) => {
  const start = Date.now()
  
  // 记录请求开始
  console.log(`📥 ${req.method} ${req.url} - 开始处理`)
  
  // 响应完成时的回调
  res.on('finish', () => {
    const duration = Date.now() - start
    const logMessage = `📤 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`
    
    if (res.statusCode >= 400) {
      console.error(logMessage)
    } else {
      console.log(logMessage)
    }
  })
  
  next()
}

/**
 * 业务日志记录器
 */
export const createLogger = (moduleName) => {
  return {
    info: (message, data = {}) => {
      console.log(`ℹ️ [${moduleName}] ${message}`, data)
    },
    warn: (message, data = {}) => {
      console.warn(`⚠️ [${moduleName}] ${message}`, data)
    },
    error: (message, error = {}) => {
      console.error(`❌ [${moduleName}] ${message}`, error)
    },
    debug: (message, data = {}) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`🐛 [${moduleName}] ${message}`, data)
      }
    },
  }
}