import request from '@/utils/request'

export interface SequenceCounter {
  id: number
  counter_name: string
  current_value: number
  created_at?: string
  updated_at?: string
}

// 获取计数器列表
export function getSequenceCounterList(): Promise<any> {
  return request.get('/api/sequence-counters')
}

// 初始化计数器
export function createSequenceCounter(data: { counter_name: string, current_value: number }): Promise<any> {
  return request.post('/api/sequence-counters', data)
}
