export class YouTrackApi {
  constructor(baseUrl, authConfig) {
    this.baseUrl = baseUrl
    this.authConfig = authConfig // { type: 'oauth'|'token', token: string, refreshToken?: string }
  }

  /**
   * Get authorization header based on auth type
   */
  getAuthHeader() {
    if (this.authConfig.type === 'oauth') {
      return `Bearer ${this.authConfig.token}`
    } else {
      return `Bearer ${this.authConfig.token}`
    }
  }

  /**
   * Make authenticated request with automatic token refresh for OAuth
   */
  async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      'Accept': 'application/json',
      'Authorization': this.getAuthHeader(),
      ...options.headers
    }

    let response = await fetch(url, {
      ...options,
      headers
    })

    // If OAuth token expired, try to refresh
    if (response.status === 401 && this.authConfig.type === 'oauth' && this.authConfig.refreshToken) {
      try {
        await this.refreshOAuthToken()
        
        // Retry request with new token
        headers['Authorization'] = this.getAuthHeader()
        response = await fetch(url, {
          ...options,
          headers
        })
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        throw new Error('Authentication expired. Please login again.')
      }
    }

    return response
  }

  /**
   * Refresh OAuth token
   */
  async refreshOAuthToken() {
    const { YouTrackOAuthService } = await import('./oauthService.js')
    const oauthService = new YouTrackOAuthService(this.baseUrl, this.authConfig.clientId)
    
    const newTokens = await oauthService.refreshToken(this.authConfig.refreshToken)
    
    // Update auth config with new tokens
    this.authConfig.token = newTokens.access_token
    if (newTokens.refresh_token) {
      this.authConfig.refreshToken = newTokens.refresh_token
    }
    
    // Store updated tokens
    const { storageService } = await import('./storageService.js')
    await storageService.set({
      authType: 'oauth',
      oauthTokens: {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || this.authConfig.refreshToken,
        expires_at: newTokens.expires_at
      }
    })

    return newTokens
  }

  async fetchTickets() {
    const url = `${this.baseUrl}/api/issues?query=Type:%20Sub-Task%20State:%20Open%20for:%20me&fields=idReadable,summary`
    
    const response = await this.makeAuthenticatedRequest(url)

    if (!response.ok) {
      throw new Error('Failed to fetch tickets - check your credentials')
    }

    return response.json()
  }

  async submitTimeLog(ticketId, timeLog) {
    const { time, date, comment } = timeLog
    const logDate = new Date(date).getTime()

    const url = `${this.baseUrl}/api/issues/${ticketId}/timeTracking/workItems`
    
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration: { presentation: time },
        date: logDate,
        text: comment
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to submit log for ticket ${ticketId}: ${JSON.stringify(errorData)}`)
    }

    return response.json()
  }

  /**
   * Test connection with current auth
   */
  async testConnection() {
    const url = `${this.baseUrl}/api/rest/users/me?fields=id,login,name,email`
    
    const response = await this.makeAuthenticatedRequest(url)
    
    if (!response.ok) {
      throw new Error('Failed to connect - check your credentials')
    }
    
    return response.json()
  }
} 