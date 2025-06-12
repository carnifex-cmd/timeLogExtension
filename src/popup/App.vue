<template>
  <div class="container">
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
import AuthenticationForm from '../components/AuthenticationForm.vue'
import TicketList from '../components/TicketList.vue'
import TimeLogModal from '../components/TimeLogModal.vue'
import { useAuth } from '../composables/useAuth.js'
import { useTickets } from '../composables/useTickets.js'
import { useModal } from '../composables/useModal.js'

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
  } catch (error) {
    alert('Failed to save authentication: ' + error.message)
  }
}

// Ticket handlers
const loadTickets = async () => {
  try {
    await tickets.fetchTickets(auth.ytUrl.value, auth.ytToken.value)
  } catch (error) {
    alert('Could not load tickets. Check your credentials.')
    auth.logout()
  }
}

const handleToggleSelection = (ticketId) => {
  tickets.selectedTickets[ticketId] = !tickets.selectedTickets[ticketId]
}

const handleSubmitLogs = async () => {
  try {
    await tickets.submitLogs(auth.ytUrl.value, auth.ytToken.value)
    alert('Logs submitted successfully!')
  } catch (error) {
    alert('An error occurred while submitting logs: ' + error.message)
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
  } catch (error) {
    alert(error.message)
  }
}
</script>

<style>
/* Import global styles */
@import '../styles/global.css';
</style>