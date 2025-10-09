import request from '@/utils/request'

export interface LoginData {
  email: string
  password: string
}

export interface LoginRes {
  token: string
}

export interface UserState {
  id?: number
  name?: string
  avatar?: string
  email?: string
}

export function login(data: LoginData): Promise<any> {
  return request.post<LoginRes>('/api/users/login', data)
}



export function getUserInfo() {
  return request<UserState>('/api/users/profile')
}

export function getEmailCode(): Promise<any> {
  return request.get('/user/email-code')
}

export function resetPassword(): Promise<any> {
  return request.post('/user/reset-password')
}

export function register(): Promise<any> {
  return request.post('/api/users/register')
}

export function getUserList(): Promise<any> {
  return request.get('/api/users')
}
