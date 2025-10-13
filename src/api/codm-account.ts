import request from '@/utils/request'

export interface CodmAccount {
  id: number
  serial_number: string
  images: string[]
  price: number
  title: string
  describe: string
  xianyu_url: string
  email: string
  status: number // 1:上架, 2:下架
  created_at?: string
  updated_at?: string
}

export interface CreateCodmAccountData {
  images: string[]
  price: number
  title: string
  describe: string
  xianyu_url: string
  email: string
  status: number
}

// 获取账号列表
export function getCodmAccountList(params?: { page?: number, limit?: number, keyword?: string, status?: number }): Promise<any> {
  return request.get('/api/codm-accounts', { params })
}

// 获取账号详情
export function getCodmAccountDetail(id: number): Promise<any> {
  return request.get(`/api/codm-accounts/${id}`)
}

// 创建账号
export function createCodmAccount(data: CreateCodmAccountData): Promise<any> {
  return request.post('/api/codm-accounts', data)
}

// 修改账号
export function updateCodmAccount(id: number, data: CreateCodmAccountData): Promise<any> {
  return request.put(`/api/codm-accounts/${id}`, data)
}

// 删除账号
export function deleteCodmAccount(id: number): Promise<any> {
  return request.delete(`/api/codm-accounts/${id}`)
}

// 更新账号状态
export function patchCodmAccount(id: number, data: { status: number }): Promise<any> {
  return request.put(`/api/codm-accounts/${id}/status`, data)
}
