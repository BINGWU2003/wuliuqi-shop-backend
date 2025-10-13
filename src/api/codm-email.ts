import request from '@/utils/request'

export interface CodmEmail {
  id: number
  prefix: string
  postfix: string
  bind_status: number // 1:已绑定, 2:未绑定
  created_at?: string
  updated_at?: string
}

export interface CreateCodmEmailData {
  prefix: string
  postfix: string
  bind_status: number
}

export interface UpdateBindStatusData {
  bind_status: number
}

// 获取邮箱列表
export function getCodmEmailList(params?: { page?: number, limit?: number, keyword?: string, bind_status?: number }): Promise<any> {
  return request.get('/api/codm-emails', { params })
}

// 创建邮箱
export function createCodmEmail(data: CreateCodmEmailData): Promise<any> {
  return request.post('/api/codm-emails', data)
}

// 更新邮箱绑定状态
export function updateBindStatus(id: number, data: UpdateBindStatusData): Promise<any> {
  return request.patch(`/api/codm-emails/${id}/bind-status`, data)
}

// 删除邮箱
export function deleteCodmEmail(id: number): Promise<any> {
  return request.delete(`/api/codm-emails/${id}`)
}

// 修改邮箱
export function updateCodmEmail(id: number, data: CreateCodmEmailData): Promise<any> {
  return request.put(`/api/codm-emails/${id}`, data)
}
