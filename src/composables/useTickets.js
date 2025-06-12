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

  const fetchTickets = async (ytUrl, authConfig) => {
    loading.value = true
    try {
      const api = new YouTrackApi(ytUrl, authConfig)
      const data = await api.fetchTickets()
      tickets.value = data
    } catch (error) {
      console.error('Error fetching tickets:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const addTimeLog = (ticketId, timeLog) => {
    logs[ticketId] = timeLog
  }

  const submitLogs = async (ytUrl, authConfig) => {
    const selectedIds = Object.keys(selectedTickets).filter(id => selectedTickets[id])
    if (!selectedIds.length) {
      throw new Error('Select at least one ticket.')
    }

    loading.value = true
    try {
      const api = new YouTrackApi(ytUrl, authConfig)
      
      for (const ticketId of selectedIds) {
        const log = logs[ticketId]
        if (!log) continue
        
        await api.submitTimeLog(ticketId, log)
      }
      
      // Clear selections and logs after successful submission
      selectedIds.forEach(id => {
        selectedTickets[id] = false
        delete logs[id]
      })
      
      return true
    } catch (error) {
      console.error('Error submitting logs:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const testConnection = async (ytUrl, authConfig) => {
    try {
      const api = new YouTrackApi(ytUrl, authConfig)
      return await api.testConnection()
    } catch (error) {
      console.error('Error testing connection:', error)
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
    showMoreTickets
  }
} 