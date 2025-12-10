<template>
  <div class="message-input-container">
    <form @submit.prevent="handleSendMessage" class="message-form">
      <input
        v-model="messageText"
        type="text"
        placeholder="Écrivez un message..."
        class="message-input"
        @input="handleTyping"
        @focus="handleTyping"
        @blur="handleStopTyping"
        :disabled="isSending"
      />
      <button type="submit" class="send-button" :disabled="!messageText.trim() || isSending">
        <svg
          v-if="!isSending"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
        <span v-else class="spinner"></span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'

const chatStore = useChatStore()
const userStore = useUserStore()

const messageText = ref('')
const isSending = ref(false)
let typingTimeout: ReturnType<typeof setTimeout> | null = null

const handleSendMessage = async () => {
  if (!messageText.value.trim() || isSending.value) return

  isSending.value = true
  const text = messageText.value.trim()
  messageText.value = ''

  // Arrêter l'indicateur de frappe
  handleStopTyping()

  try {
    await chatStore.sendMessage(text, userStore.currentUser)
  } catch (error) {
    console.error('Erreur envoi message:', error)
    // Remettre le texte en cas d'erreur
    messageText.value = text
  } finally {
    isSending.value = false
  }
}

const handleTyping = () => {
  // Indiquer qu'on est en train d'écrire
  chatStore.setUserTyping(userStore.currentUser, true)

  // Réinitialiser le timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }

  // Arrêter l'indicateur après 3 secondes d'inactivité
  typingTimeout = setTimeout(() => {
    handleStopTyping()
  }, 3000)
}

const handleStopTyping = () => {
  chatStore.setUserTyping(userStore.currentUser, false)
  if (typingTimeout) {
    clearTimeout(typingTimeout)
    typingTimeout = null
  }
}
</script>

<style scoped>
.message-input-container {
  padding: 16px 24px;
  background: #252525;
  border-top: 1px solid #3d3d3d;
}

.message-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  border-radius: 24px;
  color: #ffffff;
  font-size: 15px;
  transition: border-color 0.2s;
  outline: none;
}

.message-input:focus {
  border-color: #667eea;
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message-input::placeholder {
  color: #707070;
}

.send-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:active:not(:disabled) {
  transform: scale(0.95);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
