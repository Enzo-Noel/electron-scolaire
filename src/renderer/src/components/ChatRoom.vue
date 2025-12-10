<template>
  <div class="chat-room">
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

      <RoomList />
      <UserList />
    </div>

    <div class="main-content">
      <div class="chat-header">
        <h3># {{ chatStore.currentRoom }}</h3>
        <div class="room-info">
          <span class="online-indicator"></span>
          <span>{{ userStore.onlineCount }} en ligne</span>
          <button @click="showSettings = !showSettings" class="settings-btn" title="Configuration P2P">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <MessageList />
      <MessageInput />
    </div>

    <ServerSettings v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useChatStore } from '../stores/chat'
import RoomList from './RoomList.vue'
import UserList from './UserList.vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import ServerSettings from './ServerSettings.vue'

const userStore = useUserStore()
const chatStore = useChatStore()
const showSettings = ref(false)

let unsubscribeMessages: (() => void) | null = null
let unsubscribeTyping: (() => void) | null = null

const handleLogout = async () => {
  await userStore.logout()
}

onMounted(() => {
  // S'abonner aux messages de la room actuelle
  unsubscribeMessages = chatStore.subscribeToRoom(chatStore.currentRoom)

  // S'abonner aux indicateurs de frappe
  unsubscribeTyping = chatStore.subscribeToTyping(chatStore.currentRoom)
})

onUnmounted(() => {
  if (unsubscribeMessages) unsubscribeMessages()
  if (unsubscribeTyping) unsubscribeTyping()
})
</script>

<style scoped>
.chat-room {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  background: #252525;
  border-right: 1px solid #3d3d3d;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
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

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #a0a0a0;
}

.online-indicator {
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.settings-btn {
  background: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
  margin-left: 4px;
}

.settings-btn:hover {
  background: #3d3d3d;
  color: #ffffff;
}

.settings-btn svg {
  transition: transform 0.3s ease;
}

.settings-btn:hover svg {
  transform: rotate(45deg);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
