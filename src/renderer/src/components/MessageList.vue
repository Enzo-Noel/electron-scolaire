<template>
  <div class="message-list" ref="messageContainer">
    <div v-if="chatStore.sortedMessages.length === 0" class="empty-state">
      <p>Aucun message pour le moment</p>
      <p class="hint">Soyez le premier à envoyer un message !</p>
    </div>

    <div v-else class="messages">
      <div
        v-for="message in chatStore.sortedMessages"
        :key="message.id"
        class="message"
        :class="{ 'own-message': message.username === userStore.currentUser }"
      >
        <div class="message-header">
          <span class="message-username">{{ message.username }}</span>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>

        <!-- Message avec fichier -->
        <div v-if="message.fileTransfer" class="message-with-file">
          <FileMessage :fileTransfer="message.fileTransfer" />
          <div v-if="message.text" class="message-content file-caption">{{ message.text }}</div>
        </div>

        <!-- Message texte simple -->
        <div v-else class="message-content">{{ message.text }}</div>
      </div>
    </div>

    <div v-if="otherTypingUsers.length > 0" class="typing-indicator">
      <span class="typing-text">
        {{ formatTypingUsers(otherTypingUsers) }}
        {{ otherTypingUsers.length === 1 ? 'est en train d\'écrire' : 'sont en train d\'écrire' }}
      </span>
      <span class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'
import FileMessage from './FileMessage.vue'

const chatStore = useChatStore()
const userStore = useUserStore()
const messageContainer = ref<HTMLElement | null>(null)

// Filtrer les utilisateurs qui tapent (sans l'utilisateur actuel)
const otherTypingUsers = computed(() => {
  return chatStore.typingUsers.filter((user) => user !== userStore.currentUser)
})

// Formater le temps
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes}min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formater la liste des utilisateurs qui tapent
const formatTypingUsers = (users: string[]): string => {
  if (users.length === 0) return ''
  if (users.length === 1) return users[0]
  if (users.length === 2) return `${users[0]} et ${users[1]}`
  return `${users.slice(0, -1).join(', ')} et ${users[users.length - 1]}`
}

// Auto-scroll vers le bas quand de nouveaux messages arrivent
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// Observer les changements de messages
watch(
  () => chatStore.sortedMessages.length,
  () => {
    scrollToBottom()
  }
)

// Scroll initial
scrollToBottom()
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: #1e1e1e;
}

.message-list::-webkit-scrollbar {
  width: 8px;
}

.message-list::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.message-list::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 4px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: #4d4d4d;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #a0a0a0;
  text-align: center;
}

.empty-state p {
  margin: 8px 0;
}

.hint {
  font-size: 14px;
  color: #707070;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 70%;
}

.own-message {
  align-self: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.message-username {
  font-weight: 600;
  color: #667eea;
}

.own-message .message-username {
  color: #4caf50;
}

.message-time {
  color: #707070;
  font-size: 12px;
}

.message-content {
  background: #252525;
  padding: 12px 16px;
  border-radius: 12px;
  color: #e0e0e0;
  word-wrap: break-word;
  line-height: 1.5;
}

.own-message .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.message-with-file {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-caption {
  margin-top: 4px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 8px 12px;
  background: #252525;
  border-radius: 8px;
  width: fit-content;
}

.typing-text {
  font-size: 13px;
  color: #a0a0a0;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #a0a0a0;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}
</style>
