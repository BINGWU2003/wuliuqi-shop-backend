/**
 * 腾讯云 COS 上传工具
 * 为腾讯云对象存储提供类型安全的文件上传功能
 */

import COS from 'cos-js-sdk-v5'

/**
 * 腾讯云 COS 配置接口
 */
export interface COSConfig {
  SecretId: string
  SecretKey: string
  Bucket: string
  Region: string
}

/**
 * 文件上传选项
 */
export interface UploadOptions {
  /** 要上传的文件或 Blob 对象 */
  file: File | Blob
  /** 可选的存储桶文件夹路径（例如：'images/', 'documents/'） */
  folder?: string
  /** 可选的上传进度回调函数（0-100） */
  onProgress?: (progress: number) => void
  /** 可选的自定义文件名（仍会添加唯一后缀） */
  customFileName?: string
  /** 可选的最大文件大小限制（字节）,默认 100MB */
  maxSize?: number
  /** 可选的允许的文件类型列表（MIME 类型）,例如 ['image/jpeg', 'image/png'] */
  allowedTypes?: string[]
}

/**
 * 上传成功后返回的结果
 */
export interface UploadResult {
  /** 访问上传文件的完整 HTTPS URL */
  url: string
  /** COS 存储桶中的对象键 */
  key: string
  /** COS 返回的 location URL */
  location: string
}

/**
 * COS 配置错误类
 */
export class COSConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'COSConfigError'
  }
}

/**
 * COS 上传错误类
 */
export class COSUploadError extends Error {
  public originalError?: unknown

  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = 'COSUploadError'
    this.originalError = originalError
  }
}
/**
 * 获取 COS 配置
 * 从环境变量中加载配置并进行验证
 * @returns COS 配置对象
 * @throws {COSConfigError} 当必需的环境变量缺失时抛出
 */
export function getConfig(): COSConfig {
  const SecretId = import.meta.env.VITE_COS_SECRET_ID
  const SecretKey = import.meta.env.VITE_COS_SECRET_KEY
  const Bucket = import.meta.env.VITE_COS_BUCKET
  const Region = import.meta.env.VITE_COS_REGION

  // 验证必需的环境变量
  const missingVars: string[] = []

  if (!SecretId)
    missingVars.push('VITE_COS_SECRET_ID')
  if (!SecretKey)
    missingVars.push('VITE_COS_SECRET_KEY')
  if (!Bucket)
    missingVars.push('VITE_COS_BUCKET')
  if (!Region)
    missingVars.push('VITE_COS_REGION')

  if (missingVars.length > 0) {
    throw new COSConfigError(
      `缺少必需的环境变量: ${missingVars.join(', ')}`,
    )
  }

  return {
    SecretId,
    SecretKey,
    Bucket,
    Region,
  }
}

// COS 客户端单例实例
let cosClient: COS | null = null

/**
 * 获取 COS 客户端单例
 * 使用单例模式确保客户端在多次上传中被复用
 * @returns COS 客户端实例
 */
export function getCOSClient(): COS {
  if (!cosClient) {
    const config = getConfig()
    cosClient = new COS({
      SecretId: config.SecretId,
      SecretKey: config.SecretKey,
    })
  }
  return cosClient
}

/**
 * 从文件中提取文件扩展名
 * @param file - File 或 Blob 对象
 * @returns 文件扩展名（包含点号,如 '.jpg'）,如果无法确定则返回空字符串
 */
function getFileExtension(file: File | Blob): string {
  // 如果是 File 对象且有文件名,从文件名中提取扩展名
  if (file instanceof File && file.name) {
    const lastDotIndex = file.name.lastIndexOf('.')
    if (lastDotIndex !== -1) {
      return file.name.substring(lastDotIndex)
    }
  }

  // 如果是 Blob 对象或 File 没有扩展名,尝试从 MIME 类型推断
  if (file.type) {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'application/json': '.json',
      'video/mp4': '.mp4',
      'audio/mpeg': '.mp3',
    }
    return mimeToExt[file.type] || ''
  }

  return ''
}

/**
 * 生成唯一的文件名
 * @param file - File 或 Blob 对象
 * @param customFileName - 可选的自定义文件名（不含扩展名）
 * @returns 唯一的文件名,格式为: [customFileName_]timestamp_randomString.ext
 */
function generateFileName(file: File | Blob, customFileName?: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 10)
  const extension = getFileExtension(file)

  const baseName = customFileName ? `${customFileName}_` : ''
  return `${baseName}${timestamp}_${randomString}${extension}`
}

/**
 * 上传文件到腾讯云 COS
 * @param options - 上传选项
 * @returns Promise,解析为上传结果
 * @throws {COSConfigError} 当配置无效时抛出
 * @throws {COSUploadError} 当上传失败时抛出
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  try {
    const { file, folder, onProgress, customFileName } = options

    // 验证文件对象
    if (!file) {
      throw new COSUploadError('文件对象不能为空')
    }

    // 生成唯一文件名
    const fileName = generateFileName(file, customFileName)
    const key = folder ? `${folder}${fileName}` : fileName

    // 获取配置和客户端(可能抛出 COSConfigError)
    let config: COSConfig
    let client: COS

    try {
      config = getConfig()
      client = getCOSClient()
    }
    catch (error) {
      // 如果是配置错误,直接抛出
      if (error instanceof COSConfigError) {
        throw error
      }
      // 其他错误包装为上传错误
      throw new COSUploadError('初始化 COS 客户端失败', error)
    }

    // 使用 Promise 包装 COS SDK 的回调式 API
    return new Promise((resolve, reject) => {
      client.putObject(
        {
          Bucket: config.Bucket,
          Region: config.Region,
          Key: key,
          Body: file,
          onProgress: (progressData) => {
            if (onProgress) {
              try {
                const percent = Math.round(progressData.percent * 100)
                onProgress(percent)
              }
              catch (error) {
                // 进度回调错误不应中断上传,仅记录
                console.error('进度回调执行失败:', error)
              }
            }
          },
        },
        (err, data) => {
          if (err) {
            // 根据错误类型提供更具体的错误消息
            let errorMessage = '文件上传失败'

            if (err.error === 'NoSuchBucket') {
              errorMessage = '存储桶不存在,请检查配置'
            }
            else if (err.error === 'AccessDenied') {
              errorMessage = '访问被拒绝,请检查密钥权限'
            }
            else if (err.statusCode === 403) {
              errorMessage = '权限不足,请检查 SecretId 和 SecretKey'
            }
            else if (err.statusCode === 404) {
              errorMessage = '资源不存在,请检查 Bucket 和 Region 配置'
            }
            else if (err.code === 'NetworkError' || err.error === 'NetworkError') {
              errorMessage = '网络错误,请检查网络连接'
            }

            reject(new COSUploadError(errorMessage, err))
            return
          }

          // 验证返回数据
          if (!data || !data.Location) {
            reject(new COSUploadError('上传成功但返回数据格式异常', data))
            return
          }

          // 格式化并返回结果
          const result: UploadResult = {
            url: `https://${data.Location}`,
            key,
            location: data.Location,
          }
          resolve(result)
        },
      )
    })
  }
  catch (error) {
    // 捕获所有同步错误
    if (error instanceof COSConfigError || error instanceof COSUploadError) {
      throw error
    }
    // 包装未知错误
    throw new COSUploadError('上传过程中发生未知错误', error)
  }
}
