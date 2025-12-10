<template>
  <div class="server-settings">
    <div class="settings-header">
      <h3>Configuration P2P</h3>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>

    <div class="settings-content">
      <!-- Status du serveur -->
      <div class="status-section">
        <h4>Statut du serveur</h4>
        <div class="status-indicator" :class="{ active: serverStatus.isRunning }">
          <span class="dot"></span>
          {{ serverStatus.isRunning ? 'Serveur actif' : 'Serveur arrêté' }}
        </div>
      </div>

      <!-- Mode Serveur -->
      <div class="mode-section">
        <h4>Mode Serveur</h4>
        <p class="hint">
          Démarrez un serveur pour que d'autres utilisateurs puissent se connecter à vous
        </p>

        <div v-if="!serverStatus.isRunning" class="server-controls">
          <div class="input-group">
            <label>Port</label>
            <input v-model.number="serverPort" type="number" min="1024" max="65535" />
          </div>

          <button @click="startServer" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Démarrage...' : 'Démarrer le serveur' }}
          </button>
        </div>

        <div v-else class="server-info">
          <div class="info-item">
            <strong>URL Locale:</strong>
            <code>{{ serverStatus.url }}</code>
            <button @click="copyToClipboard(serverStatus.url!)" class="btn-copy">Copier</button>
          </div>

          <div class="info-item">
            <strong>Adresse IP:</strong>
            <code>http://{{ serverStatus.ip }}:{{ serverStatus.port }}/gun</code>
            <button
              @click="copyToClipboard(`http://${serverStatus.ip}:${serverStatus.port}/gun`)"
              class="btn-copy"
            >
              Copier
            </button>
          </div>

          <p class="hint">Partagez cette adresse avec d'autres utilisateurs pour qu'ils se connectent</p>

          <button @click="stopServer" class="btn-danger" :disabled="isLoading">
            {{ isLoading ? 'Arrêt...' : 'Arrêter le serveur' }}
          </button>
        </div>
      </div>

      <!-- Mode Client -->
      <div class="mode-section">
        <h4>Mode Client</h4>
        <p class="hint">Connectez-vous au serveur de quelqu'un d'autre</p>

        <div class="input-group">
          <label>Adresse du serveur</label>
          <input
            v-model="peerAddress"
            type="text"
            placeholder="http://192.168.1.100:8765/gun"
          />
        </div>

        <button @click="connectToPeer" class="btn-primary" :disabled="!peerAddress.trim()">
          Se connecter
        </button>

        <div v-if="currentPeer" class="connected-peer">
          <strong>Connecté à:</strong> {{ currentPeer }}
          <button @click="disconnectPeer" class="btn-danger-sm">Déconnecter</button>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="message" class="message" :class="messageType">{{ message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gun } from '../gun'

const emit = defineEmits<{
  close: []
}>()

const serverPort = ref(8765)
const isLoading = ref(false)
const peerAddress = ref('')
const currentPeer = ref<string | null>(null)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const serverStatus = ref({
  isRunning: false,
  port: 8765,
  ip: 'localhost',
  url: null as string | null
})

const loadServerStatus = async () => {
  try {
    const status = await window.p2pChat.gunServer.getStatus()
    serverStatus.value = status
  } catch (error) {
    console.error('Erreur chargement status:', error)
  }
}

const startServer = async () => {
  isLoading.value = true
  message.value = ''

  try {
    const result = await window.p2pChat.gunServer.start(serverPort.value)

    if (result.success) {
      messageType.value = 'success'
      message.value = result.message
      await loadServerStatus()
    } else {
      messageType.value = 'error'
      message.value = result.message
    }
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error.message || 'Erreur inconnue'
  } finally {
    isLoading.value = false
  }
}

const stopServer = async () => {
  isLoading.value = true
  message.value = ''

  try {
    const result = await window.p2pChat.gunServer.stop()

    if (result.success) {
      messageType.value = 'success'
      message.value = result.message
      await loadServerStatus()
    } else {
      messageType.value = 'error'
      message.value = result.message
    }
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error.message || 'Erreur inconnue'
  } finally {
    isLoading.value = false
  }
}

const connectToPeer = () => {
  if (!peerAddress.value.trim()) return

  try {
    // Ajouter le peer à Gun
    gun.opt({ peers: [peerAddress.value.trim()] })
    currentPeer.value = peerAddress.value.trim()
    messageType.value = 'success'
    message.value = `Connecté à ${peerAddress.value}`
    peerAddress.value = ''
  } catch (error: any) {
    messageType.value = 'error'
    message.value = error.message || 'Erreur de connexion'
  }
}

const disconnectPeer = () => {
  currentPeer.value = null
  // Recréer Gun sans peers
  location.reload()
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    messageType.value = 'success'
    message.value = 'Copié dans le presse-papiers !'
    setTimeout(() => {
      message.value = ''
    }, 2000)
  } catch (error) {
    messageType.value = 'error'
    message.value = 'Erreur lors de la copie'
  }
}

onMounted(() => {
  loadServerStatus()
})
</script>

<style scoped>
.server-settings {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: #252525;
  border-left: 1px solid #3d3d3d;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #3d3d3d;
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.close-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.close-btn:hover {
  background: #3d3d3d;
  color: #ffffff;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.status-section,
.mode-section {
  margin-bottom: 32px;
}

h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
}

.hint {
  font-size: 13px;
  color: #a0a0a0;
  margin: 0 0 16px 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 8px;
  font-size: 14px;
  color: #e0e0e0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #707070;
}

.status-indicator.active .dot {
  background: #4caf50;
  box-shadow: 0 0 8px #4caf50;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #e0e0e0;
}

.input-group input {
  width: 100%;
  padding: 10px 12px;
  background: #1e1e1e;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-primary,
.btn-danger,
.btn-danger-sm {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.btn-danger {
  background: #ff4444;
  color: #ffffff;
  margin-top: 12px;
}

.btn-danger-sm {
  width: auto;
  padding: 6px 12px;
  font-size: 12px;
  margin-left: 8px;
}

.btn-primary:hover:not(:disabled),
.btn-danger:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.server-info {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
}

.info-item {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item strong {
  font-size: 13px;
  color: #e0e0e0;
}

.info-item code {
  background: #252525;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #4caf50;
  word-break: break-all;
}

.btn-copy {
  align-self: flex-start;
  padding: 6px 12px;
  background: #3d3d3d;
  border: none;
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-copy:hover {
  background: #4d4d4d;
}

.connected-peer {
  margin-top: 16px;
  padding: 12px;
  background: #1e1e1e;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #e0e0e0;
}

.message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
}

.message.success {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid #4caf50;
}

.message.error {
  background: rgba(255, 68, 68, 0.2);
  color: #ff4444;
  border: 1px solid #ff4444;
}
</style>
