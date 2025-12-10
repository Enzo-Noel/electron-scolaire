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

// Types
export interface ChatMessage {
  id: string
  text: string
  username: string
  timestamp: number
  room: string
}

export interface User {
  username: string
  online: boolean
  lastSeen: number
  publicKey?: string
}

export interface Room {
  name: string
  description: string
  created: number
  type: 'public' | 'private'
  members?: string[]
}

// Utilitaires
export const generateMessageId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
