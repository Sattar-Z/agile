import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'
import { callApi } from '@/helpers/request'
import router from '@/router'

interface Role {
  id: number
  name: string
  status: number
  created_at: string
}
interface LoginFormData {
  email: string
  password?: string
}

export interface User {
  id: number
  email: string
  name: string
  phone: string | null
  status: number
  role: Role
  role_id: number
  token: string
  created_at: string
  updated_at: string
  loginTimestamp?: number
}

// Do not change the order of these. It is used to map the user role to the index of the array
export const userRoles = [
  'Desk Officer',
  'Admin',
]

export const useUserStore = defineStore('user', () => {
  const user: Ref<User> = ref({} as User)

  // This is used to get the token to be used for otp
  const userInfo = ref({})
  const settingsInfo = ref({})

  function getUserInfo(): Record<string, string> {
    return userInfo.value
  }
  function getSettingsInfo(): Record<string, string> {
    return settingsInfo.value
  }

  function setUserInfo(userData: Record<string, string>) {
    userInfo.value = userData
  }

  function setSettingsInfo(settingsData: Record<string, string>) {
    settingsInfo.value = settingsData
  }

  function getUser(): Ref<User> {
    if (!user.value.id) {
      const userObjectString = localStorage.getItem('user')
      if (userObjectString)
        user.value = JSON.parse(userObjectString)
    }

    return user
  }

  function setUser(userData: User) {
    user.value = userData
  }

  async function getUserProfile() {
    return await callApi({
      url: 'login',
      method: 'GET',
      authorized: true,
    })
  }

  async function refreshUser() {
    const response = await getUserProfile()
    if (response.ok) {
      const { data } = await response.json()

      setUser(data)
      localStorage.setItem('user', JSON.stringify(data))
    }
    else {
      localStorage.removeItem('user')
      router.push({ name: 'Login' })
    }
  }

  async function refreshUserData(response?: Response) {
    const { data } = await response?.json()

    setUser(data)
    localStorage.setItem('user', JSON.stringify(data))
  }

  function removeUser() {
    localStorage.removeItem('user')
    user.value = {} as User
  }

  async function login(credentials: LoginFormData) {
    try {
      const response = await callApi({
        url: 'login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(credentials),
      })

      const responseData = await response.json()

      if (response.ok) {
        const { data: profileData } = responseData

        // Store login timestamp along with user data
        const loginData = {
          ...profileData,
          loginTimestamp: Date.now(),
        }

        setUser(loginData)
        localStorage.setItem('user', JSON.stringify(loginData))

        return profileData
      }

      throw new Error(responseData.message || 'Login failed')
    }
    catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  function isTokenExpired(): boolean {
    const storedUser = getUser().value

    // If no user or no login timestamp, consider token expired
    if (!storedUser || !storedUser.loginTimestamp)
      return true

    // Check if token is close to expiration (e.g., within 1 hour)
    const EXPIRATION_THRESHOLD = 60 * 60 * 1000 // 1 hour
    const currentTime = Date.now()
    const timeSinceLogin = currentTime - storedUser.loginTimestamp

    return timeSinceLogin >= EXPIRATION_THRESHOLD
  }

  async function refreshToken() {
    try {
      const currentUser = getUser().value

      // Ensure we have a user with a token
      if (!currentUser || !currentUser.token)
        throw new Error('No user token available')

      const response = await callApi({
        url: 'login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        data: JSON.stringify({
          email: currentUser.email,
          refresh: true, // Backend-specific refresh mechanism
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        const { data: refreshedProfileData } = responseData

        // Update user data with new token and refresh timestamp
        const updatedUserData = {
          ...refreshedProfileData,
          loginTimestamp: Date.now(),
        }

        setUser(updatedUserData)
        localStorage.setItem('user', JSON.stringify(updatedUserData))

        return updatedUserData
      }

      throw new Error(responseData.message || 'Token refresh failed')
    }
    catch (error) {
      // If refresh fails, logout user
      removeUser()
      router.push({ name: 'Login' })
      throw error
    }
  }

  // Interceptor for API calls to handle token expiration
  async function authenticatedRequest(requestFn: () => Promise<Response>) {
    // Check if token is expired
    if (isTokenExpired()) {
      // Clear user data and redirect to login
      removeUser()
      router.push({ name: 'Login' })
      throw new Error('Token expired. Please log in again.')
    }

    // Proceed with the original request
    return requestFn()
  }

  return {
    getUser,
    setUser,
    getUserProfile,
    refreshUser,
    removeUser,
    refreshUserData,
    setUserInfo,
    setSettingsInfo,
    getUserInfo,
    getSettingsInfo,
    login,
    refreshToken,
    isTokenExpired,
    authenticatedRequest,
  }
})
