<template>
  <transition name="fade">
    <div v-if="show" class="modal-bg" @click.self="$emit('close')">
      <div class="modal">
        <h4>Add Time to {{ ticketId }}</h4>
        <form @submit.prevent="handleSave">
          <input 
            v-model="time" 
            placeholder="Time (e.g. 1h 30m)" 
            required 
          />
          <input 
            v-model="date" 
            type="date" 
            required 
          />
          <textarea 
            v-model="comment" 
            placeholder="Comment (optional)"
            rows="3"
          ></textarea>
          <div class="modal-buttons">
            <button type="submit" class="save-btn">Save</button>
            <button type="button" class="cancel-btn" @click="$emit('close')">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  show: Boolean,
  ticketId: String,
  time: String,
  date: String,
  comment: String
})

const emit = defineEmits(['close', 'save', 'update:time', 'update:date', 'update:comment'])

const time = computed({
  get: () => props.time,
  set: (value) => emit('update:time', value)
})

const date = computed({
  get: () => props.date,
  set: (value) => emit('update:date', value)
})

const comment = computed({
  get: () => props.comment,
  set: (value) => emit('update:comment', value)
})

const handleSave = () => {
  if (!time.value || !date.value) {
    alert('Please fill out both the time and date fields.')
    return
  }
  emit('save')
}
</script>

<style scoped>
.fade-enter-active, 
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, 
.fade-leave-to {
  opacity: 0;
}

.modal-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--white);
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin: 20px;
}

.modal h4 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--text-color);
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input, 
textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  font-family: inherit;
  resize: vertical;
}

input:focus, 
textarea:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 24, 146, 0.1);
}

.modal-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.save-btn {
  flex: 1;
  padding: 10px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease, transform 0.1s ease;
}

.save-btn:hover {
  background-color: var(--primary-color-hover);
  transform: translateY(-1px);
}

.cancel-btn {
  flex: 1;
  padding: 10px 16px;
  background-color: #6B7280;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease, transform 0.1s ease;
}

.cancel-btn:hover {
  background-color: #4B5563;
  transform: translateY(-1px);
}
</style> 