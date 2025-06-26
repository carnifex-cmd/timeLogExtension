<template>
  <n-card 
    :class="['ticket-card', { 'ticket-selected': isSelected }]"
    size="small" 
    hoverable
  >
    <div class="ticket-content">
      <div class="ticket-info">
        <n-checkbox
          :checked="isSelected"
          @update:checked="$emit('toggle-selection', ticket.idReadable)"
          size="medium"
        />
        
        <n-tag 
          :type="isSelected ? 'primary' : 'default'"
          size="small"
          strong
          class="ticket-id-tag"
        >
          {{ ticket.idReadable }}
        </n-tag>
        
        <n-tooltip trigger="hover" :disabled="!isSummaryTruncated">
          <template #trigger>
            <span class="ticket-summary" ref="summaryRef">
              {{ ticket.summary }}
            </span>
          </template>
          {{ ticket.summary }}
        </n-tooltip>
      </div>
      
      <div class="ticket-actions">
        <n-button
          :type="isBookmarked ? 'warning' : 'default'"
          size="small"
          circle
          @click="$emit('toggle-bookmark', ticket)"
          class="bookmark-btn"
        >
          <template #icon>
            <i :class="isBookmarked ? 'fas fa-star' : 'far fa-star'"></i>
          </template>
        </n-button>
        
        <div class="time-btn-container">
          <n-button
            :type="timeLog ? 'warning' : 'primary'"
            size="small"
            circle
            @click="$emit('open-modal', ticket.idReadable)"
            class="time-btn"
            :loading="isLoadingLoggedTime"
          >
            <template #icon>
              <i class="fas fa-clock"></i>
            </template>
          </n-button>
          
          <!-- Notification badge for total logged time -->
          <div 
            v-if="loggedTimeData && loggedTimeData.totalFormatted && loggedTimeData.totalFormatted !== '0m'"
            class="time-badge total-time-badge"
            :title="`Total logged: ${loggedTimeData.totalFormatted}`"
          >
            {{ loggedTimeData.totalFormatted }}
          </div>
        </div>
      </div>
    </div>
  </n-card>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  timeLog: {
    type: Object,
    default: null
  },
  loggedTimeData: {
    type: Object,
    default: null
  },
  isBookmarked: {
    type: Boolean,
    default: false
  },
  isLoadingLoggedTime: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-selection', 'open-modal', 'toggle-bookmark'])

const summaryRef = ref(null)
const isSummaryTruncated = ref(false)



onMounted(() => {
  // Check if summary text is truncated
  if (summaryRef.value) {
    isSummaryTruncated.value = summaryRef.value.scrollWidth > summaryRef.value.clientWidth
  }
})
</script>

<style scoped>
.ticket-card {
  margin-bottom: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.ticket-card.ticket-selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px rgba(0, 24, 146, 0.2);
}

.ticket-card:hover {
  transform: translateY(-1px);
}

.ticket-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.ticket-info {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.ticket-id-tag {
  flex-shrink: 0;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.ticket-summary {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.4;
}

.ticket-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.bookmark-btn,
.time-btn {
  min-width: 32px;
  height: 32px;
}

.bookmark-btn {
  transition: all 0.3s ease;
}

.bookmark-btn:hover {
  transform: scale(1.1);
}

.time-btn-container {
  position: relative;
  display: inline-block;
}

.time-badge {
  position: absolute;
  font-size: 9px;
  font-weight: 600;
  border-radius: 8px;
  padding: 1px 4px;
  line-height: 1.2;
  color: white;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 10;
  white-space: nowrap;
  min-width: 16px;
  text-align: center;
}

.total-time-badge {
  top: -6px;
  right: -8px;
  background: #18a058;
  max-width: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
}



/* Override Naive UI card padding for compact look */
.ticket-card :deep(.n-card__content) {
  padding: 12px 16px;
}

/* Custom checkbox styling */
.ticket-card :deep(.n-checkbox) {
  --n-size: 20px;
}
</style> 