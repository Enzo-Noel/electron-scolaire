<template>
  <div class="file-message" :class="{ 'with-thumbnail': hasThumbnail }">
    <!-- Miniature pour les images -->
    <div v-if="hasThumbnail && thumbnailUrl" class="file-thumbnail" @click="handleDownload">
      <img :src="thumbnailUrl" :alt="fileTransfer.fileName" />
      <div class="thumbnail-overlay">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      </div>
    </div>

    <!-- Informations du fichier -->
    <div class="file-info">
      <div class="file-header">
        <svg class="file-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span class="file-name">{{ fileTransfer.fileName }}</span>
      </div>

      <div class="file-meta">
        <span class="file-size">{{ formattedSize }}</span>
        <span class="file-type">{{ fileExtension.toUpperCase() }}</span>
      </div>

      <!-- Bouton de téléchargement -->
      <button
        @click="handleDownload"
        class="download-btn"
        :disabled="isDownloading"
        :title="isDownloading ? 'Téléchargement en cours...' : 'Télécharger le fichier'"
      >
        <svg v-if="!isDownloading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span v-if="isDownloading" class="spinner"></span>
        <span>{{ isDownloading ? `${downloadPercent}%` : 'Télécharger' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFileTransferStore } from '../stores/fileTransfer'
import { formatFileSize, getFileExtension, isImageFile, type FileTransfer } from '../gun'

const props = defineProps<{
  fileTransfer: FileTransfer
}>()

const fileTransferStore = useFileTransferStore()
const thumbnailUrl = ref<string | null>(null)

const hasThumbnail = computed(() => {
  return !!props.fileTransfer?.thumbnail && isImageFile(props.fileTransfer?.fileType || '')
})

const formattedSize = computed(() => {
  return formatFileSize(props.fileTransfer?.fileSize || 0)
})

const fileExtension = computed(() => {
  if (!props.fileTransfer?.fileName) return 'file'
  return getFileExtension(props.fileTransfer.fileName) || 'file'
})

const downloadPercent = computed(() => {
  if (!props.fileTransfer?.id) return 0
  return Math.round(fileTransferStore.downloadProgress.get(props.fileTransfer.id) || 0)
})

const isDownloading = computed(() => {
  if (!props.fileTransfer?.id) return false
  return fileTransferStore.downloadProgress.has(props.fileTransfer.id)
})

const handleDownload = async () => {
  if (isDownloading.value || !props.fileTransfer) return

  try {
    await fileTransferStore.downloadFile(props.fileTransfer)
  } catch (error) {
    console.error('Erreur téléchargement fichier:', error)
    alert('Erreur lors du téléchargement du fichier')
  }
}

// Déchiffrer la miniature au montage
onMounted(async () => {
  if (props.fileTransfer?.thumbnail) {
    thumbnailUrl.value = await fileTransferStore.decryptThumbnail(props.fileTransfer.thumbnail)
  }
})
</script>

<style scoped>
.file-message {
  background: #2a2a2a;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 12px;
  max-width: 400px;
  transition: all 0.2s;
}

.file-message:hover {
  border-color: #4a4a4a;
  background: #2d2d2d;
}

.file-message.with-thumbnail {
  padding: 0;
  overflow: hidden;
}

.file-thumbnail {
  position: relative;
  width: 100%;
  height: 200px;
  cursor: pointer;
  overflow: hidden;
  background: #1a1a1a;
}

.file-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.file-thumbnail:hover img {
  transform: scale(1.05);
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: #ffffff;
}

.file-thumbnail:hover .thumbnail-overlay {
  opacity: 1;
}

.file-info {
  padding: 12px;
}

.with-thumbnail .file-info {
  padding: 12px;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.file-icon {
  color: #667eea;
  flex-shrink: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #a0a0a0;
}

.file-type {
  padding: 2px 8px;
  background: #3d3d3d;
  border-radius: 4px;
  font-weight: 600;
}

.download-btn {
  width: 100%;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.download-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.download-btn:active:not(:disabled) {
  transform: translateY(0);
}

.download-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
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
