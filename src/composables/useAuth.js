import { ref } from 'vue'
import { storageService } from '../services/storageService.js'
import { YouTrackOAuthService } from '../services/oauthService.js'
import { YouTrackTokenService } from '../services/youtrackTokenService.js'

export function useAuth() {
  const ytUrl = ref('')
  const ytToken = ref('')
  const ytClientId = ref('')
  const authType = ref('token') // 'token', 'oauth', or 'youtrack-token'
  const ytEnvironment = ref('production') // 'production' or 'staging' - only for youtrack-token auth
  const isAuthenticated = ref(false)
  const userInfo = ref(null)
  const oauthTokens = ref(null)
  const youtrackTokenService = new YouTrackTokenService()

  // Load auth from chrome.storage on initialization
  const loadAuth = async () => {
    try {
      const data = await storageService.get([
        'ytUrl', 
        'ytToken', 
        'ytClientId', 
        'authType', 
        'ytEnvironment',
        'userInfo', 
        'oauthTokens'
      ])
      
      if (data.ytUrl) {
        ytUrl.value = data.ytUrl
      }

      if (data.authType === 'oauth' && data.oauthTokens) {
        authType.value = 'oauth'
        oauthTokens.value = data.oauthTokens
        ytClientId.value = data.ytClientId || ''
        userInfo.value = data.userInfo
        
        // Check if OAuth token is still valid
        const oauthService = new YouTrackOAuthService(ytUrl.value, ytClientId.value)
        if (!oauthService.isTokenExpired(data.oauthTokens)) {
          isAuthenticated.value = true
          return true
        } else {
          // Try to refresh token
          try {
            const newTokens = await oauthService.refreshToken(data.oauthTokens.refresh_token)
            oauthTokens.value = newTokens
            await storageService.set({ oauthTokens: newTokens })
            isAuthenticated.value = true
            return true
          } catch (error) {
            console.error('Token refresh failed:', error)
            await logout() // Clear invalid auth
          }
        }
      } else if (data.authType === 'token' && data.ytToken) {
        authType.value = 'token'
        ytToken.value = data.ytToken
        isAuthenticated.value = true
        return true
      } else if (data.authType === 'youtrack-token' && data.ytToken) {
        authType.value = 'youtrack-token'
        ytToken.value = data.ytToken
        ytEnvironment.value = data.ytEnvironment || 'production'
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

  const saveOAuthAuth = async () => {
    if (!ytUrl.value || !ytClientId.value) {
      throw new Error('URL and Client ID are required')
    }

    try {
      const oauthService = new YouTrackOAuthService(ytUrl.value, ytClientId.value)
      const tokens = await oauthService.authenticate()
      
      // Get user info
      const user = await oauthService.getUserInfo(tokens.access_token)
      
      // Store OAuth data
      await storageService.set({
        ytUrl: ytUrl.value,
        ytClientId: ytClientId.value,
        authType: 'oauth',
        oauthTokens: tokens,
        userInfo: user
      })

      authType.value = 'oauth'
      oauthTokens.value = tokens
      userInfo.value = user
      isAuthenticated.value = true
      
      return { tokens, user }
    } catch (error) {
      console.error('Error saving OAuth auth:', error)
      throw error
    }
  }

  const saveYouTrackTokenAuth = async () => {
    try {
      // Scan for tokens in YouTrack tabs based on selected environment
      const detectedData = await youtrackTokenService.scanForTokens(ytEnvironment.value)
      
      if (!detectedData) {
        throw new Error(`No ${ytEnvironment.value} YouTrack tokens found. Please ensure you are logged into ${ytEnvironment.value === 'staging' ? 'staging' : 'production'} YouTrack.`)
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
        ytEnvironment: ytEnvironment.value,
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
        environment: ytEnvironment.value
      }
    } catch (error) {
      console.error('Error saving YouTrack token auth:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Revoke OAuth token if using OAuth
      if (authType.value === 'oauth' && oauthTokens.value && ytClientId.value) {
        const oauthService = new YouTrackOAuthService(ytUrl.value, ytClientId.value)
        await oauthService.revokeToken(oauthTokens.value.access_token)
      }

      // Clear all auth data
      await storageService.remove([
        'ytToken', 
        'ytClientId', 
        'authType', 
        'userInfo', 
        'oauthTokens'
      ])
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Reset state
      ytToken.value = ''
      ytClientId.value = ''
      authType.value = 'token'
      isAuthenticated.value = false
      userInfo.value = null
      oauthTokens.value = null
    }
  }

  const getCurrentAuthConfig = () => {
    if (authType.value === 'oauth' && oauthTokens.value) {
      return {
        type: 'oauth',
        token: oauthTokens.value.access_token,
        refreshToken: oauthTokens.value.refresh_token,
        clientId: ytClientId.value
      }
    } else if (authType.value === 'youtrack-token') {
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
    if (newType === 'oauth') {
      ytToken.value = ''
    } else if (newType === 'youtrack-token') {
      ytClientId.value = ''
      oauthTokens.value = null
      // Keep userInfo for youtrack-token as it might be detected
    } else {
      ytClientId.value = ''
      oauthTokens.value = null
      userInfo.value = null
    }
  }

  return {
    ytUrl,
    ytToken,
    ytClientId,
    authType,
    ytEnvironment,
    isAuthenticated,
    userInfo,
    oauthTokens,
    youtrackTokenService,
    loadAuth,
    saveTokenAuth,
    saveOAuthAuth,
    saveYouTrackTokenAuth,
    logout,
    getCurrentAuthConfig,
    switchAuthType
  }
} 