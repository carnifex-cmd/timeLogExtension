import { ref, reactive, computed } from 'vue'
import { YouTrackApi } from '../services/youtrackApi.js'

export function useTickets() {
  const tickets = ref([])
  const selectedTickets = reactive({})
  const logs = reactive({})
  const loading = ref(false)
  const searchQuery = ref('')
  const ticketsToShow = ref(5)

  const filteredTickets = computed(() => {
    if (!searchQuery.value) return tickets.value
    return tickets.value.filter(ticket => 
      ticket.idReadable.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      ticket.summary.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
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
      const data = await api.fetchTickets()
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
      
      for (const ticketId of selectedIds) {
        const ticketLogs = logs[ticketId]
        if (!Array.isArray(ticketLogs) || ticketLogs.length === 0) continue
        for (const log of ticketLogs) {
          await api.submitTimeLog(ticketId, log)
        }
      }
      
      // Clear selections and logs after successful submission
      selectedIds.forEach(id => {
        selectedTickets[id] = false
        delete logs[id]
      })
      
      return true
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

  return {
    tickets,
    selectedTickets,
    logs,
    loading,
    searchQuery,
    ticketsToShow,
    filteredTickets,
    fetchTickets,
    addTimeLog,
    submitLogs,
    testConnection,
    showMoreTickets,
    isAuthenticationError
  }
} 