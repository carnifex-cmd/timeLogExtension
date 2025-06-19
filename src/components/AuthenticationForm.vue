<template>
  <n-card title="🔐 Login to YouTrack" size="large" class="auth-card">
    <!-- Method Selection Screen -->
    <div v-if="!selectedMethod" class="method-selection">
      <div class="welcome-text">
        <h3>Choose your authentication method</h3>
        <p>Select how you'd like to connect to YouTrack</p>
      </div>
      
      <div class="method-cards">
        <!-- API Token Method -->
        <div class="method-card" @click="selectMethod('token')">
          <div class="method-content">
            <div class="method-icon">
              <i class="fas fa-key" style="color: #2080f0;"></i>
            </div>
            <div class="method-info">
              <div class="method-title">API Token</div>
              <div class="method-description">Use a permanent API token from YouTrack</div>
            </div>
            <div class="method-arrow">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
        
        <!-- Auto-Detect Method -->
        <div class="method-card" @click="selectMethod('youtrack-token')">
          <div class="method-content">
            <div class="method-icon">
              <i class="fas fa-magic" style="color: #18a058;"></i>
            </div>
            <div class="method-info">
              <div class="method-title">Auto-Detect</div>
              <div class="method-description">Automatically detect from your logged-in YouTrack session</div>
            </div>
            <div class="method-arrow">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- API Token Form -->
    <div v-else-if="selectedMethod === 'token'" class="auth-form">
      <n-space direction="vertical" size="medium">
        <div class="form-header">
          <n-button text @click="goBack">
            <template #icon>
              <i class="fas fa-arrow-left"></i>
            </template>
            Back
          </n-button>
          <h3>🔑 API Token Authentication</h3>
          <p>Enter your YouTrack URL and permanent API token</p>
        </div>

        <n-form 
          ref="tokenFormRef"
          :model="tokenFormData"
          :rules="tokenRules"
          label-placement="top"
          require-mark-placement="right-hanging"
          size="medium"
          @submit.prevent="handleTokenSubmit"
        >
          <n-form-item label="YouTrack Base URL" path="ytUrl">
            <n-input
              v-model:value="tokenFormData.ytUrl"
              placeholder="https://your-company.youtrack.cloud"
              clearable
              :disabled="loading"
            />
          </n-form-item>
          
          <n-form-item label="Permanent Token" path="ytToken">
            <n-input
              v-model:value="tokenFormData.ytToken"
              type="password"
              placeholder="perm:xxxxxxxxxx"
              clearable
              :disabled="loading"
              show-password-on="click"
            />
          </n-form-item>
          
          <n-form-item>
            <n-button
              type="primary"
              size="large"
              :loading="loading"
              :disabled="!isTokenFormValid"
              attr-type="submit"
              block
              strong
            >
              <template #icon>
                <i class="fas fa-sign-in-alt"></i>
              </template>
              {{ loading ? 'Connecting...' : 'Connect' }}
            </n-button>
          </n-form-item>
        </n-form>
        
        <n-alert type="info" size="small" class="auth-info">
          <template #icon>
            <i class="fas fa-info-circle"></i>
          </template>
          Generate a permanent token in YouTrack: Settings → Security → New Token
        </n-alert>
      </n-space>
    </div>

    <!-- Auto-Detect Form -->
    <div v-else-if="selectedMethod === 'youtrack-token'" class="auth-form">
      <n-space direction="vertical" size="medium">
        <div class="form-header">
          <n-button text @click="goBack">
            <template #icon>
              <i class="fas fa-arrow-left"></i>
            </template>
            Back
          </n-button>
          <h3>🔍 Auto-Detect Authentication</h3>
          <p>Automatically extract authentication from your YouTrack browser session</p>
        </div>

        <n-steps :current="autoDetectStep" size="small">
          <n-step title="Open YouTrack" description="Login to YouTrack in a browser tab" />
          <n-step title="Auto-detect" description="Extension will find your authentication" />
          <n-step title="Connected" description="You're ready to log time!" />
        </n-steps>

        <n-card class="instruction-card">
          <n-space direction="vertical" size="small">
            <div class="instruction-title">
              <i class="fas fa-list-ol"></i>
              Instructions:
            </div>
            <ol class="instruction-list">
              <li>Make sure you're logged into <strong>production YouTrack</strong> in a browser tab</li>
              <li>Click the "Auto-Detect" button below</li>
              <li>The extension will automatically find and use your authentication</li>
            </ol>
          </n-space>
        </n-card>
        
        <n-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleYouTrackTokenSubmit"
          block
          strong
        >
          <template #icon>
            <i class="fas fa-search"></i>
          </template>
          {{ loading ? 'Scanning...' : 'Auto-Detect Authentication' }}
        </n-button>
        
        <n-alert type="warning" size="small" class="auth-info">
          <template #icon>
            <i class="fas fa-exclamation-triangle"></i>
          </template>
          Only works with production YouTrack. Make sure you're logged in before clicking Auto-Detect.
        </n-alert>
      </n-space>
    </div>

    <template #footer>
      <n-space justify="center">
        <n-tag size="tiny" type="info">
          <template #icon>
            <i class="fas fa-shield-alt"></i>
          </template>
          Your credentials are stored locally and encrypted
        </n-tag>
      </n-space>
    </template>
  </n-card>
</template>

<script setup>
import { reactive, computed, ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  ytUrl: String,
  ytToken: String,
  authType: {
    type: String,
    default: 'token'
  },
  loading: Boolean
})

const emit = defineEmits([
  'save-token', 
  'save-youtrack-token',
  'update:ytUrl', 
  'update:ytToken', 
  'update:authType'
])

// Method selection state
const selectedMethod = ref(null)
const autoDetectStep = ref(1)

const tokenFormData = reactive({
  ytUrl: props.ytUrl || '',
  ytToken: props.ytToken || ''
})

const tokenRules = {
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
      message: 'Please enter your permanent token',
      trigger: ['input', 'blur']
    },
    {
      min: 10,
      message: 'Token seems too short',
      trigger: ['input', 'blur']
    }
  ]
}

const isTokenFormValid = computed(() => 
  tokenFormData.ytUrl.trim() && tokenFormData.ytToken.trim()
)

// Method selection
const selectMethod = (method) => {
  selectedMethod.value = method
  emit('update:authType', method)
  
  if (method === 'youtrack-token') {
    autoDetectStep.value = 1
  }
}

const goBack = () => {
  selectedMethod.value = null
  autoDetectStep.value = 1
}

// Form handlers
const handleTokenSubmit = () => {
  emit('save-token')
}

const handleYouTrackTokenSubmit = () => {
  autoDetectStep.value = 2
  emit('save-youtrack-token')
}

// Watch for changes and emit updates
watch(() => tokenFormData.ytUrl, (newValue) => {
  emit('update:ytUrl', newValue)
})

watch(() => tokenFormData.ytToken, (newValue) => {
  emit('update:ytToken', newValue)
})

// Update form data when props change
watch(() => props.ytUrl, (newValue) => {
  tokenFormData.ytUrl = newValue || ''
})

watch(() => props.ytToken, (newValue) => {
  tokenFormData.ytToken = newValue || ''
})

// Watch loading state for auto-detect
watch(() => props.loading, (newValue) => {
  if (selectedMethod.value === 'youtrack-token') {
    if (newValue) {
      autoDetectStep.value = 2
    } else {
      // If not loading anymore and we were on step 2, either success or error
      // Let the parent component handle showing success/error messages
      autoDetectStep.value = 1
    }
  }
})
</script>

<style scoped>
.auth-card {
  max-width: 450px;
  margin: 0 auto;
}

.method-selection {
  padding: 16px 0;
}

.welcome-text {
  text-align: center;
  margin-bottom: 24px;
}

.welcome-text h3 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 20px;
}

.welcome-text p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.method-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: white;
}

.method-card:hover {
  border-color: #2080f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.method-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.method-icon {
  font-size: 24px;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.method-info {
  flex: 1;
}

.method-title {
  font-weight: 600;
  font-size: 16px;
  color: #374151;
  margin-bottom: 4px;
}

.method-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.method-arrow {
  color: #6b7280;
  font-size: 14px;
  flex-shrink: 0;
}

.auth-form {
  padding: 8px 0;
}

.form-header {
  text-align: center;
  margin-bottom: 16px;
}

.form-header h3 {
  margin: 8px 0 8px 0;
  color: var(--text-color);
  font-size: 18px;
}

.form-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.instruction-card {
  background: var(--card-background-secondary);
}

.instruction-title {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.instruction-title i {
  margin-right: 8px;
  color: var(--primary-color);
}

.instruction-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-color);
}

.instruction-list li {
  margin-bottom: 4px;
  line-height: 1.4;
}

.auth-info {
  margin-top: 12px;
}
</style> 