import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SEA, MAX_FILE_SIZE, isImageFile, type FileTransfer } from '../gun'

// Secret partagé pour le chiffrement (même que les messages)
const CHAT_SECRET = 'p2p-chat-shared-secret-v1'

export const useFileTransferStore = defineStore('fileTransfer', () => {
  const uploadProgress = ref<Map<string, number>>(new Map())
  const downloadProgress = ref<Map<string, number>>(new Map())

  // Créer une miniature pour les images
  async function createThumbnail(file: File): Promise<string | undefined> {
    if (!isImageFile(file.type)) return undefined

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 200
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.onerror = () => resolve(undefined)
        img.src = e.target?.result as string
      }
      reader.onerror = () => resolve(undefined)
      reader.readAsDataURL(file)
    })
  }

  // Lire un fichier et le convertir en base64
  async function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Préparer un fichier pour l'envoi
  async function prepareFile(file: File, fileId: string): Promise<FileTransfer> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Le fichier est trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`)
    }

    uploadProgress.value.set(fileId, 0)

    try {
      // Lire le fichier en base64
      const base64Data = await readFileAsBase64(file)
      uploadProgress.value.set(fileId, 30)

      // Créer une miniature si c'est une image
      const thumbnail = await createThumbnail(file)
      uploadProgress.value.set(fileId, 50)

      // Chiffrer les données du fichier
      const encryptedData = await SEA.encrypt(base64Data, CHAT_SECRET)
      uploadProgress.value.set(fileId, 80)

      // Chiffrer la miniature si elle existe
      let encryptedThumbnail: string | undefined
      if (thumbnail) {
        const thumbnailBase64 = thumbnail.split(',')[1]
        encryptedThumbnail = await SEA.encrypt(thumbnailBase64, CHAT_SECRET)
      }

      uploadProgress.value.set(fileId, 100)

      const fileTransfer: FileTransfer = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: encryptedData,
        thumbnail: encryptedThumbnail
      }

      // Nettoyer après un court délai
      setTimeout(() => uploadProgress.value.delete(fileId), 1000)

      return fileTransfer
    } catch (error) {
      uploadProgress.value.delete(fileId)
      throw error
    }
  }

  // Déchiffrer et télécharger un fichier
  async function downloadFile(fileTransfer: FileTransfer) {
    downloadProgress.value.set(fileTransfer.id, 0)

    try {
      // Déchiffrer les données
      const decryptedData = await SEA.decrypt(fileTransfer.fileData, CHAT_SECRET)
      downloadProgress.value.set(fileTransfer.id, 50)

      if (!decryptedData) {
        throw new Error('Impossible de déchiffrer le fichier')
      }

      // Créer un blob et télécharger
      const byteCharacters = atob(decryptedData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: fileTransfer.fileType })

      downloadProgress.value.set(fileTransfer.id, 80)

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileTransfer.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      downloadProgress.value.set(fileTransfer.id, 100)

      // Nettoyer après un court délai
      setTimeout(() => downloadProgress.value.delete(fileTransfer.id), 1000)
    } catch (error) {
      downloadProgress.value.delete(fileTransfer.id)
      throw error
    }
  }

  // Déchiffrer une miniature pour affichage
  async function decryptThumbnail(encryptedThumbnail: string): Promise<string | null> {
    try {
      const decryptedBase64 = await SEA.decrypt(encryptedThumbnail, CHAT_SECRET)
      if (!decryptedBase64) return null
      return `data:image/jpeg;base64,${decryptedBase64}`
    } catch (error) {
      console.error('Erreur déchiffrement miniature:', error)
      return null
    }
  }

  return {
    uploadProgress,
    downloadProgress,
    prepareFile,
    downloadFile,
    decryptThumbnail
  }
})
