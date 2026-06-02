import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('accessToken') || '')
  const refreshToken = ref(sessionStorage.getItem('refreshToken') || '')
  const username = ref('')
  const userId = ref<number | null>(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  async function login(user: string, password: string) {
    const res = await apiLogin(user, password)
    if (res.code === 0 && res.data) {
      setTokens(res.data.accessToken, res.data.refreshToken)
      username.value = res.data.username
      userId.value = res.data.userId
    } else {
      throw new Error(res.message || 'Login failed')
    }
  }

  async function register(user: string, password: string, email?: string) {
    const res = await apiRegister(user, password, email)
    if (res.code === 0 && res.data) {
      setTokens(res.data.accessToken, res.data.refreshToken)
      username.value = res.data.username
      userId.value = res.data.userId
    } else {
      throw new Error(res.message || 'Registration failed')
    }
  }

  async function fetchUser() {
    if (!accessToken.value) return
    try {
      const res = await getMe()
      if (res.code === 0 && res.data) {
        username.value = res.data.username
        userId.value = res.data.userId
      }
    } catch {
      logout()
    }
  }

  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    sessionStorage.setItem('accessToken', access)
    sessionStorage.setItem('refreshToken', refresh)
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    username.value = ''
    userId.value = null
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
  }

  return { accessToken, refreshToken, username, userId, isLoggedIn, login, register, fetchUser, logout }
})
