import Gun from 'gun'
import 'gun/sea'

// Configuration GUN - Initialisation côté renderer
export const gun = Gun({
  // Mode local uniquement (pas de peers distants)
  // Parfait pour le développement et les tests
  localStorage: false,
  radisk: true
})

console.log('[Gun] Initialized in LOCAL mode (no remote peers)')

// Export SEA for encryption/decryption
export const SEA = Gun.SEA

// Types
export interface ChatMessage {
  id: string
  text: string // Texte chiffré
  username: string
  timestamp: number
  fileTransfer?: FileTransfer // Optionnel : données de fichier si c'est un message avec fichier
}

export interface FileTransfer {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  fileData: string // Base64 chiffré
  thumbnail?: string // Base64 pour aperçu (images uniquement)
}

export interface User {
  username: string
  online: boolean
  lastSeen: number
  publicKey?: string // Clé publique pour le chiffrement
}

export interface KeyPair {
  pub: string
  priv: string
  epub: string
  epriv: string
}

// Utilitaires
export const generateMessageId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Constantes pour les fichiers
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
export const CHUNK_SIZE = 50 * 1024 // 50 KB pour les chunks

// Utilitaires fichiers
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export const isImageFile = (fileType: string): boolean => {
  return fileType.startsWith('image/')
}

export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}
