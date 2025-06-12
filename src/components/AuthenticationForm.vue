<template>
  <n-card title="🔐 Authenticate" size="medium" class="auth-card">
    <template #header-extra>
      <n-tag type="info" size="small">YouTrack</n-tag>
    </template>
    
    <n-form 
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="top"
      require-mark-placement="right-hanging"
      size="medium"
      @submit.prevent="handleSubmit"
    >
      <n-form-item label="YouTrack Base URL" path="ytUrl">
        <n-input
          v-model:value="formData.ytUrl"
          placeholder="https://your-company.youtrack.cloud"
          clearable
          :disabled="loading"
        />
      </n-form-item>
      
      <n-form-item label="API Token" path="ytToken">
        <n-input
          v-model:value="formData.ytToken"
          type="password"
          show-password-on="mousedown"
          placeholder="Your YouTrack permanent token"
          clearable
          :disabled="loading"
        />
      </n-form-item>
      
      <n-form-item>
        <n-button
          type="primary"
          size="medium"
          :loading="loading"
          :disabled="!formData.ytUrl || !formData.ytToken"
          attr-type="submit"
          block
          strong
        >
          <template #icon>
            <i class="fas fa-key"></i>
          </template>
          {{ loading ? 'Connecting...' : 'Connect to YouTrack' }}
        </n-button>
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="center">
        <n-tag size="tiny" type="warning">
          <template #icon>
            <i class="fas fa-info-circle"></i>
          </template>
          Your credentials are stored locally
        </n-tag>
      </n-space>
    </template>
  </n-card>
</template>

<script setup>
import { reactive, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  ytUrl: String,
  ytToken: String,
  loading: Boolean
})

const emit = defineEmits(['save', 'update:ytUrl', 'update:ytToken'])

const formData = reactive({
  ytUrl: props.ytUrl || '',
  ytToken: props.ytToken || ''
})

const rules = {
  ytUrl: [
    {
      required: true,
      message: 'Please enter your YouTrack URL',
      trigger: ['input', 'blur']
    },
    {
      pattern: /^https?:\/\/.+/,
      message: 'Please enter a valid URL (starting with http:// or https://)',
      trigger: ['input', 'blur']
    }
  ],
  ytToken: [
    {
      required: true,
      message: 'Please enter your API token',
      trigger: ['input', 'blur']
    },
    {
      min: 10,
      message: 'API token seems too short',
      trigger: ['input', 'blur']
    }
  ]
}

// Watch for changes and emit updates
watch(() => formData.ytUrl, (newValue) => {
  emit('update:ytUrl', newValue)
})

watch(() => formData.ytToken, (newValue) => {
  emit('update:ytToken', newValue)
})

// Update form data when props change
watch(() => props.ytUrl, (newValue) => {
  formData.ytUrl = newValue || ''
})

watch(() => props.ytToken, (newValue) => {
  formData.ytToken = newValue || ''
})

const handleSubmit = () => {
  emit('save')
}
</script>

<style scoped>
.auth-card {
  max-width: 100%;
  margin: 0 auto;
}

.auth-card :deep(.n-card-header) {
  padding-bottom: 16px;
}

.auth-card :deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-color);
}
</style> 