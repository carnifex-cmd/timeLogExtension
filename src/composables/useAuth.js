import { ref } from 'vue'
import { storageService } from '../services/storageService.js'
import { YouTrackTokenService } from '../services/youtrackTokenService.js'

export function useAuth() {
  const ytUrl = ref('')
  const ytToken = ref('')
  const authType = ref('token') // 'token' or 'youtrack-token'
  const isAuthenticated = ref(false)
  const userInfo = ref(null)
  const youtrackTokenService = new YouTrackTokenService()

  // Load auth from chrome.storage on initialization
  const loadAuth = async () => {
    try {
      const data = await storageService.get([
        'ytUrl', 
        'ytToken', 
        'authType', 
        'userInfo'
      ])
      
      if (data.ytUrl) {
        ytUrl.value = data.ytUrl
      }

      if (data.authType === 'token' && data.ytToken) {
        authType.value = 'token'
        ytToken.value = data.ytToken
        isAuthenticated.value = true
        return true
      } else if (data.authType === 'youtrack-token' && data.ytToken) {
        authType.value = 'youtrack-token'
        ytToken.value = data.ytToken
        userInfo.value = data.userInfo
        isAuthenticated.value = true
        return true
      }
    } catch (error) {
      console.error('Error loading auth:', error)
    }
    return false
  }

  const saveTokenAuth = async () => {
    if (!ytUrl.value || !ytToken.value) {
      throw new Error('URL and token are required')
    }

    try {
      await storageService.set({ 
        ytUrl: ytUrl.value, 
        ytToken: ytToken.value,
        authType: 'token'
      })
      
      authType.value = 'token'
      isAuthenticated.value = true
      return true
    } catch (error) {
      console.error('Error saving token auth:', error)
      throw error
    }
  }

  const saveYouTrackTokenAuth = async () => {
    try {
      // Scan for tokens in YouTrack tabs (production only)
      const detectedData = await youtrackTokenService.scanForTokens()
      
      if (!detectedData) {
        throw new Error('No production YouTrack tokens found. Please ensure you are logged into production YouTrack.')
      }

      // Extract the best token
      const authToken = youtrackTokenService.extractAuthToken(detectedData)
      
      if (!youtrackTokenService.validateToken(authToken.token)) {
        throw new Error('Invalid token detected. Please try logging into YouTrack again.')
      }

      // Extract user info if available
      const detectedUser = youtrackTokenService.extractUserInfo(detectedData)

      // Set the URL from detected data
      ytUrl.value = authToken.baseUrl
      ytToken.value = authToken.token

      // Store YouTrack token data
      await storageService.set({
        ytUrl: authToken.baseUrl,
        ytToken: authToken.token,
        authType: 'youtrack-token',
        userInfo: detectedUser,
        youtrackTokenType: authToken.type
      })

      authType.value = 'youtrack-token'
      userInfo.value = detectedUser
      isAuthenticated.value = true

      return { 
        token: authToken.token, 
        tokenType: authToken.type,
        user: detectedUser,
        baseUrl: authToken.baseUrl,
        environment: 'production'
      }
    } catch (error) {
      console.error('Error saving YouTrack token auth:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Clear all auth data
      await storageService.remove([
        'ytToken', 
        'authType', 
        'userInfo'
      ])
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Reset state
      ytToken.value = ''
      authType.value = 'token'
      isAuthenticated.value = false
      userInfo.value = null
    }
  }

  const getCurrentAuthConfig = () => {
    if (authType.value === 'youtrack-token') {
      return {
        type: 'youtrack-token',
        token: ytToken.value
      }
    } else {
      return {
        type: 'token',
        token: ytToken.value
      }
    }
  }

  const switchAuthType = (newType) => {
    authType.value = newType
    // Clear previous auth data when switching
    if (newType === 'youtrack-token') {
      // Keep userInfo for youtrack-token as it might be detected
    } else {
      userInfo.value = null
    }
  }

  return {
    ytUrl,
    ytToken,
    authType,
    isAuthenticated,
    userInfo,
    youtrackTokenService,
    loadAuth,
    saveTokenAuth,
    saveYouTrackTokenAuth,
    logout,
    getCurrentAuthConfig,
    switchAuthType
  }
} 