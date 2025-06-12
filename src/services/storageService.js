export const storageService = {
  get: (keys) => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (data) => {
        resolve(data)
      })
    })
  },

  set: (data) => {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, () => {
        resolve()
      })
    })
  },

  remove: (keys) => {
    return new Promise((resolve) => {
      chrome.storage.sync.remove(keys, () => {
        resolve()
      })
    })
  }
} 