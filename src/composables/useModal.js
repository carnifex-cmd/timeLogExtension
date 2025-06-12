import { reactive } from 'vue'

export function useModal() {
  const modal = reactive({
    show: false,
    ticketId: '',
    time: '',
    date: '',
    comment: ''
  })

  const openModal = (ticketId, existingLog = null) => {
    modal.ticketId = ticketId
    modal.time = existingLog?.time || ''
    modal.date = existingLog?.date || ''
    modal.comment = existingLog?.comment || ''
    modal.show = true
  }

  const closeModal = () => {
    modal.show = false
    modal.ticketId = ''
    modal.time = ''
    modal.date = ''
    modal.comment = ''
  }

  const validateModal = () => {
    if (!modal.time || !modal.date) {
      throw new Error('Please fill out both the time and date fields.')
    }
  }

  const getModalData = () => ({
    time: modal.time,
    date: modal.date,
    comment: modal.comment
  })

  return {
    modal,
    openModal,
    closeModal,
    validateModal,
    getModalData
  }
} 