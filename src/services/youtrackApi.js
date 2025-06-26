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

  /**
   * Fetch logged time for a specific ticket
   */
  async fetchLoggedTimeForTicket(ticketId) {
    const url = `${this.baseUrl}/api/issues/${ticketId}/timeTracking/workItems?fields=duration(presentation),date,text,author(login,name)`
    
    const response = await this.makeAuthenticatedRequest(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logged time for ticket ${ticketId}`)
    }
    
    const workItems = await response.json()
    
    // Calculate total time in minutes
    let totalMinutes = 0
    for (const item of workItems) {
      if (item.duration && item.duration.presentation) {
        totalMinutes += this.parseDurationToMinutes(item.duration.presentation)
      }
    }
    
    return {
      totalMinutes,
      totalFormatted: this.formatMinutesToDuration(totalMinutes),
      workItems: workItems
    }
  }

  /**
   * Fetch logged time for multiple tickets (batch processing)
   */
  async fetchLoggedTimeForTickets(ticketIds) {
    const loggedTimeData = {}
    
    // Process in batches of 5 to avoid overwhelming the API
    for (let i = 0; i < ticketIds.length; i += 5) {
      const batch = ticketIds.slice(i, i + 5)
      const promises = batch.map(async (ticketId) => {
        try {
          const timeData = await this.fetchLoggedTimeForTicket(ticketId)
          return { ticketId, timeData }
        } catch (error) {
          console.warn(`Failed to fetch time for ticket ${ticketId}:`, error)
          return { ticketId, timeData: null }
        }
      })
      
      const results = await Promise.all(promises)
      results.forEach(({ ticketId, timeData }) => {
        loggedTimeData[ticketId] = timeData
      })
    }
    
    return loggedTimeData
  }

  /**
   * Parse duration string (like "2h 30m") to total minutes
   */
  parseDurationToMinutes(durationStr) {
    if (!durationStr) return 0
    
    let totalMinutes = 0
    const lowerStr = durationStr.toLowerCase()
    
    // Match hours (e.g., "2h", "1.5h")
    const hoursMatch = lowerStr.match(/(\d+(?:\.\d+)?)h/)
    if (hoursMatch) {
      totalMinutes += parseFloat(hoursMatch[1]) * 60
    }
    
    // Match minutes (e.g., "30m")
    const minutesMatch = lowerStr.match(/(\d+)m/)
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1])
    }
    
    // If no h or m found, assume it's hours
    if (!hoursMatch && !minutesMatch) {
      const numberMatch = durationStr.match(/(\d+(?:\.\d+)?)/)
      if (numberMatch) {
        totalMinutes += parseFloat(numberMatch[1]) * 60
      }
    }
    
    return totalMinutes
  }

  /**
   * Format minutes to duration string (e.g., 150 -> "2h 30m")
   */
  formatMinutesToDuration(totalMinutes) {
    if (totalMinutes === 0) return "0m"
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    if (hours === 0) {
      return `${minutes}m`
    } else if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${minutes}m`
    }
  }
} 