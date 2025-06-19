export class YouTrackApi {
  constructor(baseUrl, authConfig) {
    this.baseUrl = baseUrl
    this.authConfig = authConfig // { type: 'token'|'youtrack-token', token: string }
  }

  /**
   * Get authorization header based on auth type
   */
  getAuthHeader() {
    if (this.authConfig.type === 'youtrack-token') {
      // YouTrack tokens might use different auth schemes
      const token = this.authConfig.token
      // Check if it's a JWT token (starts with 'eyJ')
      if (token.startsWith('eyJ')) {
        return `Bearer ${token}`
      } else if (token.startsWith('perm:')) {
        return `Bearer ${token}`
      } else {
        // For session-based auth, might need different headers
        return `Bearer ${token}`
      }
    } else {
      return `Bearer ${this.authConfig.token}`
    }
  }

  /**
   * Make authenticated request
   */
  async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      'Accept': 'application/json',
      'Authorization': this.getAuthHeader(),
      ...options.headers
    }

    // For YouTrack token auth, we might need additional headers
    if (this.authConfig.type === 'youtrack-token') {
      // Some YouTrack setups might require specific headers
      headers['X-Requested-With'] = 'XMLHttpRequest'
    }

    let response = await fetch(url, {
      ...options,
      headers
    })

    // Handle authentication errors
    if (response.status === 401) {
      if (this.authConfig.type === 'youtrack-token') {
        throw new Error('YouTrack authentication expired. Please log into YouTrack again and use auto-detect.')
      } else {
        throw new Error('Authentication failed. Please check your API token.')
      }
    }

    return response
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