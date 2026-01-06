<template>
  <div class="message-input-container">
    <!-- Aperçu du fichier sélectionné -->
    <div v-if="selectedFile" class="file-preview">
      <div class="preview-content">
        <svg class="file-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <div class="file-details">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>
        <button @click="clearFile" class="clear-file-btn" type="button" title="Annuler">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
        <div class="progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
      </div>
    </div>

    <form @submit.prevent="handleSendMessage" class="message-form">
      <!-- Bouton d'upload de fichier -->
      <input
        ref="fileInputRef"
        type="file"
        @change="handleFileSelect"
        class="file-input"
        accept="*/*"
      />
      <button
        type="button"
        @click="triggerFileInput"
        class="file-button"
        :disabled="isSending || isUploading"
        title="Joindre un fichier"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>

      <input
        ref="inputRef"
        v-model="messageText"
        type="text"
        placeholder="Écrivez un message..."
        class="message-input"
        @input="handleTyping"
        @blur="handleStopTyping"
        :disabled="isSending || isUploading"
      />
      <button
        type="submit"
        class="send-button"
        :disabled="(!messageText.trim() && !selectedFile) || isSending || isUploading"
      >
        <svg
          v-if="!isSending && !isUploading"
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
import { ref, nextTick, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import { useUserStore } from '../stores/user'
import { useFileTransferStore } from '../stores/fileTransfer'
import { formatFileSize as formatSize, MAX_FILE_SIZE } from '../gun'

const chatStore = useChatStore()
const userStore = useUserStore()
const fileTransferStore = useFileTransferStore()

const messageText = ref('')
const isSending = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
let typingTimeout: ReturnType<typeof setTimeout> | null = null

const formatFileSize = (size: number) => formatSize(size)

const uploadProgress = computed(() => {
  if (!selectedFile.value) return 0
  const fileId = selectedFile.value.name + selectedFile.value.size
  return fileTransferStore.uploadProgress.get(fileId) || 0
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    alert(`Le fichier est trop volumineux. Taille maximale : ${MAX_FILE_SIZE / 1024 / 1024} MB`)
    target.value = ''
    return
  }

  selectedFile.value = file
  target.value = '' // Réinitialiser l'input pour permettre de sélectionner le même fichier
}

const clearFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleSendMessage = async () => {
  if ((!messageText.value.trim() && !selectedFile.value) || isSending.value || isUploading.value) return

  const text = messageText.value.trim()
  const file = selectedFile.value

  // Arrêter l'indicateur de frappe
  handleStopTyping()

  try {
    if (file) {
      // Envoi avec fichier
      isUploading.value = true
      await chatStore.sendMessageWithFile(text, file, userStore.currentUser, userStore.keyPair)
      clearFile()
    } else {
      // Envoi simple
      isSending.value = true
      await chatStore.sendMessage(text, userStore.currentUser, userStore.keyPair)
    }

    messageText.value = ''
  } catch (error) {
    console.error('Erreur envoi message:', error)
    alert('Erreur lors de l\'envoi du message')
  } finally {
    isSending.value = false
    isUploading.value = false
    // Remettre le focus sur l'input après l'envoi
    nextTick(() => {
      inputRef.value?.focus()
    })
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

.file-preview {
  margin-bottom: 12px;
  background: #1e1e1e;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  overflow: hidden;
}

.preview-content {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  color: #667eea;
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #a0a0a0;
}

.clear-file-btn {
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

.clear-file-btn:hover {
  background: #3d3d3d;
  color: #ff6b6b;
}

.upload-progress {
  height: 3px;
  background: #1e1e1e;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.message-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.file-input {
  display: none;
}

.file-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #1e1e1e;
  border: 2px solid #3d3d3d;
  color: #a0a0a0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.file-button:hover:not(:disabled) {
  border-color: #667eea;
  color: #667eea;
  background: #252525;
}

.file-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
