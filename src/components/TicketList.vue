<template>
  <div class="ticket-list-container">
    <h3>Your Tickets</h3>
    
    <input 
      v-model="searchQuery" 
      placeholder="Search tickets..." 
      class="search-input" 
    />
    
    <div v-if="loading" class="loading">Loading...</div>
    
    <div v-else class="ticket-content">
      <div class="tickets">
        <TicketItem
          v-for="ticket in visibleTickets"
          :key="ticket.idReadable"
          :ticket="ticket"
          :is-selected="selectedTickets[ticket.idReadable] || false"
          :time-log="logs[ticket.idReadable]"
          @toggle-selection="handleToggleSelection"
          @open-modal="handleOpenModal"
        />
      </div>
      
      <button 
        v-if="hasMoreTickets" 
        @click="$emit('show-more')" 
        class="show-more-btn"
        :title="'Show more tickets (${visibleTickets.length}/${filteredTickets.length})'"
      >
        <span class="arrow"></span>
      </button>
      
      <button 
        class="submit-btn" 
        @click="$emit('submit-logs')"
        :disabled="!hasSelectedTickets"
      >
        Submit Selected Logs
      </button>
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
  loading: Boolean,
  searchQuery: String,
  ticketsToShow: Number
})

const emit = defineEmits([
  'update:searchQuery',
  'toggle-selection', 
  'open-modal', 
  'show-more', 
  'submit-logs'
])

const searchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('update:searchQuery', value)
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

const handleToggleSelection = (ticketId) => {
  emit('toggle-selection', ticketId)
}

const handleOpenModal = (ticketId) => {
  emit('open-modal', ticketId)
}
</script>

<style scoped>
.ticket-list-container h3 {
  text-align: center;
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 16px;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 24, 146, 0.1);
}

.loading {
  text-align: center;
  padding: 20px;
  color: var(--text-color);
}

.ticket-content {
  display: flex;
  flex-direction: column;
}

.tickets {
  margin-bottom: 20px;
}

.show-more-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: -20px auto 10px auto;
  transition: background-color 0.3s ease, transform 0.2s ease;
  padding: 0;
  position: relative;
  z-index: 1;
}

.show-more-btn:hover {
  background-color: var(--primary-color-hover);
  transform: scale(1.1);
}

.arrow {
  display: block;
  width: 12px;
  height: 12px;
  border-width: 3px;
  border-style: solid;
  border-color: transparent transparent white white;
  transform: rotate(-45deg) translate(3px, -3px);
}

.submit-btn {
  padding: 12px 16px;
  background-color: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.submit-btn:disabled {
  background-color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style> 