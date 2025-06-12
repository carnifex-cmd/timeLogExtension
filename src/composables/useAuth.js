import { ref } from 'vue'
import { storageService } from '../services/storageService.js'

export function useAuth() {
  const ytUrl = ref('')
  const ytToken = ref('')
  const isAuthenticated = ref(false)

  // Load auth from chrome.storage on initialization
  const loadAuth = async () => {
    try {
      const data = await storageService.get(['ytUrl', 'ytToken'])
      if (data.ytUrl && data.ytToken) {
        ytUrl.value = data.ytUrl
        ytToken.value = data.ytToken
        isAuthenticated.value = true
        return true
      }
    } catch (error) {
      console.error('Error loading auth:', error)
    }
    return false
  }

  const saveAuth = async () => {
    if (!ytUrl.value || !ytToken.value) {
      throw new Error('URL and token are required')
    }

    try {
      await storageService.set({ 
        ytUrl: ytUrl.value, 
        ytToken: ytToken.value 
      })
      isAuthenticated.value = true
      return true
    } catch (error) {
      console.error('Error saving auth:', error)
      throw error
    }
  }

  const logout = () => {
    ytUrl.value = ''
    ytToken.value = ''
    isAuthenticated.value = false
  }

  return {
    ytUrl,
    ytToken,
    isAuthenticated,
    loadAuth,
    saveAuth,
    logout
  }
} 