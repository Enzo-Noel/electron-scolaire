<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">P2P Chat Décentralisé</h1>
      <p class="login-subtitle">Propulsé par Gun.js</p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <!-- Nom d'utilisateur -->
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Entrez votre pseudo..."
            autocomplete="off"
            required
            :disabled="isLoading"
            @input="error = ''"
          />
        </div>

        <!-- Mode de connexion -->
        <div class="form-group">
          <label>Mode de connexion</label>
          <div class="connection-modes">
            <div
              class="mode-option"
              :class="{ active: connectionMode === 'server' }"
              @click="selectMode('server')"
            >
              <div class="mode-icon">🖥️</div>
              <div class="mode-title">Serveur</div>
              <div class="mode-description">Créer un serveur local</div>
            </div>

            <div
              class="mode-option"
              :class="{ active: connectionMode === 'client' }"
              @click="selectMode('client')"
            >
              <div class="mode-icon">🔗</div>
              <div class="mode-title">Client</div>
              <div class="mode-description">Rejoindre un serveur</div>
            </div>
          </div>
        </div>

        <!-- Configuration serveur -->
        <div v-if="connectionMode === 'server'" class="form-group">
          <label for="serverPort">Port du serveur</label>
          <input
            id="serverPort"
            v-model.number="serverPort"
            type="number"
            min="1024"
            max="65535"
            placeholder="8765"
            :disabled="isLoading"
          />
        </div>

        <!-- Configuration client -->
        <div v-if="connectionMode === 'client'" class="form-group">
          <label for="peerAddress">Adresse du serveur</label>
          <div class="ip-input-wrapper">
            <input
              id="peerAddress"
              v-model="peerAddress"
              type="text"
              placeholder="http://192.168.1.100:8765/gun"
              :disabled="isLoading"
              @focus="handleFocus"
              @blur="handleBlur"
            />
            <button
              ref="historyToggleRef"
              type="button"
              class="history-toggle"
              @click="showConnectionPanel = !showConnectionPanel"
              title="Historique et contacts"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
          </div>

          <!-- Panel Historique / Contacts -->
          <div v-if="showConnectionPanel" ref="connectionPanelRef" class="connection-panel">
            <div class="panel-tabs">
              <button
                type="button"
                class="tab-btn"
                :class="{ active: activeTab === 'history' }"
                @click="activeTab = 'history'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Historique
              </button>
              <button
                type="button"
                class="tab-btn"
                :class="{ active: activeTab === 'contacts' }"
                @click="activeTab = 'contacts'"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Contacts
              </button>
            </div>

            <div class="panel-content">
              <!-- Onglet Historique -->
              <div v-if="activeTab === 'history'" class="history-tab">
                <div v-if="ipHistory.length === 0" class="empty-tab">
                  <p>Aucun historique</p>
                </div>
                <div v-else class="history-list">
                  <div
                    v-for="(ip, index) in ipHistory"
                    :key="index"
                    class="history-item"
                    @click="selectIpFromHistory(ip)"
                  >
                    <span class="history-ip">{{ ip }}</span>
                    <button
                      type="button"
                      class="remove-btn"
                      @click="removeFromHistory(ip, $event)"
                      title="Supprimer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Onglet Contacts -->
              <div v-if="activeTab === 'contacts'" class="contacts-tab">
                <ContactList @select-contact="handleSelectContact" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

        <button type="submit" class="login-button" :disabled="isLoading || !canSubmit">
          <span v-if="isLoading">{{ loadingMessage }}</span>
          <span v-else>Se connecter</span>
        </button>
      </form>

      <div class="login-info">
        <p>Aucune inscription requise</p>
        <p>Vos messages sont décentralisés et synchronisés en temps réel</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { gun } from '../gun'
import { useConnectionStore } from '../stores/connection'
import { useContactsStore, type Contact } from '../stores/contacts'
import ContactList from './ContactList.vue'

const emit = defineEmits<{
  login: [username: string]
}>()

const connectionStore = useConnectionStore()
const contactsStore = useContactsStore()

type ConnectionMode = 'server' | 'client'

// LocalStorage keys
const STORAGE_KEYS = {
  USERNAME: 'p2p-chat-username',
  IP_HISTORY: 'p2p-chat-ip-history',
  LAST_MODE: 'p2p-chat-last-mode'
}

const username = ref('')
const connectionMode = ref<ConnectionMode>('server')
const serverPort = ref(8765)
const peerAddress = ref('')
const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')
const loadingMessage = ref('Connexion...')
const ipHistory = ref<string[]>([])
const showConnectionPanel = ref(false)
const activeTab = ref<'history' | 'contacts'>('history')
const connectionPanelRef = ref<HTMLElement | null>(null)
const historyToggleRef = ref<HTMLElement | null>(null)

const canSubmit = computed(() => {
  if (!username.value.trim()) return false

  if (connectionMode.value === 'client' && !peerAddress.value.trim()) {
    return false
  }

  return true
})

const selectMode = (mode: ConnectionMode) => {
  connectionMode.value = mode
  error.value = ''
  successMessage.value = ''
}

// Charger les données du localStorage
const loadSavedData = () => {
  // Charger le pseudo
  const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME)
  if (savedUsername) {
    username.value = savedUsername
  }

  // Charger l'historique des IP
  const savedHistory = localStorage.getItem(STORAGE_KEYS.IP_HISTORY)
  if (savedHistory) {
    try {
      ipHistory.value = JSON.parse(savedHistory)
      // Pré-remplir avec la dernière IP utilisée
      if (ipHistory.value.length > 0) {
        peerAddress.value = ipHistory.value[0]
      }
    } catch (e) {
      console.error('Erreur lors du chargement de l\'historique:', e)
    }
  }

  // Charger le dernier mode utilisé
  const savedMode = localStorage.getItem(STORAGE_KEYS.LAST_MODE)
  if (savedMode === 'server' || savedMode === 'client') {
    connectionMode.value = savedMode
  }
}

// Sauvegarder les données dans le localStorage
const saveData = () => {
  // Sauvegarder le pseudo
  localStorage.setItem(STORAGE_KEYS.USERNAME, username.value.trim())

  // Sauvegarder le mode
  localStorage.setItem(STORAGE_KEYS.LAST_MODE, connectionMode.value)

  // Sauvegarder l'IP dans l'historique si en mode client
  if (connectionMode.value === 'client' && peerAddress.value.trim()) {
    const address = peerAddress.value.trim()

    // Retirer l'adresse si elle existe déjà
    const filteredHistory = ipHistory.value.filter(ip => ip !== address)

    // Ajouter l'adresse en première position
    const newHistory = [address, ...filteredHistory].slice(0, 5) // Garder max 5 entrées

    ipHistory.value = newHistory
    localStorage.setItem(STORAGE_KEYS.IP_HISTORY, JSON.stringify(newHistory))
  }
}

// Sélectionner une IP de l'historique
const selectIpFromHistory = (ip: string) => {
  peerAddress.value = ip
  showConnectionPanel.value = false
}

// Supprimer une IP de l'historique
const removeFromHistory = (ip: string, event: Event) => {
  event.stopPropagation()
  ipHistory.value = ipHistory.value.filter(addr => addr !== ip)
  localStorage.setItem(STORAGE_KEYS.IP_HISTORY, JSON.stringify(ipHistory.value))
}

// Sélectionner un contact
const handleSelectContact = (contact: Contact) => {
  peerAddress.value = contact.address
  showConnectionPanel.value = false
  contactsStore.markAsUsed(contact.id)
}

// Gérer le clic en dehors du panneau pour le fermer
const handleClickOutside = (event: MouseEvent) => {
  if (!showConnectionPanel.value) return

  const target = event.target as Node
  const panel = connectionPanelRef.value
  const toggle = historyToggleRef.value

  // Fermer si on clique en dehors du panneau ET en dehors du bouton toggle
  if (panel && !panel.contains(target) && toggle && !toggle.contains(target)) {
    showConnectionPanel.value = false
  }
}

// Gérer le focus sur le champ IP
const handleFocus = () => {
  // Le panneau s'ouvre maintenant via le bouton
}

// Gérer le blur sur le champ IP
const handleBlur = () => {
  // Le panneau se ferme maintenant via le bouton ou la sélection
}

// Ajouter l'écouteur au montage
onMounted(() => {
  loadSavedData()
  document.addEventListener('click', handleClickOutside)
})

// Retirer l'écouteur au démontage
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleSubmit = async () => {
  // Validation du nom d'utilisateur
  if (!username.value.trim()) {
    error.value = "Veuillez entrer un nom d'utilisateur"
    return
  }

  if (username.value.trim().length < 2) {
    error.value = 'Le nom doit contenir au moins 2 caractères'
    return
  }

  if (username.value.trim().length > 20) {
    error.value = 'Le nom ne peut pas dépasser 20 caractères'
    return
  }

  isLoading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    // Mode serveur - démarrer le serveur Gun
    if (connectionMode.value === 'server') {
      loadingMessage.value = 'Démarrage du serveur...'
      const result = await window.p2pChat.gunServer.start(serverPort.value)

      if (!result.success) {
        error.value = result.message
        isLoading.value = false
        return
      }

      // Marquer l'utilisateur comme hôte
      connectionStore.setIsHost(true)

      // Connecter Gun au serveur local
      gun.opt({ peers: [`http://localhost:${serverPort.value}/gun`] })
      successMessage.value = `Serveur démarré sur le port ${serverPort.value}`
    }

    // Mode client - se connecter au peer
    if (connectionMode.value === 'client') {
      loadingMessage.value = 'Connexion au serveur...'

      if (!peerAddress.value.trim()) {
        error.value = 'Veuillez entrer une adresse de serveur'
        isLoading.value = false
        return
      }

      const serverAddress = peerAddress.value.trim()

      // Vérifier que le serveur est accessible avant de continuer
      try {
        loadingMessage.value = 'Vérification du serveur...'

        // Tester la connexion avec un timeout de 5 secondes
        const testConnection = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Le serveur ne répond pas (timeout)'))
          }, 5000)

          // Créer une instance temporaire de Gun pour tester
          const testGun = Gun({ peers: [serverAddress], retry: 1000 })

          let connected = false

          // Écouter l'événement de connexion
          testGun.on('hi', () => {
            if (!connected) {
              connected = true
              clearTimeout(timeout)
              resolve(true)
            }
          })

          // Essayer de lire quelque chose pour forcer la connexion
          testGun.get('connection-test').once(() => {
            // Ceci ne garantit pas la connexion, mais aide à déclencher 'hi'
          })
        })

        await testConnection
        console.log('[Connection] Serveur accessible, connexion en cours...')

      } catch (testError: any) {
        error.value = 'Impossible de se connecter au serveur. Vérifiez l\'adresse et assurez-vous que le serveur est démarré.'
        isLoading.value = false
        console.error('[Connection] Échec de vérification:', testError)
        return
      }

      // Marquer l'utilisateur comme client (pas hôte)
      connectionStore.setIsHost(false)

      // Connecter Gun au peer distant avec configuration pour réduire le spam
      gun.opt({
        peers: [serverAddress],
        retry: 5000, // Attendre 5 secondes entre chaque tentative de reconnexion
        RTRtimeout: 30000 // Timeout de 30 secondes
      })
      successMessage.value = 'Connecté au serveur'
    }

    // Sauvegarder les données avant de se connecter
    saveData()

    // Petite pause pour montrer le message de succès
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Émettre l'événement de connexion
    emit('login', username.value.trim())
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de la connexion. Veuillez réessayer.'
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: #2d2d2d;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 420px;
  width: 90%;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-align: center;
  color: #ffffff;
}

.login-subtitle {
  font-size: 14px;
  color: #a0a0a0;
  text-align: center;
  margin: 0 0 32px 0;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.connection-modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.mode-option {
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  border-radius: 8px;
  padding: 16px 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.mode-option:hover {
  border-color: #667eea;
  background: #252525;
}

.mode-option.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
}

.mode-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
  margin-bottom: 4px;
}

.mode-description {
  font-size: 11px;
  color: #a0a0a0;
}

.error-message {
  background: rgba(255, 68, 68, 0.2);
  color: #ff4444;
  border: 1px solid #ff4444;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}

.success-message {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid #4caf50;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-info {
  text-align: center;
  color: #a0a0a0;
  font-size: 13px;
}

.login-info p {
  margin: 8px 0;
}

/* Historique des IP */
.ip-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ip-input-wrapper input {
  flex: 1;
}

.history-toggle {
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  border-radius: 6px;
  color: #a0a0a0;
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.history-toggle:hover {
  border-color: #667eea;
  color: #667eea;
  background: #252525;
}

/* Connection Panel - Tabbed Interface */
.connection-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  animation: slideDown 0.2s ease-out;
  overflow: hidden;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-tabs {
  display: flex;
  border-bottom: 2px solid #3d3d3d;
  background: #252525;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: #a0a0a0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  color: #e0e0e0;
  background: #2a2a2a;
}

.tab-btn.active {
  color: #667eea;
  background: #1e1e1e;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.panel-content {
  max-height: 300px;
  overflow-y: auto;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 3px;
}

/* History Tab */
.history-tab {
  padding: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 8px;
}

.history-item:hover {
  background: #2a2a2a;
  border-color: #4a4a4a;
}

.history-ip {
  flex: 1;
  font-size: 13px;
  color: #e0e0e0;
  font-family: 'Courier New', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #ff4444;
  color: #ffffff;
}

/* Contacts Tab */
.contacts-tab {
  height: 100%;
}

/* Empty State */
.empty-tab {
  padding: 32px 16px;
  text-align: center;
  color: #a0a0a0;
  font-size: 13px;
}
</style>
