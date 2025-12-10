<template>
  <div class="room-list-container">
    <div class="section-header">
      <h3>Salons</h3>
      <button @click="showCreateRoom = !showCreateRoom" class="add-button" title="Créer un salon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <div v-if="showCreateRoom" class="create-room-form">
      <input
        v-model="newRoomName"
        type="text"
        placeholder="Nom du salon..."
        @keyup.enter="handleCreateRoom"
        @keyup.esc="showCreateRoom = false"
        class="room-input"
      />
      <div class="form-actions">
        <button @click="handleCreateRoom" class="create-btn" :disabled="!newRoomName.trim()">
          Créer
        </button>
        <button @click="showCreateRoom = false" class="cancel-btn">Annuler</button>
      </div>
    </div>

    <div class="room-list">
      <div
        v-for="room in roomStore.myRooms"
        :key="room.name"
        class="room-item"
        :class="{ active: chatStore.currentRoom === room.name }"
        @click="handleSelectRoom(room.name)"
      >
        <div class="room-icon">#</div>
        <div class="room-info">
          <div class="room-name">{{ room.name }}</div>
          <div v-if="room.description" class="room-description">{{ room.description }}</div>
        </div>
      </div>

      <div v-if="roomStore.myRooms.length === 0" class="empty-rooms">
        <p>Aucun salon rejoint</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoomStore } from '../stores/room'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'

const roomStore = useRoomStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const showCreateRoom = ref(false)
const newRoomName = ref('')

let unsubscribeMessages: (() => void) | null = null
let unsubscribeTyping: (() => void) | null = null

const handleCreateRoom = async () => {
  if (!newRoomName.value.trim()) return

  try {
    await roomStore.createRoom(newRoomName.value.trim(), '', 'public')
    await roomStore.joinRoom(newRoomName.value.trim(), userStore.currentUser)
    newRoomName.value = ''
    showCreateRoom.value = false

    // Sélectionner automatiquement la nouvelle room
    handleSelectRoom(newRoomName.value.trim())
  } catch (error) {
    console.error('Erreur création room:', error)
  }
}

const handleSelectRoom = (roomName: string) => {
  // Nettoyer les anciens abonnements
  if (unsubscribeMessages) unsubscribeMessages()
  if (unsubscribeTyping) unsubscribeTyping()

  // Changer de room
  chatStore.changeRoom(roomName)

  // S'abonner aux nouveaux messages
  unsubscribeMessages = chatStore.subscribeToRoom(roomName)
  unsubscribeTyping = chatStore.subscribeToTyping(roomName)
}

onMounted(() => {
  // Rejoindre la room générale par défaut
  roomStore.joinRoom('general', userStore.currentUser).catch(console.error)
})

onUnmounted(() => {
  if (unsubscribeMessages) unsubscribeMessages()
  if (unsubscribeTyping) unsubscribeTyping()
})
</script>

<style scoped>
.room-list-container {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #3d3d3d;
  max-height: 50%;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #a0a0a0;
}

.add-button {
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

.add-button:hover {
  background: #3d3d3d;
  color: #ffffff;
}

.create-room-form {
  padding: 0 20px 12px;
}

.room-input {
  width: 100%;
  padding: 8px 12px;
  background: #1e1e1e;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.room-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.create-btn,
.cancel-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.create-btn {
  background: #667eea;
  color: #ffffff;
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: #3d3d3d;
  color: #e0e0e0;
}

.room-list {
  overflow-y: auto;
  padding-bottom: 8px;
}

.room-list::-webkit-scrollbar {
  width: 4px;
}

.room-list::-webkit-scrollbar-track {
  background: transparent;
}

.room-list::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 2px;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.room-item:hover {
  background: #2d2d2d;
}

.room-item.active {
  background: #3d3d3d;
}

.room-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #a0a0a0;
  flex-shrink: 0;
}

.room-item.active .room-icon {
  color: #667eea;
}

.room-info {
  flex: 1;
  min-width: 0;
}

.room-name {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-description {
  font-size: 12px;
  color: #707070;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-rooms {
  padding: 20px;
  text-align: center;
  color: #707070;
  font-size: 13px;
}

.empty-rooms p {
  margin: 0;
}
</style>
