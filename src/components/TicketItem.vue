<template>
  <div class="ticket">
    <div class="ticket-info">
      <input 
        type="checkbox" 
        :checked="isSelected"
        @change="$emit('toggle-selection', ticket.idReadable)" 
      />
      <span class="ticket-id" :title="ticket.idReadable">
        {{ ticket.idReadable }}
      </span>
      <span class="ticket-summary" :title="ticket.summary">
        {{ ticket.summary }}
      </span>
    </div>
    <div class="ticket-actions">
      <button 
        class="action-btn" 
        @click="$emit('open-modal', ticket.idReadable)"
        :title="'Add time to ' + ticket.idReadable"
      >
        <i class="fas fa-clock"></i>
      </button>
      <span v-if="timeLog" class="ticket-log">
        [{{ timeLog.time }} on {{ timeLog.date }}]
      </span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

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
  }
})

const emit = defineEmits(['toggle-selection', 'open-modal'])
</script>

<style scoped>
.ticket {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--background-color);
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  overflow: hidden;
}

.ticket-info {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  flex: 1;
  min-width: 0; /* Important for proper flex behavior */
}

.ticket-id {
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 600;
}

.ticket-summary {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.ticket-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.action-btn {
  width: 40px;
  margin-left: 5px;
  height: 36px;
  font-size: 0.9rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  transition: background-color 0.3s ease, transform 0.1s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.action-btn:hover {
  background-color: var(--primary-color-hover);
  transform: scale(1.05);
}

input[type="checkbox"] {
  appearance: none;
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  flex-shrink: 0;
  border: 1px solid var(--primary-color);
  border-radius: 50%;
  outline: none;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
}

input[type="checkbox"]:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

input[type="checkbox"]:checked::before {
  content: '';
  width: 10px;
  height: 10px;
  background-color: white;
  border-radius: 50%;
}

input[type="checkbox"]:hover {
  border-color: var(--primary-color-hover);
}

.ticket-log {
  font-size: 0.8rem;
  color: var(--secondary-color);
  font-weight: 500;
}
</style> 