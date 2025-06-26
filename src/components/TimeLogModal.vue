<template>
  <n-modal
    v-model:show="modalShow"
    preset="card"
    :title="modalTitle"
    size="medium"
    :bordered="false"
    :segmented="true"
    @close="$emit('close')"
  >
    <template #header-extra>
      <n-tag type="primary" size="small">
        {{ ticketId }}
      </n-tag>
    </template>
    
    <!-- Logged Time Information -->
    <div v-if="loggedTime" class="logged-time-section">
      <n-alert type="info" title="Previously Logged Time" :show-icon="false">
        <template #icon>
          <i class="fas fa-history"></i>
        </template>
        <div class="logged-time-content">
          <div class="total-time">
            <strong>Total: {{ loggedTime.totalFormatted }}</strong>
          </div>
          
          <div v-if="loggedTime.workItems && loggedTime.workItems.length > 0" class="recent-entries">
            <div class="recent-entries-header">
              <strong>Recent entries:</strong>
            </div>
            <div 
              v-for="(item, index) in loggedTime.workItems.slice(0, 3)" 
              :key="index"
              class="work-item"
            >
              • {{ item.duration?.presentation || 'Unknown' }}
              <span v-if="item.date" class="work-item-date">
                ({{ formatWorkItemDate(new Date(item.date)) }})
              </span>
              <span v-if="item.text" class="work-item-text">
                - {{ item.text.slice(0, 50) }}{{ item.text.length > 50 ? '...' : '' }}
              </span>
            </div>
            <div v-if="loggedTime.workItems.length > 3" class="more-entries">
              ... and {{ loggedTime.workItems.length - 3 }} more entries
            </div>
          </div>
        </div>
      </n-alert>
    </div>
    
    <n-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="top"
      require-mark-placement="right-hanging"
      size="medium"
      @submit.prevent="handleSave"
    >
      <n-grid :cols="2" :x-gap="16">
        <n-grid-item>
          <n-form-item label="Time Spent" path="time">
            <n-input
              v-model:value="formData.time"
              placeholder="e.g. 2h 30m, 1.5h, 90m"
              clearable
            >
              <template #prefix>
                <i class="fas fa-clock"></i>
              </template>
            </n-input>
          </n-form-item>
        </n-grid-item>
        
        <n-grid-item>
          <n-form-item label="Date Range" path="dateRange">
            <n-date-picker
              v-model:value="formData.dateRange"
              type="daterange"
              :max="todayDate"
              clearable
              :shortcuts="dateShortcuts"
              to="body"
              :panel-cols="1"
            >
              <template #prefix>
                <i class="fas fa-calendar"></i>
              </template>
            </n-date-picker>
          </n-form-item>
        </n-grid-item>
      </n-grid>
      
      <n-form-item label="Work Description" path="comment">
        <n-input
          v-model:value="formData.comment"
          type="textarea"
          placeholder="Describe what you worked on... (optional)"
          :rows="3"
          clearable
          show-count
          maxlength="500"
        >
        </n-input>
      </n-form-item>

      <n-alert v-if="selectedDates.length > 0" type="info" title="Selected Dates">
        <template #icon>
          <i class="fas fa-info-circle"></i>
        </template>
        Time will be logged for {{ selectedDates.length }} day(s):
        <n-space vertical>
          <n-tag v-for="date in selectedDates" :key="date" type="info" size="small">
            {{ formatDate(date) }}
          </n-tag>
        </n-space>
      </n-alert>
    </n-form>
    
    <template #action>
      <n-space justify="end">
        <n-button
          @click="$emit('close')"
          size="medium"
        >
          <template #icon>
            <i class="fas fa-times"></i>
          </template>
          Cancel
        </n-button>
        
        <n-button
          type="primary"
          size="medium"
          @click="handleSave"
          :disabled="!isFormValid"
          strong
        >
          <template #icon>
            <i class="fas fa-save"></i>
          </template>
          Save Time Log
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { reactive, computed, watch, defineProps, defineEmits, ref } from 'vue'

const props = defineProps({
  show: Boolean,
  ticketId: String,
  time: String,
  date: String,
  comment: String,
  loggedTime: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save', 'update:time', 'update:date', 'update:comment'])

const formRef = ref(null)
const formData = reactive({
  time: props.time || '',
  dateRange: null,
  comment: props.comment || ''
})

const modalShow = computed({
  get: () => props.show,
  set: (value) => {
    if (!value) {
      emit('close')
    }
  }
})

const modalTitle = computed(() => 
  `⏱️ Log Time for ${props.ticketId || 'Ticket'}`
)

const todayDate = computed(() => new Date().getTime())

const selectedDates = computed(() => {
  if (!formData.dateRange || !Array.isArray(formData.dateRange) || formData.dateRange.length !== 2) return []
  const [start, end] = formData.dateRange
  if (typeof start !== 'number' || typeof end !== 'number') return []
  const dates = []
  const currentDate = new Date(start)
  const endDate = new Date(end)
  // Remove time part for comparison
  currentDate.setHours(0,0,0,0)
  endDate.setHours(0,0,0,0)
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return dates
})

const isFormValid = computed(() => 
  formData.time.trim() &&
  Array.isArray(formData.dateRange) &&
  formData.dateRange.length === 2 &&
  typeof formData.dateRange[0] === 'number' &&
  typeof formData.dateRange[1] === 'number' &&
  selectedDates.value.length > 0
)

const dateShortcuts = {
  'Last 7 days': () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    return [start.getTime(), end.getTime()]
  },
  'Last 30 days': () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 29)
    return [start.getTime(), end.getTime()]
  },
  'This week': () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - start.getDay())
    return [start.getTime(), end.getTime()]
  }
}

const rules = {
  time: [
    {
      required: true,
      message: 'Please enter time spent',
      trigger: ['input', 'blur']
    },
    {
      pattern: /^(\d+(\.\d+)?[hm]\s?)+$|^\d+(\.\d+)?h?\s?\d*m?$/i,
      message: 'Please use format like "2h 30m", "1.5h", or "90m"',
      trigger: ['input', 'blur']
    }
  ],
  dateRange: [
    {
      validator (rule, value) {
        return Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number';
      },
      message: 'Please select a date range',
      trigger: ['input', 'blur']
    }
  ]
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatDateForAPI(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatWorkItemDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Watch for prop changes and update form data
watch(() => props.time, (newValue) => {
  formData.time = newValue || ''
})

watch(() => props.comment, (newValue) => {
  formData.comment = newValue || ''
})

// Watch for form changes and emit updates
watch(() => formData.time, (newValue) => {
  emit('update:time', newValue)
})

watch(() => formData.comment, (newValue) => {
  emit('update:comment', newValue)
})

const handleSave = () => {
  if (!formRef.value) return
  formRef.value.validate((errors) => {
    if (errors) {
      window.$message?.error('Please fill out both the time and date fields.')
      return
    }
    // Create an array of time log entries for each date
    const timeLogs = selectedDates.value.map(date => ({
      date: formatDateForAPI(date),
      time: formData.time,
      comment: formData.comment
    }))
    emit('save', timeLogs)
  })
}
</script>

<style scoped>
/* Custom modal styling */
:deep(.n-card.n-modal) {
  max-width: 600px;
  width: 90vw;
}

:deep(.n-card-header) {
  padding-bottom: 16px;
}

:deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-color);
}

/* Enhanced textarea styling */
:deep(.n-input--textarea .n-input__textarea) {
  resize: vertical;
  min-height: 80px;
}

/* Grid responsiveness */
@media (max-width: 480px) {
  :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}

/* Date range picker styling */
:deep(.n-date-picker) {
  width: 100%;
}

/* Logged time section styling */
.logged-time-section {
  margin-bottom: 20px;
}

.logged-time-content {
  font-size: 14px;
}

.total-time {
  margin-bottom: 12px;
  font-size: 16px;
  color: var(--primary-color, #0066ff);
}

.recent-entries {
  margin-top: 8px;
}

.recent-entries-header {
  margin-bottom: 6px;
  font-size: 13px;
}

.work-item {
  margin-bottom: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-color-2, #666);
}

.work-item-date {
  color: var(--text-color-3, #999);
  font-size: 11px;
}

.work-item-text {
  color: var(--text-color-2, #666);
  font-style: italic;
}

.more-entries {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-color-3, #999);
  font-style: italic;
}
</style> 