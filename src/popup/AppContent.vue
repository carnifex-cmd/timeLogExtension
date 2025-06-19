<template>
  <div class="app-container">
    <!-- Authentication Form -->
    <AuthenticationForm
      v-if="!auth.isAuthenticated.value"
      :ytUrl="auth.ytUrl.value"
      :ytToken="auth.ytToken.value"
      :ytClientId="auth.ytClientId.value"
      :authType="auth.authType.value"
      :loading="tickets.loading.value"
      @save-token="handleTokenAuth"
      @save-oauth="handleOAuthAuth"
      @save-youtrack-token="handleYouTrackTokenAuth"
      @update:ytUrl="auth.ytUrl.value = $event"
      @update:ytToken="auth.ytToken.value = $event"
      @update:ytClientId="auth.ytClientId.value = $event"
      @update:authType="auth.authType.value = $event"
    />

    <!-- User Info Banner (for OAuth) -->
    <n-card 
      v-else-if="auth.userInfo.value" 
      size="small" 
      class="user-info-banner"
    >
      <n-space align="center" justify="space-between">
        <n-space align="center">
          <n-avatar size="small" :src="auth.userInfo.value.avatarUrl">
            {{ auth.userInfo.value.name?.charAt(0) || '👤' }}
          </n-avatar>
          <div>
            <div class="user-name">{{ auth.userInfo.value.name || auth.userInfo.value.login }}</div>
            <div class="user-email">{{ auth.userInfo.value.email }}</div>
          </div>
        </n-space>
        <n-button size="small" quaternary @click="handleLogout">
          <template #icon>
            <i class="fas fa-sign-out-alt"></i>
          </template>
          Logout
        </n-button>
      </n-space>
    </n-card>

    <!-- Bookmark Management -->
    <BookmarkList
      v-if="auth.isAuthenticated.value"
      :bookmarked-tickets="bookmarks.bookmarkedTicketsList.value"
      :selected-tickets="tickets.selectedTickets"
      :bookmarks-to-show="bookmarks.bookMarksToShow.value"
      :logs="tickets.logs"
      :loading="bookmarks.loading.value"
      @toggle-selection="handleToggleSelection"
      @open-modal="handleOpenModal"
      @toggle-bookmark="handleToggleBookmark"
      @show-more="bookmarks.showMoreBookmarks"
      @clear-all="handleClearAllBookmarks"
    />

    <!-- Ticket Management -->
    <TicketList
      v-if="auth.isAuthenticated.value"
      :tickets="tickets.tickets.value"
      :filtered-tickets="tickets.filteredTickets.value"
      :selected-tickets="tickets.selectedTickets"
      :bookmarked-tickets="bookmarks.bookmarkedTickets"
      :logs="tickets.logs"
      :loading="tickets.loading.value"
      :search-query="tickets.searchQuery.value"
      :tickets-to-show="tickets.ticketsToShow.value"
      @update:search-query="tickets.searchQuery.value = $event"
      @toggle-selection="handleToggleSelection"
      @open-modal="handleOpenModal"
      @toggle-bookmark="handleToggleBookmark"
      @show-more="tickets.showMoreTickets"
      @submit-logs="handleSubmitLogs"
    />

    <!-- Time Log Modal -->
    <TimeLogModal
      :show="modal.modal.show"
      :ticket-id="modal.modal.ticketId"
      :time="modal.modal.time"
      :date="modal.modal.date"
      :comment="modal.modal.comment"
      @close="modal.closeModal"
      @save="handleModalSave"
      @update:time="modal.modal.time = $event"
      @update:date="modal.modal.date = $event"
      @update:comment="modal.modal.comment = $event"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useMessage, useDialog, useNotification } from 'naive-ui'
import AuthenticationForm from '../components/AuthenticationForm.vue'
import BookmarkList from '../components/BookmarkList.vue'
import TicketList from '../components/TicketList.vue'
import TimeLogModal from '../components/TimeLogModal.vue'
import { useAuth } from '../composables/useAuth.js'
import { useTickets } from '../composables/useTickets.js'
import { useBookmarks } from '../composables/useBookmarks.js'
import { useModal } from '../composables/useModal.js'

// Initialize Naive UI composables (now inside provider context)
const message = useMessage()
const dialog = useDialog()
const notification = useNotification()

// Initialize composables
const auth = useAuth()
const tickets = useTickets()
const bookmarks = useBookmarks()
const modal = useModal()

// Load authentication on mount
onMounted(async () => {
  const isAuthenticated = await auth.loadAuth()
  if (isAuthenticated) {
    await Promise.all([loadTickets(), bookmarks.loadBookmarks()])
  } else {
    await bookmarks.loadBookmarks()
  }
})

// Authentication handlers
const handleTokenAuth = async () => {
  try {
    await auth.saveTokenAuth()
    await loadTickets()
    
    notification.success({
      title: '🎉 Connected!',
      description: 'Successfully connected to YouTrack with API token',
      duration: 3000
    })
  } catch (error) {
    message.error('Failed to authenticate: ' + error.message)
  }
}

const handleOAuthAuth = async () => {
  try {
    const result = await auth.saveOAuthAuth()
    await loadTickets()
    
    notification.success({
      title: '🎉 Welcome!',
      description: `Successfully authenticated as ${result.user.name || result.user.login}`,
      duration: 4000
    })
  } catch (error) {
    if (error.message.includes('User cancelled')) {
      message.info('OAuth authentication was cancelled')
    } else {
      message.error('OAuth authentication failed: ' + error.message)
    }
  }
}

const handleYouTrackTokenAuth = async () => {
  try {
    console.log('Starting YouTrack token authentication...');
    const result = await auth.saveYouTrackTokenAuth()
    await loadTickets()
    
    const userDisplayName = result.user?.name || result.user?.login || 'User'
    const tokenTypeDisplay = result.tokenType === 'ring-jwt' ? 'JWT Token' : 
                           result.tokenType === 'uuid-access-token' ? 'Access Token' :
                           'Session Token'
    
    notification.success({
      title: '🔍 Auto-Detected!',
      description: `Successfully connected to production using ${tokenTypeDisplay}${result.user ? ` as ${userDisplayName}` : ''}`,
      duration: 4000
    })
  } catch (error) {
    console.error('YouTrack token auth error:', error);
    if (error.message.includes('No YouTrack tabs found')) {
      message.warning('Please open YouTrack in a browser tab first, then try again.')
    } else if (error.message.includes('No authentication tokens found')) {
      message.warning('Please make sure you are logged into YouTrack, then try again.')
    } else if (error.message.includes('Could not establish connection')) {
      message.error('Extension could not connect to YouTrack tab. Please refresh the YouTrack page and try again.')
    } else {
      message.error('Auto-detection failed: ' + error.message)
    }
  }
}

const handleLogout = () => {
  dialog.warning({
    title: 'Confirm Logout',
    content: 'Are you sure you want to logout? You will need to authenticate again.',
    positiveText: 'Logout',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      await auth.logout()
      message.success('Logged out successfully')
    }
  })
}

// Ticket handlers
const loadTickets = async () => {
  try {
    const authConfig = auth.getCurrentAuthConfig()
    await tickets.fetchTickets(auth.ytUrl.value, authConfig)
    
    const ticketCount = tickets.tickets.value.length
    if (ticketCount > 0) {
      message.success(`Loaded ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''}`)
    } else {
      message.info('No open tickets found')
    }
  } catch (error) {
    message.error('Could not load tickets: ' + error.message)
    
    // If authentication error, logout
    if (error.message.includes('Authentication expired') || error.message.includes('401')) {
      await auth.logout()
    }
  }
}

const handleToggleSelection = (ticketId) => {
  tickets.selectedTickets[ticketId] = !tickets.selectedTickets[ticketId]
  
  const selectedCount = Object.values(tickets.selectedTickets).filter(Boolean).length
  if (tickets.selectedTickets[ticketId]) {
    message.info(`Selected ${ticketId} (${selectedCount} total)`)
  }
}

const handleSubmitLogs = async () => {
  const selectedCount = Object.values(tickets.selectedTickets).filter(Boolean).length
  
  try {
    const authConfig = auth.getCurrentAuthConfig()
    await tickets.submitLogs(auth.ytUrl.value, authConfig)
    
    notification.success({
      title: '✅ Success!',
      description: `${selectedCount} time log${selectedCount !== 1 ? 's' : ''} submitted successfully`,
      duration: 4000
    })
  } catch (error) {
    notification.error({
      title: '❌ Error',
      description: 'Failed to submit logs: ' + error.message,
      duration: 5000
    })
  }
}

// Bookmark handlers
const handleToggleBookmark = async (ticket) => {
  try {
    const wasBookmarked = await bookmarks.toggleBookmark(ticket)
    if (wasBookmarked) {
      message.success(`Bookmarked ${ticket.idReadable}`)
    } else {
      message.info(`Removed bookmark for ${ticket.idReadable}`)
    }
  } catch (error) {
    message.error('Failed to update bookmark: ' + error.message)
  }
}


const handleClearAllBookmarks = () => {
  dialog.warning({
    title: 'Clear All Bookmarks',
    content: 'Are you sure you want to remove all bookmarked tickets? This action cannot be undone.',
    positiveText: 'Clear All',
    negativeText: 'Cancel',
    onPositiveClick: async () => {
      try {
        await bookmarks.clearAllBookmarks()
        message.success('All bookmarks cleared')
      } catch (error) {
        message.error('Failed to clear bookmarks: ' + error.message)
      }
    }
  })
}

// Modal handlers
const handleOpenModal = (ticketId) => {
  const existingLog = tickets.logs[ticketId]
  modal.openModal(ticketId, existingLog)
}

const handleModalSave = (timeLogs) => {
  try {
    if (!Array.isArray(timeLogs) || timeLogs.length === 0) {
      throw new Error('No time logs to save.')
    }
    // Save each time log for the ticket
    timeLogs.forEach(timeLog => {
      tickets.addTimeLog(modal.modal.ticketId, timeLog)
    })
    modal.closeModal()
    message.success(`Time logged for ${modal.modal.ticketId}`)
  } catch (error) {
    message.error(error.message)
  }
}
</script>

<style scoped>
.user-info-banner {
  margin-bottom: 16px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color);
}

.user-email {
  font-size: 12px;
  color: var(--text-muted);
}
</style> 