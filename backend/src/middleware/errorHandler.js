/**
 * 全局错误处理中间件
 */

export const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })

  // 默认错误响应
  let statusCode = err.statusCode || 500
  let message = err.message || '内部服务器错误'

  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = '请求参数验证失败'
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = '未授权访问'
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403
    message = '禁止访问'
  } else if (err.name === 'NotFoundError') {
    statusCode = 404
    message = '资源不存在'
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413
    message = '文件大小超过限制'
  }

  // 生产环境下隐藏详细错误信息
  const isProduction = process.env.NODE_ENV === 'production'
  const errorResponse = {
    error: true,
    message: isProduction && statusCode === 500 ? '内部服务器错误' : message,
    ...(isProduction ? {} : { stack: err.stack }),
  }

  res.status(statusCode).json(errorResponse)
}

// 创建自定义错误类
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message = '验证错误') {
    super(message, 400)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '未授权') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '禁止访问') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404)
  }
}