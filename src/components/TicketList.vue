<template>
  <div class="ticket-list-container">
    <n-card title="🎫 Your Tickets" size="medium">
      <template #header-extra>
        <n-tag 
          :type="hasSelectedTickets ? 'success' : 'default'" 
          size="small"
        >
          {{ selectedCount }} selected
        </n-tag>
      </template>
      
      <!-- Search Input -->
      <n-input
        v-model:value="searchQuery"
        placeholder="🔍 Search tickets by ID or summary..."
        clearable
        size="medium"
        class="search-input"
      >
        <template #prefix>
          <i class="fas fa-search"></i>
        </template>
      </n-input>
      
      <!-- Include Closed Tickets Toggle -->
      <div class="closed-tickets-toggle">
        <n-switch
          v-model:value="includeClosedTickets"
          size="medium"
        >
          <template #checked>
            <span class="toggle-text">📦 Including Closed</span>
          </template>
          <template #unchecked>
            <span class="toggle-text">📂 Open Only</span>
          </template>
        </n-switch>
        <n-text depth="3" class="toggle-hint">
          <i class="fas fa-info-circle"></i>
          Shows closed tickets from last 4 weeks
        </n-text>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <n-spin size="medium">
          <template #description>
            Loading your tickets...
          </template>
        </n-spin>
      </div>
      
      <!-- Ticket Content -->
      <div v-else class="ticket-content">
        <!-- No Results State -->
        <n-empty 
          v-if="filteredTickets.length === 0 && !loading"
          description="No tickets found"
          class="empty-state"
        >
          <template #icon>
            <i class="fas fa-ticket-alt"></i>
          </template>
          <template #extra>
            <n-button size="small" @click="searchQuery = ''">
              Clear Search
            </n-button>
          </template>
        </n-empty>
        
        <!-- Tickets List -->
        <div v-else class="tickets-grid">
          <TicketItem
            v-for="ticket in visibleTickets"
            :key="ticket.idReadable"
            :ticket="ticket"
            :is-selected="selectedTickets[ticket.idReadable] || false"
            :is-bookmarked="bookmarkedTickets && bookmarkedTickets[ticket.idReadable] || false"
            :time-log="logs[ticket.idReadable]"
            :logged-time-data="loggedTimeData && loggedTimeData[ticket.idReadable]"
            :is-loading-logged-time="loadingLoggedTime && loadingLoggedTime[ticket.idReadable]"
            @toggle-selection="handleToggleSelection"
            @open-modal="handleOpenModal"
            @toggle-bookmark="handleToggleBookmark"
          />
        </div>
        
        <!-- Show More Button -->
        <div v-if="hasMoreTickets" class="show-more-container">
          <n-button
            @click="$emit('show-more')"
            type="primary"
            ghost
            size="small"
            round
          >
            <template #icon>
              <i class="fas fa-chevron-down"></i>
            </template>
            Show {{ Math.min(5, filteredTickets.length - ticketsToShow) }} more
          </n-button>
        </div>
      </div>
    </n-card>
    
    <!-- Sticky Submit Button -->
    <div class="submit-container-sticky">
      <n-button
        @click="$emit('submit-logs')"
        type="success"
        size="large"
        :disabled="!hasSelectedTickets"
        strong
      >
        <template #icon>
          <i class="fas fa-paper-plane"></i>
        </template>
        Submit {{ selectedCount }} Time Log{{ selectedCount !== 1 ? 's' : '' }}
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'
import TicketItem from './TicketItem.vue'

const props = defineProps({
  tickets: Array,
  filteredTickets: Array,
  selectedTickets: Object,
  logs: Object,
  loggedTimeData: Object,
  loading: Boolean,
  searchQuery: String,
  ticketsToShow: Number,
  bookmarkedTickets: Object,
  loadingLoggedTime: Object,
  includeClosedTickets: Boolean
})

const emit = defineEmits([
  'update:searchQuery',
  'toggle-selection', 
  'open-modal', 
  'toggle-bookmark',
  'show-more',
  'submit-logs',
  'toggle-closed-tickets'
])

const searchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value)
})

const includeClosedTickets = computed({
  get: () => props.includeClosedTickets,
  set: (value) => emit('toggle-closed-tickets', value)
})

const visibleTickets = computed(() => 
  props.filteredTickets.slice(0, props.ticketsToShow)
)

const hasMoreTickets = computed(() => 
  props.filteredTickets.length > props.ticketsToShow
)

const hasSelectedTickets = computed(() => 
  Object.values(props.selectedTickets).some(Boolean)
)

const selectedCount = computed(() => 
  Object.values(props.selectedTickets).filter(Boolean).length
)

const handleToggleSelection = (ticketId) => {
  emit('toggle-selection', ticketId)
}

const handleOpenModal = (ticketId) => {
  emit('open-modal', ticketId)
}

const handleToggleBookmark = (ticket) => {
  emit('toggle-bookmark', ticket)
}
</script>

<style scoped>
.ticket-list-container {
  width: 100%;
  position: relative;
  padding-bottom: 80px; /* Space for sticky button */
}

.search-input {
  margin-bottom: 16px;
}

.closed-tickets-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.toggle-text {
  font-size: 13px;
  font-weight: 500;
}

.toggle-hint {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-container {
  text-align: center;
  padding: 40px 20px;
}

.ticket-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  padding: 20px;
}

.tickets-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.show-more-container {
  text-align: center;
  margin: 8px 0;
}

.submit-container-sticky {
  position: fixed;
  bottom: 16px;
  right: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* Custom card styling */
.ticket-list-container :deep(.n-card-header) {
  padding-bottom: 16px;
}

.ticket-list-container :deep(.n-empty) {
  padding: 20px 0;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .tickets-grid {
    gap: 1px;
  }
}
</style> 