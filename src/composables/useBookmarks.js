import { ref, reactive, computed } from 'vue'
import { storageService } from '../services/storageService.js'

export function useBookmarks() {
  const bookmarkedTickets = reactive({})
  const loading = ref(false)

  // Load bookmarks from storage
  const loadBookmarks = async () => {
    loading.value = true
    try {
      const data = await storageService.get(['bookmarkedTickets'])
      if (data.bookmarkedTickets) {
        Object.assign(bookmarkedTickets, data.bookmarkedTickets)
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    } finally {
      loading.value = false
    }
  }

  // Save bookmarks to storage
  const saveBookmarks = async () => {
    try {
      await storageService.set({ bookmarkedTickets })
    } catch (error) {
      console.error('Error saving bookmarks:', error)
      throw error
    }
  }

  // Add a ticket to bookmarks
  const addBookmark = async (ticket) => {
    try {
      bookmarkedTickets[ticket.idReadable] = {
        ...ticket,
        bookmarkedAt: new Date().toISOString()
      }
      await saveBookmarks()
    } catch (error) {
      console.error('Error adding bookmark:', error)
      throw error
    }
  }

  // Remove a ticket from bookmarks
  const removeBookmark = async (ticketId) => {
    try {
      delete bookmarkedTickets[ticketId]
      await saveBookmarks()
    } catch (error) {
      console.error('Error removing bookmark:', error)
      throw error
    }
  }

  // Toggle bookmark status
  const toggleBookmark = async (ticket) => {
    if (isBookmarked(ticket.idReadable)) {
      await removeBookmark(ticket.idReadable)
      return false
    } else {
      await addBookmark(ticket)
      return true
    }
  }

  // Check if a ticket is bookmarked
  const isBookmarked = (ticketId) => {
    return Boolean(bookmarkedTickets[ticketId])
  }

  // Get bookmarked tickets as array
  const bookmarkedTicketsList = computed(() => {
    return Object.values(bookmarkedTickets).sort((a, b) => 
      new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt)
    )
  })

  // Clear all bookmarks
  const clearAllBookmarks = async () => {
    try {
      Object.keys(bookmarkedTickets).forEach(key => {
        delete bookmarkedTickets[key]
      })
      await saveBookmarks()
    } catch (error) {
      console.error('Error clearing bookmarks:', error)
      throw error
    }
  }

  return {
    bookmarkedTickets,
    bookmarkedTicketsList,
    loading,
    loadBookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearAllBookmarks
  }
} 