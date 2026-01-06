<template>
  <div class="chat-room">
    <!-- Notification de déconnexion (jamais affichée pour l'hôte) -->
    <div v-if="false" class="disconnection-banner">
      <div class="banner-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div class="banner-text">
          <strong>Serveur déconnecté</strong>
          <p>L'hôte a arrêté le serveur. Vous ne pouvez plus envoyer ni recevoir de messages.</p>
        </div>
      </div>
    </div>

    <div class="chat-container">
      <div class="sidebar">
      <div class="sidebar-header">
        <h2>P2P Chat</h2>
        <div class="user-info">
          <span class="username">{{ userStore.currentUser }}</span>
          <button @click="handleLogout" class="logout-btn" title="Déconnexion">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9"
              />
            </svg>
          </button>
        </div>
      </div>

      <UserList />
    </div>

    <div class="main-content">
      <div class="chat-header">
        <div class="header-left">
          <h3>Chat P2P Décentralisé</h3>
          <span v-if="connectionStore.isHost" class="host-badge">Hôte</span>
        </div>
        <div class="room-info">
          <div class="connection-status" :class="{ disconnected: !connectionStore.isConnected }">
            <span class="status-indicator"></span>
            <span class="status-text">{{ connectionStore.isConnected ? 'Connecté' : 'Déconnecté' }}</span>
          </div>
          <span class="online-count">{{ userStore.onlineCount }} en ligne</span>
        </div>
      </div>

      <MessageList />
      <MessageInput />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useChatStore } from '../stores/chat'
import { useConnectionStore } from '../stores/connection'
import { gun } from '../gun'
import UserList from './UserList.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'

const userStore = useUserStore()
const chatStore = useChatStore()
const connectionStore = useConnectionStore()

let unsubscribeMessages: (() => void) | null = null
let unsubscribeTyping: (() => void) | null = null

const handleLogout = async () => {
  console.log('[Logout] Début de la déconnexion, isHost:', connectionStore.isHost)

  // Si l'utilisateur est l'hôte, envoyer un signal de déconnexion intentionnelle
  if (connectionStore.isHost) {
    try {
      // Envoyer le signal de fermeture aux clients
      gun.get('server/status').put({
        status: 'shutting-down',
        timestamp: Date.now()
      })
      console.log('[Server] Signal de fermeture envoyé aux clients')

      // Attendre un peu que le signal soit envoyé
      await new Promise(resolve => setTimeout(resolve, 500))

      // Arrêter le serveur
      await window.p2pChat.gunServer.stop()
      console.log('[Server] Serveur arrêté par l\'hôte')
    } catch (error) {
      console.error('[Server] Erreur lors de l\'arrêt du serveur:', error)
    }
  }

  console.log('[Logout] Appel de userStore.logout()')
  await userStore.logout()

  // Réinitialiser le statut de connexion
  connectionStore.setIsHost(false)
  connectionStore.setConnected(false)
  connectionStore.resetReconnectAttempts()

  console.log('[Logout] Déconnexion terminée, isLoggedIn:', userStore.isLoggedIn)
}

onMounted(() => {
  // S'abonner aux messages
  unsubscribeMessages = chatStore.subscribeToMessages()

  // S'abonner aux indicateurs de frappe
  unsubscribeTyping = chatStore.subscribeToTyping()

  // Pour les clients (non-hôtes), surveiller l'état de connexion
  if (!connectionStore.isHost) {
    // Surveiller les événements de connexion Gun
    let lastHeartbeat = Date.now()
    let connectionCheckInterval: ReturnType<typeof setInterval> | null = null
    let lastLoggedState: boolean | null = null // Pour éviter le spam de logs

    // Écouter le signal de fermeture intentionnelle du serveur
    gun.get('server/status').on((data: any) => {
      if (data && data.status === 'shutting-down') {
        console.log('[Connection] Le serveur se ferme proprement')
        if (lastLoggedState !== false) {
          console.log('[Connection] Déconnecté du serveur')
          lastLoggedState = false
        }
        connectionStore.setConnected(false)
      }
    })

    gun.on('hi', (peer: any) => {
      // Logger seulement si l'état change
      if (lastLoggedState !== true) {
        console.log('[Connection] Connecté au serveur')
        lastLoggedState = true
      }
      connectionStore.setConnected(true)
      lastHeartbeat = Date.now()
    })

    gun.on('bye', (peer: any) => {
      // Logger seulement si l'état change
      if (lastLoggedState !== false) {
        console.log('[Connection] Déconnecté du serveur')
        lastLoggedState = false
      }
      connectionStore.setConnected(false)
    })

    // Écouter tous les événements pour mettre à jour le heartbeat
    // IMPORTANT: 'in' peut se déclencher avec du cache, donc on ne change PAS l'état ici
    // On laisse le heartbeat checker décider si on est vraiment connecté
    gun.on('in', () => {
      // Mettre à jour le heartbeat uniquement si on est déjà connecté
      // Cela évite les faux positifs de reconnexion avec des données en cache
      if (connectionStore.isConnected) {
        lastHeartbeat = Date.now()
      }
    })

    // Vérifier le heartbeat toutes les 3 secondes
    connectionCheckInterval = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeat
      const isCurrentlyConnected = timeSinceLastHeartbeat < 8000 // 8 secondes de timeout

      if (isCurrentlyConnected !== connectionStore.isConnected) {
        // Logger seulement quand l'état change
        if (lastLoggedState !== isCurrentlyConnected) {
          console.log(`[Connection] ${isCurrentlyConnected ? 'Connecté' : 'Déconnecté'}`)
          lastLoggedState = isCurrentlyConnected
        }
        connectionStore.setConnected(isCurrentlyConnected)
      }
    }, 3000)

    // Nettoyer l'intervalle au démontage
    onUnmounted(() => {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }
    })
  }
})

onUnmounted(() => {
  if (unsubscribeMessages) unsubscribeMessages()
  if (unsubscribeTyping) unsubscribeTyping()
})
</script>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.disconnection-banner {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  padding: 16px 24px;
  border-bottom: 1px solid #ff4444;
  z-index: 100;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.banner-content svg {
  flex-shrink: 0;
  color: #ffffff;
}

.banner-text {
  color: #ffffff;
}

.banner-text strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.banner-text p {
  margin: 0;
  font-size: 13px;
  opacity: 0.95;
}

.chat-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #252525;
  border-right: 1px solid #3d3d3d;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #3d3d3d;
}

.sidebar-header h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #1e1e1e;
  border-radius: 8px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
}

.logout-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}

.logout-btn:hover {
  background: #3d3d3d;
  color: #ffffff;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 16px 24px;
  background: #252525;
  border-bottom: 1px solid #3d3d3d;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.host-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
  color: #a0a0a0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(76, 175, 80, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.connection-status.disconnected {
  background: rgba(255, 68, 68, 0.15);
  border-color: rgba(255, 68, 68, 0.3);
}

.status-indicator {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

.connection-status.disconnected .status-indicator {
  background: #ff4444;
  animation: blink 1s infinite;
}

.status-text {
  font-size: 13px;
  font-weight: 600;
  color: #4caf50;
  white-space: nowrap;
}

.connection-status.disconnected .status-text {
  color: #ff4444;
}

.online-count {
  color: #a0a0a0;
  font-size: 13px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
