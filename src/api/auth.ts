import client from './client'

export interface LoginResponse {
  code: number
  data: {
    userId: number
    username: string
    accessToken: string
    refreshToken: string
  }
  message: string
}

export interface UserInfo {
  userId: number
  username: string
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post('/auth/login', { username, password })
  return data
}

export async function register(username: string, password: string, email?: string): Promise<LoginResponse> {
  const { data } = await client.post('/auth/register', { username, password, email })
  return data
}

export async function refreshToken(refreshToken: string) {
  const { data } = await client.post('/auth/refresh', { refreshToken })
  return data
}

export async function getMe(): Promise<{ code: number; data: UserInfo }> {
  const { data } = await client.get('/auth/me')
  return data
}
