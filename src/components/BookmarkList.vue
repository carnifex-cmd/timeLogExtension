<template>
  <div class="bookmark-list-container">
    <n-card title="⭐ Bookmarked Tickets" size="medium">
      <template #header-extra>
        <n-space>
          <n-tag 
            :type="bookmarkedTickets.length > 0 ? 'warning' : 'default'" 
            size="small"
          >
            {{ bookmarkedTickets.length }} bookmarked
          </n-tag>
          <n-button
            v-if="bookmarkedTickets.length > 0"
            size="tiny"
            quaternary
            type="error"
            @click="$emit('clear-all')"
          >
            <template #icon>
              <i class="fas fa-trash"></i>
            </template>
            Clear All
          </n-button>
        </n-space>
      </template>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <n-spin size="medium">
          <template #description>
            Loading bookmarks...
          </template>
        </n-spin>
      </div>
      
      <!-- Bookmark Content -->
      <div v-else class="bookmark-content">
        <!-- No Bookmarks State -->
        <n-empty 
          v-if="bookmarkedTickets.length === 0"
          description="No bookmarked tickets"
          class="empty-state"
        >
        </n-empty>
        
        <!-- Bookmarks List -->
        <div v-else class="bookmarks-grid">
          <TicketItem
            v-for="ticket in visibleBookmarks"
            :key="ticket.idReadable"
            :ticket="ticket"
            :is-selected="selectedTickets[ticket.idReadable] || false"
            :time-log="logs[ticket.idReadable]"
            :is-bookmarked="true"
            @toggle-selection="handleToggleSelection"
            @open-modal="handleOpenModal"
            @toggle-bookmark="handleToggleBookmark"
          />
        </div>
        
        <!-- Show More Button -->
        <div v-if="hasMoreBookmarks" class="show-more-container">
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
            Show {{ Math.min(3, bookmarkedTickets.length - bookmarksToShow) }} more
          </n-button>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'
import TicketItem from './TicketItem.vue'

const props = defineProps({
  bookmarkedTickets: Array,
  selectedTickets: Object,
  logs: Object,
  loading: Boolean,
  bookmarksToShow: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits([
  'toggle-selection', 
  'open-modal', 
  'toggle-bookmark',
  'show-more', 
  'clear-all'
])

const visibleBookmarks = computed(() => 
  props.bookmarkedTickets.slice(0, props.bookmarksToShow)
)

const hasMoreBookmarks = computed(() => 
  props.bookmarkedTickets.length > props.bookmarksToShow
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
.bookmark-list-container {
  width: 100%;
  margin-bottom: 16px;
}

.loading-container {
  text-align: center;
  padding: 20px;
}

.bookmark-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}


.bookmarks-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.show-more-container {
  text-align: center;
  margin: 8px 0;
}

/* Custom card styling */
.bookmark-list-container :deep(.n-card-header) {
  padding-bottom: 16px;
}

.bookmark-list-container :deep(.n-empty) {
  padding: 16px 0;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .bookmarks-grid {
    gap: 1px;
  }
}
</style> 