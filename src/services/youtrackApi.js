export class YouTrackApi {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl
    this.token = token
  }

  async fetchTickets() {
    const url = `${this.baseUrl}/api/issues?query=Type:%20Sub-Task%20State:%20Open%20for:%20me&fields=idReadable,summary`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tickets - check your credentials')
    }

    return response.json()
  }

  async submitTimeLog(ticketId, timeLog) {
    const { time, date, comment } = timeLog
    const logDate = new Date(date).getTime()

    const url = `${this.baseUrl}/api/issues/${ticketId}/timeTracking/workItems`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
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
} 