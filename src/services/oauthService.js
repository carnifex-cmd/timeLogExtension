export class YouTrackOAuthService {
  constructor(baseUrl, clientId) {
    this.baseUrl = baseUrl
    this.clientId = clientId
    this.scopes = 'YouTrack'
    this.redirectUri = chrome.identity.getRedirectURL()
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl() {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes,
      state: this.generateState()
    })

    return `${this.baseUrl}/api/rest/oauth2/auth?${params.toString()}`
  }

  /**
   * Start OAuth flow using Chrome Identity API
   */
  async authenticate() {
    try {
      const authUrl = this.getAuthUrl()
      
      // Use Chrome Identity API for OAuth flow
      const responseUrl = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          {
            url: authUrl,
            interactive: true
          },
          (responseUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else {
              resolve(responseUrl)
            }
          }
        )
      })

      // Extract authorization code from response URL
      const url = new URL(responseUrl)
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      if (error) {
        throw new Error(`OAuth error: ${error}`)
      }

      if (!code) {
        throw new Error('No authorization code received')
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code)
      return tokens

    } catch (error) {
      console.error('OAuth authentication failed:', error)
      throw error
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(code) {
    const tokenUrl = `${this.baseUrl}/api/rest/oauth2/token`
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code: code,
      redirect_uri: this.redirectUri
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`)
    }

    const tokens = await response.json()
    
    // Add expiration timestamp
    if (tokens.expires_in) {
      tokens.expires_at = Date.now() + (tokens.expires_in * 1000)
    }

    return tokens
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken) {
    const tokenUrl = `${this.baseUrl}/api/rest/oauth2/token`
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refreshToken
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const tokens = await response.json()
    
    // Add expiration timestamp
    if (tokens.expires_in) {
      tokens.expires_at = Date.now() + (tokens.expires_in * 1000)
    }

    return tokens
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    if (!token || !token.expires_at) {
      return true
    }
    
    // Add 5 minute buffer before expiration
    const bufferTime = 5 * 60 * 1000
    return Date.now() >= (token.expires_at - bufferTime)
  }

  /**
   * Get user info using access token
   */
  async getUserInfo(accessToken) {
    const response = await fetch(`${this.baseUrl}/api/rest/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Generate random state for OAuth security
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(token) {
    try {
      const response = await fetch(`${this.baseUrl}/api/rest/oauth2/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          token: token,
          client_id: this.clientId
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to revoke token:', error)
      return false
    }
  }
} 