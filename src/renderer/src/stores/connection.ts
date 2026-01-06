import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConnectionStore = defineStore('connection', () => {
  const isConnected = ref(true)
  const isHost = ref(false) // L'utilisateur a démarré le serveur
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  // Définir si l'utilisateur est l'hôte
  function setIsHost(host: boolean) {
    isHost.value = host
  }

  // Définir l'état de connexion
  function setConnected(connected: boolean) {
    isConnected.value = connected
    if (connected) {
      reconnectAttempts.value = 0
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }
  }

  // Tenter une reconnexion
  function attemptReconnect(callback: () => void) {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.log('[Connection] Nombre maximum de tentatives de reconnexion atteint')
      return
    }

    reconnectAttempts.value++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000) // Backoff exponentiel, max 30s

    console.log(
      `[Connection] Tentative de reconnexion ${reconnectAttempts.value}/${maxReconnectAttempts} dans ${delay}ms`
    )

    reconnectTimer = setTimeout(() => {
      callback()
    }, delay)
  }

  // Réinitialiser les tentatives de reconnexion
  function resetReconnectAttempts() {
    reconnectAttempts.value = 0
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  return {
    isConnected,
    isHost,
    reconnectAttempts,
    maxReconnectAttempts,
    setIsHost,
    setConnected,
    attemptReconnect,
    resetReconnectAttempts
  }
})
