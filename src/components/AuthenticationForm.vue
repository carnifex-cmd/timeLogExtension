<template>
  <div class="auth-container">
    <h3>Authenticate</h3>
    <form @submit.prevent="handleSubmit">
      <input 
        :value="ytUrl"
        @input="$emit('update:ytUrl', $event.target.value)"
        placeholder="YouTrack Base URL" 
        required 
        class="input"
      />
      <input 
        :value="ytToken"
        @input="$emit('update:ytToken', $event.target.value)"
        placeholder="API Token" 
        type="password" 
        required 
        class="input"
      />
      <button type="submit" :disabled="loading" class="btn btn-primary">
        {{ loading ? 'Saving...' : 'Save' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  ytUrl: String,
  ytToken: String,
  loading: Boolean
})

const emit = defineEmits(['save', 'update:ytUrl', 'update:ytToken'])

const handleSubmit = () => {
  emit('save')
}
</script>

<style scoped>
.auth-container {
  text-align: center;
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Use global styles for input and button */
</style> 