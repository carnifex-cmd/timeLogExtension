import { ref, reactive, computed } from 'vue'
import { YouTrackApi } from '../services/youtrackApi.js'

export function useTickets() {
  const tickets = ref([])
  const selectedTickets = reactive({})
  const logs = reactive({})
  const loggedTimeData = reactive({})
  const loadingLoggedTime = reactive({})
  const loading = ref(false)
  const searchQuery = ref('')
  const ticketsToShow = ref(5)
  const includeClosedTickets = ref(true)
  const selectedProject = ref('')

  const filteredTickets = computed(() => {
    let filtered = tickets.value

    // Apply search filter
    if (searchQuery.value) {
      filtered = filtered.filter(ticket => 
        ticket.idReadable.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
        ticket.summary.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    }

    // Apply project filter
    if (selectedProject.value) {
      filtered = filtered.filter(ticket => 
        ticket.project && ticket.project.shortName === selectedProject.value
      )
    }

    return filtered
  })

  // Computed property to get unique projects from tickets
  const availableProjects = computed(() => {
    const projects = tickets.value
      .map(ticket => ticket.project)
      .filter(project => project && project.shortName) // Filter out null/undefined projects
      .reduce((acc, project) => {
        // Use a Map to avoid duplicates based on shortName
        acc.set(project.shortName, project)
        return acc
      }, new Map())
    
    return Array.from(projects.values()).sort((a, b) => a.name.localeCompare(b.name))
  })

  /**
   * Check if error indicates authentication failure and should trigger logout
   */
  const isAuthenticationError = (error) => {
    const errorMessage = error.message.toLowerCase()
    return errorMessage.includes('authentication expired') ||
           errorMessage.includes('youtrack authentication expired') ||
           errorMessage.includes('extension context invalidated') ||
           errorMessage.includes('unauthorized') ||
           (error.status && (error.status === 401 || error.status === 403))
  }

  const fetchTickets = async (ytUrl, authConfig, logoutCallback = null) => {
    loading.value = true
    try {
      const api = new YouTrackApi(ytUrl, authConfig)
      const data = await api.fetchTickets(includeClosedTickets.value)
      tickets.value = data
    } catch (error) {
      console.error('Error fetching tickets:', error)
      
      // If it's an authentication error and we have a logout callback, trigger it
      if (isAuthenticationError(error) && logoutCallback) {
        console.log('Authentication error detected, triggering automatic logout')
        setTimeout(() => logoutCallback(), 100) // Small delay to ensure error message shows first
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  const addTimeLog = (ticketId, timeLog) => {
    if (!Array.isArray(logs[ticketId])) {
      logs[ticketId] = []
    }
    logs[ticketId].push(timeLog)
  }

  const submitLogs = async (ytUrl, authConfig, logoutCallback = null) => {
    const selectedIds = Object.keys(selectedTickets).filter(id => selectedTickets[id])
    if (!selectedIds.length) {
      throw new Error('Select at least one ticket.')
    }

    loading.value = true
    try {
      const api = new YouTrackApi(ytUrl, authConfig)
      
      // Track submission results
      const submissionResults = {
        totalTimeLogged: 0,
        ticketsUpdated: [],
        logCount: 0
      }
      
      for (const ticketId of selectedIds) {
        const ticketLogs = logs[ticketId]
        if (!Array.isArray(ticketLogs) || ticketLogs.length === 0) continue
        
        let ticketTotalMinutes = 0
        for (const log of ticketLogs) {
          await api.submitTimeLog(ticketId, log)
          ticketTotalMinutes += api.parseDurationToMinutes(log.time)
          submissionResults.logCount++
        }
        
        submissionResults.totalTimeLogged += ticketTotalMinutes
        submissionResults.ticketsUpdated.push(ticketId)
        
        // Refresh logged time data for this ticket
        try {
          const timeData = await api.fetchLoggedTimeForTicket(ticketId)
          loggedTimeData[ticketId] = timeData
        } catch (error) {
          console.warn(`Failed to refresh logged time for ticket ${ticketId}:`, error)
        }
      }
      
      // Clear selections and logs after successful submission
      selectedIds.forEach(id => {
        selectedTickets[id] = false
        delete logs[id]
      })
      
      return {
        success: true,
        totalTimeFormatted: api.formatMinutesToDuration(submissionResults.totalTimeLogged),
        ticketCount: submissionResults.ticketsUpdated.length,
        logCount: submissionResults.logCount
      }
    } catch (error) {
      console.error('Error submitting logs:', error)
      
      // If it's an authentication error and we have a logout callback, trigger it
      if (isAuthenticationError(error) && logoutCallback) {
        console.log('Authentication error detected during log submission, triggering automatic logout')
        setTimeout(() => logoutCallback(), 100)
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  const testConnection = async (ytUrl, authConfig, logoutCallback = null) => {
    try {
      const api = new YouTrackApi(ytUrl, authConfig)
      return await api.testConnection()
    } catch (error) {
      console.error('Error testing connection:', error)
      
      // If it's an authentication error and we have a logout callback, trigger it
      if (isAuthenticationError(error) && logoutCallback) {
        console.log('Authentication error detected during connection test, triggering automatic logout')
        setTimeout(() => logoutCallback(), 100)
      }
      
      throw error
    }
  }

  const showMoreTickets = () => {
    ticketsToShow.value += 5
  }

  const fetchLoggedTimeForTicket = async (ytUrl, authConfig, ticketId, logoutCallback = null) => {
    // Set loading state
    loadingLoggedTime[ticketId] = true
    
    try {
      const api = new YouTrackApi(ytUrl, authConfig)
      const timeData = await api.fetchLoggedTimeForTicket(ticketId)
      loggedTimeData[ticketId] = timeData
      return timeData
    } catch (error) {
      console.error(`Error fetching logged time for ticket ${ticketId}:`, error)
      
      // If it's an authentication error and we have a logout callback, trigger it
      if (isAuthenticationError(error) && logoutCallback) {
        console.log('Authentication error detected while fetching logged time, triggering automatic logout')
        setTimeout(() => logoutCallback(), 100)
      }
      
      throw error
    } finally {
      // Clear loading state
      loadingLoggedTime[ticketId] = false
    }
  }

  return {
    tickets,
    selectedTickets,
    logs,
    loggedTimeData,
    loadingLoggedTime,
    loading,
    searchQuery,
    ticketsToShow,
    includeClosedTickets,
    selectedProject,
    availableProjects,
    filteredTickets,
    fetchTickets,
    addTimeLog,
    submitLogs,
    testConnection,
    showMoreTickets,
    fetchLoggedTimeForTicket,
    isAuthenticationError
  }
} 