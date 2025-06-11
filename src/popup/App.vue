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
      <input v-model="searchQuery" placeholder="Search tickets..." class="search-input" />
      <div v-if="loading">Loading...</div>
      <div v-else>
        <div v-for="(ticket) in filteredTickets.slice(0, ticketsToShow)" :key="ticket.idReadable" class="ticket">
          <div class="ticket-info">
            <input type="checkbox" v-model="selectedTickets[ticket.idReadable]" />
            <span class="ticket-id" :title="ticket.idReadable"><b>{{ ticket.idReadable }}</b></span>
            <span class="ticket-summary" :title="ticket.summary">{{ ticket.summary }}</span>
          </div>
          <div class="ticket-actions">
            <button class="action-btn" @click="openModal(ticket.idReadable)">
              <i class="fas fa-clock"></i> 
            </button>
            <span v-if="logs[ticket.idReadable]" class="ticket-log">
              [{{ logs[ticket.idReadable].time }} on {{ logs[ticket.idReadable].date }}]
            </span>
          </div>
        </div>
        <button v-if="filteredTickets.length > ticketsToShow" @click="showMoreTickets" class="show-more-btn">
          <span class="arrow"></span>
        </button>
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
import { ref, reactive,computed } from 'vue'

const ytUrl = ref('')
const ytToken = ref('')
const isAuthenticated = ref(false)
const tickets = ref([])
const selectedTickets = reactive({})
const logs = reactive({})
const loading = ref(false)
const searchQuery = ref('') 
const modal = reactive({
  show: false,
  ticketId: '',
  time: '',
  date: '',
  comment: ''
})

const ticketsToShow = ref(5)

const filteredTickets = computed(() => {
  if (!searchQuery.value) return tickets.value
  return tickets.value.filter(ticket => 
    ticket.idReadable.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    ticket.summary.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
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

   if (!modal.time || !modal.date) {
    alert('Please fill out both the time and date fields.');
    return;
  }
  
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
  try {
    for (const ticketId of selectedIds) {
      const log = logs[ticketId]
      if (!log) continue
      
      const logDate = new Date(log.date).getTime(); 

      const response = await fetch(`${ytUrl.value}/api/issues/${ticketId}/timeTracking/workItems`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ytToken.value}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duration: { presentation: log.time },
          date: logDate,
          text: log.comment
        })
      })

      if (!response.ok) {
        const errorData = await response.json(); 
        throw new Error(`Failed to submit log for ticket ${ticketId}: ${JSON.stringify(errorData)}`);
      }
    }
    alert('Logs submitted successfully!')
  } catch (error) {
    console.error('Error submitting logs:', error)
    alert('An error occurred while submitting logs. Please try again.',error)
  } finally {
    loading.value = false
  }
}

function showMoreTickets() {
  ticketsToShow.value += 5
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
  flex: 1; /* Take up remaining space */
}

.ticket-id, .ticket-summary {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticket-actions {
  display: flex;
  align-items: center;
  gap: 10px; /* Space between button and log */
  flex-shrink: 0; /* Prevent shrinking */
}

.action-btn {
  width: 40px; /* Fixed width for stability */
  margin-left:5px;
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
}

input[type="checkbox"] {
  appearance: none;
  margin-bottom: 5px;
  width: 20px;
  height: 20px;
  border: 1px solid var(--primary-color);
  border-radius: 50%;
  outline: none;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
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

.show-more-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: -20px auto 10px auto; /* Negative top margin for overlap */
  transition: background-color 0.3s ease, transform 0.2s ease;
  padding: 0;
  position: relative; /* Ensure it can overlap */
  z-index: 1; /* Make sure it appears over the tickets */
}

.show-more-btn:hover {
  background-color: var(--primary-color-hover);
  transform: scale(1.1);
}

.arrow {
  display: block;
  width: 12px;
  height: 12px;
  border-width: 3px;
  border-style: solid;
  border-color: transparent transparent white white;
  transform: rotate(-45deg) translate(3px ,-3px);
}

.cancel-btn{
  margin-top:5px;
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