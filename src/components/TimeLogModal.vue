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
          <n-form-item label="Date" path="date">
            <n-input
              v-model:value="formData.date"
              type="date"
              :max="todayDate"
            >
              <template #prefix>
                <i class="fas fa-calendar"></i>
              </template>
            </n-input>
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
import { reactive, computed, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  show: Boolean,
  ticketId: String,
  time: String,
  date: String,
  comment: String
})

const emit = defineEmits(['close', 'save', 'update:time', 'update:date', 'update:comment'])

const formData = reactive({
  time: props.time || '',
  date: props.date || getTodayDate(),
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

const todayDate = computed(() => getTodayDate())

const isFormValid = computed(() => 
  formData.time.trim() && formData.date.trim()
)

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
  date: [
    {
      required: true,
      message: 'Please select a date',
      trigger: ['input', 'blur']
    }
  ]
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

// Watch for prop changes and update form data
watch(() => props.time, (newValue) => {
  formData.time = newValue || ''
})

watch(() => props.date, (newValue) => {
  formData.date = newValue || getTodayDate()
})

watch(() => props.comment, (newValue) => {
  formData.comment = newValue || ''
})

// Watch for form changes and emit updates
watch(() => formData.time, (newValue) => {
  emit('update:time', newValue)
})

watch(() => formData.date, (newValue) => {
  emit('update:date', newValue)
})

watch(() => formData.comment, (newValue) => {
  emit('update:comment', newValue)
})

const handleSave = () => {
  if (!isFormValid.value) {
    window.$message?.error('Please fill in all required fields')
    return
  }
  emit('save')
}
</script>

<style scoped>
/* Custom modal styling */
:deep(.n-card.n-modal) {
  max-width: 500px;
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
</style> 