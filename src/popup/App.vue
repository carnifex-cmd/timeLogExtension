<template>
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
          <input type="checkbox" v-model="selectedTickets[ticket.idReadable]" />
          <b>{{ticket.idReadable}}</b>: {{ticket.summary}}
          <button @click="openModal(ticket.idReadable)">Add Time</button>
          <span v-if="logs[ticket.idReadable]">
            [{{logs[ticket.idReadable].time}} on {{logs[ticket.idReadable].date}}]
          </span>
        </div>
        <button @click="submitLogs">Submit Selected Logs</button>
      </div>
    </div>
    <div v-if="modal.show" class="modal-bg">
      <div class="modal">
        <h4>Add Time to {{modal.ticketId}}</h4>
        <input v-model="modal.time" placeholder="Time (e.g. 1h 30m)" /><br>
        <input v-model="modal.date" type="date" /><br>
        <input v-model="modal.comment" placeholder="Comment" /><br>
        <button @click="saveModal">Save</button>
        <button @click="closeModal">Cancel</button>
      </div>
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
  body { font-family: Arial, sans-serif; width: 350px; margin: 0; padding: 10px; }
  .ticket { margin-bottom: 8px; }
  .modal-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; }
  .modal { background: #fff; padding: 18px; border-radius: 8px; min-width: 250px; }
  .modal input { width: 95%; margin-bottom: 8px; }
  </style>
  