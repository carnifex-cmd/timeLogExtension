<template>
  <div class="container">
    <div v-if="!isAuthenticated">
      <h3>Authenticate</h3>
      <input v-model="ytUrl" placeholder="YouTrack Base URL" /><br>
      <input v-model="ytToken" placeholder="API Token" type="password" /><br>
      <button @click="saveAuth">Save</button>
    </div>
    <div v-else>
      <h3>Your Tickets</h3>
      <div v-if="loading">Loading...</div>
      <div v-else>
        <div v-for="ticket in tickets" :key="ticket.idReadable" class="ticket">
          <div class="ticket-info">
            <input type="checkbox" v-model="selectedTickets[ticket.idReadable]" />
            <span class="ticket-id"><b>{{ ticket.idReadable }}</b></span>
            <span class="ticket-summary">{{ ticket.summary }}</span>
          </div>
          <div class="ticket-actions">
            <button class="action-btn" @click="openModal(ticket.idReadable)">Add Time</button>
            <span v-if="logs[ticket.idReadable]" class="ticket-log">
              [{{ logs[ticket.idReadable].time }} on {{ logs[ticket.idReadable].date }}]
            </span>
          </div>
        </div>
        <button class="submit-btn" @click="submitLogs">Submit Selected Logs</button>
      </div>
    </div>
    <transition name="fade">
      <div v-if="modal.show" class="modal-bg">
        <div class="modal">
          <h4>Add Time to {{ modal.ticketId }}</h4>
          <input v-model="modal.time" placeholder="Time (e.g. 1h 30m)" /><br>
          <input v-model="modal.date" type="date" /><br>
          <input v-model="modal.comment" placeholder="Comment" /><br>
          <div class="modal-buttons">
            <button @click="saveModal">Save</button>
            <button class="cancel-btn" @click="closeModal">Cancel</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const ytUrl = ref('')
const ytToken = ref('')
const isAuthenticated = ref(false)
const tickets = ref([])
const selectedTickets = reactive({})
const logs = reactive({})
const loading = ref(false)
const modal = reactive({
  show: false,
  ticketId: '',
  time: '',
  date: '',
  comment: ''
})

// Load auth from chrome.storage
chrome.storage.sync.get(['ytUrl', 'ytToken'], (data) => {
  if (data.ytUrl && data.ytToken) {
    ytUrl.value = data.ytUrl
    ytToken.value = data.ytToken
    isAuthenticated.value = true
    fetchTickets()
  }
})

function saveAuth() {
  if (ytUrl.value && ytToken.value) {
    chrome.storage.sync.set({ ytUrl: ytUrl.value, ytToken: ytToken.value }, () => {
      isAuthenticated.value = true
      fetchTickets()
    })
  }
}

function fetchTickets() {
  loading.value = true
  fetch(`${ytUrl.value}/api/issues?query=Type:%20Sub-Task%20State:%20Open%20for:%20me&fields=idReadable,summary`, {
    headers: {
      'Authorization': `Bearer ${ytToken.value}`,
      'Accept': 'application/json'
    }
  })
    .then(res => {
      if (!res.ok) throw new Error('Auth error or bad URL')
      return res.json()
    })
    .then(data => {
      tickets.value = data
    })
    .catch(() => {
      alert('Could not load tickets. Check your credentials.')
      isAuthenticated.value = false
    })
    .finally(() => loading.value = false)
}

function openModal(ticketId) {
  modal.ticketId = ticketId
  modal.time = logs[ticketId]?.time || ''
  modal.date = logs[ticketId]?.date || ''
  modal.comment = logs[ticketId]?.comment || ''
  modal.show = true
}
function saveModal() {
  logs[modal.ticketId] = {
    time: modal.time,
    date: modal.date,
    comment: modal.comment
  }
  modal.show = false
}
function closeModal() { modal.show = false }

async function submitLogs() {
  const selectedIds = Object.keys(selectedTickets).filter(id => selectedTickets[id])
  if (!selectedIds.length) return alert('Select at least one ticket.')
  loading.value = true
  for (const ticketId of selectedIds) {
    const log = logs[ticketId]
    if (!log) continue
    await fetch(`${ytUrl.value}/api/issues/${ticketId}/timeTracking/workItems`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ytToken.value}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration: { presentation: log.time },
        date: log.date,
        text: log.comment
      })
    })
  }
  loading.value = false
  alert('Logs submitted!')
}
</script>

<style>

:root {
  --primary-color: #4F46E5; 
  --primary-color-hover: #4338CA;
  --secondary-color: #10B981;
  --background-color: #F9FAFB; 
  --text-color: #374151; 
  --modal-bg-color: rgba(0, 0, 0, 0.5);
  --white: #ffffff;
}

body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  margin: 0;
  padding: 20px;
  width: 500px;
  box-sizing: border-box;
}

.container {
  background: var(--white);
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.1);
}

h3, h4 {
  text-align: center;
  margin-bottom: 16px;
}

input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 100%;
  margin-bottom: 12px;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

button {
  padding: 10px 16px;
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  transition: background-color 0.3s ease, transform 0.1s ease;
}

.ticket {
  padding: 12px;
  background-color: var(--background-color);
  border-radius: 8px;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
}

.modal-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--modal-bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background-color: var(--white);
  padding: 24px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>