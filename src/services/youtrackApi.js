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

  async fetchTickets(includeClosedTickets = false) {
    let query = 'Type: Sub-Task for: me'
    
    if (includeClosedTickets) {
      // Include both open and closed tickets from last 4 weeks
      const fourWeeksAgo = new Date()
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
      const dateString = fourWeeksAgo.toISOString().split('T')[0] // YYYY-MM-DD format
      
      // Simplified query without complex parentheses - just get all tickets and filter by update date
      query += ` updated: ${dateString} .. Today`
    } else {
      query += ' State: Open'
    }
    
    // Properly encode the query
    const encodedQuery = encodeURIComponent(query)
    const url = `${this.baseUrl}/api/issues?query=${encodedQuery}&fields=idReadable,summary,state(name),project(shortName,name)`
    
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
   * Parse duration string (like "2h 30m" or "46h") to total minutes
   */
  parseDurationToMinutes(durationStr) {
    if (!durationStr) return 0
    
    let totalMinutes = 0
    const lowerStr = durationStr.toLowerCase().trim()
    
    // Match all hour components - use global flag to get all matches
    const hourMatches = lowerStr.match(/(\d+(?:\.\d+)?)h/g)
    if (hourMatches) {
      hourMatches.forEach(match => {
        const value = parseFloat(match.replace('h', ''))
        totalMinutes += value * 60
      })
    }
    
    // Match all minute components - use global flag to get all matches  
    const minuteMatches = lowerStr.match(/(\d+)m/g)
    if (minuteMatches) {
      minuteMatches.forEach(match => {
        const value = parseInt(match.replace('m', ''))
        totalMinutes += value
      })
    }
    
    // If no h or m found, assume it's hours
    if (!hourMatches && !minuteMatches) {
      const numberMatch = durationStr.match(/(\d+(?:\.\d+)?)/)
      if (numberMatch) {
        totalMinutes += parseFloat(numberMatch[1]) * 60
      }
    }
    
    return totalMinutes
  }

  /**
   * Format minutes to duration string with smart units (e.g., 150 -> "2h 30m", 480 -> "1d", 2760 -> "1w 6h")
   */
  formatMinutesToDuration(totalMinutes) {
    if (totalMinutes === 0) return "0m"
    
    const hours = totalMinutes / 60
    const days = hours / 8  // 8 hours = 1 day
    const weeks = days / 5  // 5 days = 1 week
    
    if (weeks >= 1) {
      const wholeWeeks = Math.floor(weeks)
      // Calculate remaining minutes after subtracting whole weeks
      const remainingMinutesAfterWeeks = totalMinutes - (wholeWeeks * 5 * 8 * 60)
      const remainingDays = Math.floor(remainingMinutesAfterWeeks / (8 * 60))
      const remainingHours = Math.floor((remainingMinutesAfterWeeks % (8 * 60)) / 60)
      
      if (remainingDays === 0 && remainingHours === 0) {
        return `${wholeWeeks}w`
      } else if (remainingHours === 0) {
        return `${wholeWeeks}w ${remainingDays}d`
      } else if (remainingDays === 0) {
        return `${wholeWeeks}w ${remainingHours}h`
      } else {
        return `${wholeWeeks}w ${remainingDays}d ${remainingHours}h`
      }
    } else if (days >= 1) {
      const wholeDays = Math.floor(days)
      const remainingMinutesAfterDays = totalMinutes - (wholeDays * 8 * 60)
      const remainingHours = Math.floor(remainingMinutesAfterDays / 60)
      if (remainingHours === 0) {
        return `${wholeDays}d`
      } else {
        return `${wholeDays}d ${remainingHours}h`
      }
    } else if (hours >= 1) {
      const wholeHours = Math.floor(hours)
      const remainingMinutes = Math.floor(totalMinutes % 60)
      if (remainingMinutes === 0) {
        return `${wholeHours}h`
      } else {
        return `${wholeHours}h ${remainingMinutes}m`
      }
    } else {
      return `${Math.floor(totalMinutes)}m`
    }
  }
} 