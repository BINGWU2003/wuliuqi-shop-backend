import request from '@/utils/request'

// 获取轮播图
export function getCarousel(name: string): Promise<any> {
  return request.get(`/api/carousels/name/${name}`)
}

// 修改
export function updateCarousel(name: string, data: any): Promise<any> {
  return request.put(`/api/carousels/name/${name}`, data)
}
