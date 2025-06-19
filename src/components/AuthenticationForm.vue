<template>
  <n-card title="🔐 Connect to YouTrack" size="medium" class="auth-card">
    <template #header-extra>
      <n-tag type="info" size="small">
        {{ 
          authType === 'oauth' ? 'OAuth 2.0' : 
          authType === 'youtrack-token' ? 'Auto-Detected' : 
          'API Token' 
        }}
      </n-tag>
    </template>
    
    <!-- Authentication Method Tabs -->
    <n-tabs 
      v-model:value="authType" 
      type="segment" 
      size="medium"
      @update:value="handleAuthTypeChange"
    >
      <n-tab-pane name="token" tab="🔑 API Token">
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
              show-password-on="mousedown"
              placeholder="perm:your-permanent-token"
              clearable
              :disabled="loading"
            />
          </n-form-item>
          
          <n-form-item>
            <n-button
              type="primary"
              size="medium"
              :loading="loading"
              :disabled="!isTokenFormValid"
              attr-type="submit"
              block
              strong
            >
              <template #icon>
                <i class="fas fa-key"></i>
              </template>
              {{ loading ? 'Connecting...' : 'Connect with Token' }}
            </n-button>
          </n-form-item>
        </n-form>
        
        <n-alert type="info" size="small" class="auth-info">
          <template #icon>
            <i class="fas fa-info-circle"></i>
          </template>
          Need a token? Go to YouTrack → Profile → Authentication → New Token
        </n-alert>
      </n-tab-pane>
      
      <n-tab-pane name="youtrack-token" tab="🔍 Auto-Detect">
        <div class="auto-detect-content">
          <n-alert type="info" size="medium" class="auth-info">
            <template #icon>
              <i class="fas fa-magic"></i>
            </template>
            <div>
              <div style="font-weight: 500; margin-bottom: 8px;">Automatic Token Detection</div>
              <div>This will automatically detect and use your authentication from any open YouTrack tab.</div>
            </div>
          </n-alert>

          <n-form @submit.prevent="handleYouTrackTokenSubmit">
            <n-form-item label="Environment" path="environment">
              <n-radio-group v-model:value="selectedEnvironment" size="medium">
                <n-space vertical>
                  <n-radio value="production">
                    <i class="fas fa-globe" style="margin-right: 8px;"></i>
                    Production
                  </n-radio>
                  <n-radio value="staging">
                    <i class="fas fa-flask" style="margin-right: 8px;"></i>
                    Staging
                  </n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>
            
            <n-steps size="small" current="1" status="process" class="detection-steps">
              <n-step title="Select Environment" :description="`Choose ${selectedEnvironment} YouTrack`" />
              <n-step title="Open YouTrack" :description="`Log into ${selectedEnvironment} YouTrack in a browser tab`" />
              <n-step title="Detect & Connect" description="Click the button below to scan for tokens" />
            </n-steps>

            <n-form-item>
              <n-button
                type="primary"
                size="medium"
                :loading="loading"
                attr-type="submit"
                block
                strong
              >
                <template #icon>
                  <i class="fas fa-search"></i>
                </template>
                {{ loading ? `Scanning ${selectedEnvironment} YouTrack...` : `Detect & Connect to ${selectedEnvironment}` }}
              </n-button>
            </n-form-item>
          </n-form>
          
          <n-alert type="warning" size="small" class="auth-info">
            <template #icon>
              <i class="fas fa-exclamation-triangle"></i>
            </template>
            Make sure you're logged into <strong>{{ selectedEnvironment === 'staging' ? 'stg-youtrack.internetbrands.com' : 'youtrack.internetbrands.com' }}</strong> before clicking "Detect & Connect"
          </n-alert>
        </div>
      </n-tab-pane>
      
      <n-tab-pane name="oauth" tab="🌐 OAuth 2.0">
        <n-form 
          ref="oauthFormRef"
          :model="oauthFormData"
          :rules="oauthRules"
          label-placement="top"
          require-mark-placement="right-hanging"
          size="medium"
          @submit.prevent="handleOAuthSubmit"
        >
          <n-form-item label="YouTrack Base URL" path="ytUrl">
            <n-input
              v-model:value="oauthFormData.ytUrl"
              placeholder="https://your-company.youtrack.cloud"
              clearable
              :disabled="loading"
            />
          </n-form-item>
          
          <n-form-item label="OAuth Client ID" path="ytClientId">
            <n-input
              v-model:value="oauthFormData.ytClientId"
              placeholder="your-oauth-client-id"
              clearable
              :disabled="loading"
            />
          </n-form-item>
          
          <n-form-item>
            <n-button
              type="primary"
              size="medium"
              :loading="loading"
              :disabled="!isOAuthFormValid"
              attr-type="submit"
              block
              strong
            >
              <template #icon>
                <i class="fas fa-sign-in-alt"></i>
              </template>
              {{ loading ? 'Redirecting...' : 'Connect with OAuth' }}
            </n-button>
          </n-form-item>
        </n-form>
        
        <n-alert type="info" size="small" class="auth-info">
          <template #icon>
            <i class="fas fa-shield-alt"></i>
          </template>
          OAuth provides secure authentication without sharing permanent tokens
        </n-alert>
      </n-tab-pane>
    </n-tabs>
    
    <template #footer>
      <n-space justify="center">
        <n-tag size="tiny" type="warning">
          <template #icon>
            <i class="fas fa-lock"></i>
          </template>
          Your credentials are stored locally and encrypted
        </n-tag>
      </n-space>
    </template>
  </n-card>
</template>

<script setup>
import { reactive, computed, ref, watch, onMounted, defineProps, defineEmits } from 'vue'

const props = defineProps({
  ytUrl: String,
  ytToken: String,
  ytClientId: String,
  authType: {
    type: String,
    default: 'token'
  },
  ytEnvironment: {
    type: String,
    default: 'production'
  },
  loading: Boolean
})

const emit = defineEmits([
  'save-token', 
  'save-oauth', 
  'save-youtrack-token',
  'update:ytUrl', 
  'update:ytToken', 
  'update:ytClientId',
  'update:authType',
  'update:ytEnvironment'
])

const authType = computed({
  get: () => props.authType,
  set: (value) => emit('update:authType', value)
})

const selectedEnvironment = ref(props.ytEnvironment || 'production')

// Watch for changes and emit to parent
watch(selectedEnvironment, (newValue) => {
  console.log('Environment changed to:', newValue)
  emit('update:ytEnvironment', newValue)
})

// Watch props and update local ref
watch(() => props.ytEnvironment, (newValue) => {
  if (newValue && newValue !== selectedEnvironment.value) {
    selectedEnvironment.value = newValue
  }
})

const tokenFormData = reactive({
  ytUrl: props.ytUrl || '',
  ytToken: props.ytToken || ''
})

const oauthFormData = reactive({
  ytUrl: props.ytUrl || '',
  ytClientId: props.ytClientId || ''
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

const oauthRules = {
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
  ytClientId: [
    {
      required: true,
      message: 'Please enter your OAuth Client ID',
      trigger: ['input', 'blur']
    },
    {
      min: 5,
      message: 'Client ID seems too short',
      trigger: ['input', 'blur']
    }
  ]
}

const isTokenFormValid = computed(() => 
  tokenFormData.ytUrl.trim() && tokenFormData.ytToken.trim()
)

const isOAuthFormValid = computed(() => 
  oauthFormData.ytUrl.trim() && oauthFormData.ytClientId.trim()
)

// Watch for changes and emit updates
watch(() => tokenFormData.ytUrl, (newValue) => {
  oauthFormData.ytUrl = newValue // Keep URLs in sync
  emit('update:ytUrl', newValue)
})

watch(() => oauthFormData.ytUrl, (newValue) => {
  tokenFormData.ytUrl = newValue // Keep URLs in sync
  emit('update:ytUrl', newValue)
})

watch(() => tokenFormData.ytToken, (newValue) => {
  emit('update:ytToken', newValue)
})

watch(() => oauthFormData.ytClientId, (newValue) => {
  emit('update:ytClientId', newValue)
})

// Update form data when props change
watch(() => props.ytUrl, (newValue) => {
  tokenFormData.ytUrl = newValue || ''
  oauthFormData.ytUrl = newValue || ''
})

watch(() => props.ytToken, (newValue) => {
  tokenFormData.ytToken = newValue || ''
})

watch(() => props.ytClientId, (newValue) => {
  oauthFormData.ytClientId = newValue || ''
})



const handleAuthTypeChange = (newType) => {
  emit('update:authType', newType)
}

const handleTokenSubmit = () => {
  emit('save-token')
}

const handleOAuthSubmit = () => {
  emit('save-oauth')
}

const handleYouTrackTokenSubmit = () => {
  emit('save-youtrack-token')
}

// Ensure environment has a default value on mount
onMounted(() => {
  if (!props.ytEnvironment) {
    selectedEnvironment.value = 'production'
    emit('update:ytEnvironment', 'production')
  }
})
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

.auth-info {
  margin-top: 16px;
}

.auth-card :deep(.n-tabs-nav) {
  margin-bottom: 20px;
}

.auth-card :deep(.n-tab-pane) {
  padding-top: 8px;
}

.auto-detect-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detection-steps {
  margin: 16px 0;
}

.detection-steps :deep(.n-step-header) {
  font-size: 12px;
}

.detection-steps :deep(.n-step-description) {
  font-size: 11px;
  color: var(--text-color-2);
}

/* Radio button styling */
.auto-detect-content :deep(.n-radio-group) {
  margin: 8px 0;
}

.auto-detect-content :deep(.n-radio) {
  margin: 4px 0;
}
</style> 