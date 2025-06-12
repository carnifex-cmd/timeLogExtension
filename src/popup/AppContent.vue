<template>
  <div class="app-container">
    <!-- Authentication Form -->
    <AuthenticationForm
      v-if="!auth.isAuthenticated.value"
      :ytUrl="auth.ytUrl.value"
      :ytToken="auth.ytToken.value"
      :loading="tickets.loading.value"
      @save="handleAuthSave"
      @update:ytUrl="auth.ytUrl.value = $event"
      @update:ytToken="auth.ytToken.value = $event"
    />

    <!-- Ticket Management -->
    <TicketList
      v-else
      :tickets="tickets.tickets.value"
      :filtered-tickets="tickets.filteredTickets.value"
      :selected-tickets="tickets.selectedTickets"
      :logs="tickets.logs"
      :loading="tickets.loading.value"
      :search-query="tickets.searchQuery.value"
      :tickets-to-show="tickets.ticketsToShow.value"
      @update:search-query="tickets.searchQuery.value = $event"
      @toggle-selection="handleToggleSelection"
      @open-modal="handleOpenModal"
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
import TicketList from '../components/TicketList.vue'
import TimeLogModal from '../components/TimeLogModal.vue'
import { useAuth } from '../composables/useAuth.js'
import { useTickets } from '../composables/useTickets.js'
import { useModal } from '../composables/useModal.js'

// Initialize Naive UI composables (now inside provider context)
const message = useMessage()
const dialog = useDialog()
const notification = useNotification()

// Initialize composables
const auth = useAuth()
const tickets = useTickets()
const modal = useModal()

// Load authentication on mount
onMounted(async () => {
  const isAuthenticated = await auth.loadAuth()
  if (isAuthenticated) {
    await loadTickets()
  }
})

// Authentication handlers
const handleAuthSave = async () => {
  try {
    await auth.saveAuth()
    await loadTickets()
    notification.success({
      title: '🎉 Connected!',
      description: 'Successfully connected to YouTrack',
      duration: 3000
    })
  } catch (error) {
    message.error('Failed to save authentication: ' + error.message)
  }
}

// Ticket handlers
const loadTickets = async () => {
  try {
    await tickets.fetchTickets(auth.ytUrl.value, auth.ytToken.value)
    const ticketCount = tickets.tickets.value.length
    if (ticketCount > 0) {
      message.success(`Loaded ${ticketCount} ticket${ticketCount !== 1 ? 's' : ''}`)
    }
  } catch (error) {
    message.error('Could not load tickets. Check your credentials.')
    auth.logout()
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
    await tickets.submitLogs(auth.ytUrl.value, auth.ytToken.value)
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

// Modal handlers
const handleOpenModal = (ticketId) => {
  const existingLog = tickets.logs[ticketId]
  modal.openModal(ticketId, existingLog)
}

const handleModalSave = () => {
  try {
    modal.validateModal()
    const timeLog = modal.getModalData()
    tickets.addTimeLog(modal.modal.ticketId, timeLog)
    modal.closeModal()
    
    message.success(`Time logged for ${modal.modal.ticketId}`)
  } catch (error) {
    message.error(error.message)
  }
}
</script> 